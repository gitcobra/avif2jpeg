<template>
  <div ref="container" class="droptarget" :style="style">
    <slot></slot>
  </div>
  
  <!-- Firefox (currently v104) doesn't free memory when the canvas is invisible -->
  <canvas ref="canvas" style="position:absolute; width:1px; height:1px; z-index:-999;"></canvas>
</template>

<script lang="ts">
/*
https://github.com/vuejs/core/issues/4644
defineProps() in <script setup> cannot reference locally declared variables because it will be hoisted outside of the setup() function.
If your component options require initialization in the module scope, use a separate normal <script> to export the options instead.
*/
let formats: string[] = ['image/png']; // image file formats for saving supported by canvas
</script>

<script setup lang="ts">
import { ref, watch, onMounted, getCurrentInstance, VueElement, defineComponent } from 'vue';
import { useMessage, useNotification, NotificationType } from 'naive-ui';
import AnZip from '@gitcobra/anzip';

let processing = false;
let disturbed = false;
//let formats: string[] = ['image/png'];
let targetFiles = [];

let currentImgBlobUrl = '';
let lastImage = '';
let lastZipUrl = '';

const emit = defineEmits(['mounted', 'start', 'progress', 'success', 'failure', 'complete', 'prevent', 'noimage', 'avifsupport', 'imgload', 'consumeMessage', 'pushZip']);
const props = defineProps({
  target: [HTMLElement, Document],
  format: {
    type: String,
    default: formats[0],
    validator(val:string): boolean {
      return formats.includes(val)
    }
  },
  quality: {
    type: Number,
    default: 95,
    validator(val:number): boolean {
      return val >= 0 && val <= 100;
    }
  },
  //ignoreExtension: Boolean,
  accept: String, // accepted file types
  processing: Boolean,
  input: Array,
  sendmessage: [Array, String],
  style: Object,
  retainExtension: Boolean,
  maxZipSize: Number,
});

const canvas = ref(null);
let target: HTMLElement | Document;
let ctx: CanvasRenderingContext2D;
if( props.target && !(props.target instanceof Node) )
  throw new Error('target attribute must be a HTMLElement');

const container = ref(null);
//const download = ref(null);
const style = ref(null);

const message = useMessage();
const notification = useNotification();

onMounted(async () => {
  ctx = (canvas.value as any).getContext('2d');

  style.value = props.style;
  const cont: HTMLElement = container.value!;

  target = props.target || cont;
  setDropEvent(target as HTMLElement, ctx);

  formats = checkSupportedImageFormats();
  emit('mounted', {formats});

  emit('avifsupport', await checkAvifSupport());
});

watch(() => props.input, (val) => {
  if( val?.length ) {
    targetFiles = val;
    startConvert(val, ctx);
  }
});

// recieve sendmessage
watch(() => props.sendmessage, ( msg: string | any[] ) => {
  if( !msg )
    return;
  
  // do commands
  if( typeof msg === 'string' ) {
    switch(msg) {
      // remove all notifications
      case 'destroy':
        notification.destroyAll();
        break;
      // reconvert
      case 'reconvert':
        const list = targetFiles;
        if( list?.length ) {
          startConvert(list, ctx);
        }
        break;
    }
  }
  // show notification
  else if( msg instanceof Array ) {
    const [opt={}, type='info'] = msg;
    notification[type](opt);
  }

  emit('consumeMessage');
});

// stop conversion
watch(() => props.processing, (val) => {
  if( !val ) {
    disturbed = true;
  }
});



function setDropEvent(droptarget: HTMLElement, ctx) {
  document.ondragstart = (ev) => ev.preventDefault();
  document.ondragover = (ev) => ev.preventDefault();
  droptarget.ondrop = async (ev: DragEvent) => {
      ev.preventDefault();
      targetFiles = [...(ev.dataTransfer?.files||[])];
      startConvert(ev.dataTransfer?.files as FileList, ctx);
  };
}

function getFile(file: Event | FileList | File | File[]): File[] {
  let list: File[] | FileList;
  if( file instanceof Event ) {
    list = (file.target as HTMLInputElement).files as FileList;
  }
  else if( file instanceof File ) {
    list = [file];
  }
  else if( file instanceof FileList || file instanceof Array )
    list = file;
  else {
    console.log('could not find any file');
    return [];
  }

  return [...list];
}

const ImageFileExtensions = ['.tif', '.tiff', '.ico', '.cur', '.bmp', '.webp', '.svg', '.png', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.gif', '.avif', '.apng'];
function startConvert(dat, ctx) {
  if( processing ) {
    emit('prevent');
    return;
  }

  let list = getFile(dat);
  // check file extension
  /*
  if( !props.ignoreExtension ) {
    list = list.filter(item => {
      const ext = item.name.replace(/^.+(?=\.[^./\\]+$)/, '').toLowerCase();
      return ImageFileExtensions.includes(ext);
    });
    if( !list.length ) {
      //alert('could not find image files');
      instance.emit('noimage');
      return;
    }
  }
  */
  
  // check file extension
  const acceptsStr = String(props.accept).toLowerCase().replace(/\s+/g, '');
  if( acceptsStr ) {
    const accepts = acceptsStr.split(',');
    list = list.filter( item => accepts.includes(item.name.replace(/^.+(\.[^.]+)$/, '$1').toLowerCase()) );
    if( !list.length ) {
      emit('noimage');
      return;
    }
  }

  processing = true;
  disturbed = false;
  convertImages(list, ctx);
}

async function convertImages(list, ctx) {
  const canvas = ctx.canvas;
  let azip = new AnZip;
  const type = props.format;
  const quality = props.quality / 100;
  //const accept = props.accept || '';
  const ext = [...type.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/, 'jpg');
  
  if( lastImage )
    URL.revokeObjectURL( lastImage );
  if( lastZipUrl )
    URL.revokeObjectURL( lastZipUrl );
  if( currentImgBlobUrl ) {
    URL.revokeObjectURL(currentImgBlobUrl);
  }

  emit('start', {list, length: list.length});

  const startTime = new Date().getTime();
  const length = list.length;
  let index = 0;
  let success = 0;
  let failure = 0;
  let lastImageBlob = null;
  let lastName = '';
  lastImage = '';
  lastZipUrl = '';
  currentImgBlobUrl = '';
  let currentOutputSizeSum = 0;
  let memoryProblemOccurred = false;
  for( const file of list ) {
    if( disturbed )
      break;

    const name = file.name;
    const inputSize = file.size;
    const path = file.relativePath || file.webkitRelativePath;
    const img: HTMLImageElement = document.createElement('img');
    emit('progress', {name, index, length, success, failure});
    index++;

    // clear previous object url
    if( currentImgBlobUrl ) {
      URL.revokeObjectURL(currentImgBlobUrl);
      currentImgBlobUrl = '';
    }
    
    // convert to Object URL
    currentImgBlobUrl = URL.createObjectURL(file);

    // load img element
    img.src = currentImgBlobUrl;
    const imgloaded: boolean = await getAsPromise(img).then(() => true).catch(() => false);

    // fail to load or disturbed
    if( !img.complete || !imgloaded || disturbed ) {
      failure++;
      emit('failure', {file, name, success, failure, index, length});
      
      if( disturbed )
        break;
      else
        continue;
    }

    // draw to canvas
    const w = img.width;
    const h = img.height;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
    emit('imgload', {width:img.width, height:img.height, img});

    // add to zip
    /*
    const b64 = canvas.toDataURL(type, quality);
    const bstr = atob( b64.split(',')[1] );
    const bin = Uint8Array.from(bstr, str => str.charCodeAt(0));
    const outputSize = bin.length;
    */
    const bin = await new Promise<ArrayBuffer>(resolve => {
      const callback = blob => {
        lastImageBlob = blob;
        resolve( blob?.arrayBuffer() );
      };
      canvas.toBlob(callback, type, quality);
    });

    if( disturbed )
      break;

    // toBlob failure
    if( !bin ) {
      console.log('failed to toBlob', name);
      failure++;
      emit('failure', {name});
      continue;
    }

    const outputSize = bin.byteLength;
    
    // emit a zip when the current total size exceeds maxZipSize
    currentOutputSizeSum += outputSize;
    const restItemCount = length - index;
    if( restItemCount > 5 && currentOutputSizeSum > 1024 * 1024 * props.maxZipSize ) {
      try {
        lastZipUrl = azip.url();
      } catch(e: any) {
        failure++;
        emit('failure', {name: e.message});
        memoryProblemOccurred = true;
        alert("memory problem");
        break;
      }
      
      emit('pushZip', {zip: lastZipUrl, size: currentOutputSizeSum});
      
      currentOutputSizeSum = 0;
      azip.clear();
      azip = new AnZip();
    }
    
    //const fname = (path || name).replace(RegExp('\\.'+ext+'$', 'i'), '').replace(props.retainExtension? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '') + '.' + ext;
    const basename = (path || name);
    let fname: string;
    // add a number to the filname if the name already exists in the zip file
    for( let dupCounter = 1; dupCounter < 0xFF; dupCounter++ ) {
      fname = basename.replace(props.retainExtension? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '') + (dupCounter > 1 ? `(${dupCounter})` : '') + '.' + ext;
      if( azip.has(fname) ) {
        continue;
      }
      break;
    }

    try {
      azip.add(fname, bin);
    }
    catch(e: any) {
      console.error(e.message);
      failure++;
      emit('failure', {name});
      continue;
    }

    success++;
    //lastImage = b64;
    lastName = fname;
    emit('success', {name, success, failure, index, length, inputSize, outputSize});
  }

  // convert last image buffer to DataURI
  lastImage = '';
  let lastImageDataURL = '';
  if( lastImageBlob ) {
    lastImage = URL.createObjectURL(lastImageBlob);
    const reader = new FileReader;
    reader.readAsDataURL(lastImageBlob);
    lastImageDataURL = await getAsPromise(reader).then((ev:any) => ev.target.result);
  }

  const elapsedTime = new Date().getTime() - startTime;

  // emit as ZIP
  try {
    if( memoryProblemOccurred )
      throw new Error();
    lastZipUrl = azip.url();
  } catch(e: any) {
    console.error(e.message);
    failure++;
    success = 0;
    lastZipUrl = (new AnZip()).url();
    emit('failure', {name: e.message});
    emit('failure', {name: `failed to create a zip file. open the Advanced Settings and limit the max zip file size.`});
  }
  emit('complete', {aborted:disturbed, success, failure, index, size:currentOutputSizeSum, length, zip: lastZipUrl, lastImage, lastImageDataURL, name:lastName, inputFileCount:targetFiles.length, elapsedTime});

  processing = false;
}



function checkAvifSupport(): Promise<boolean> {
  const TestAVIFData = 'data:image/avif;base64,AAAAHGZ0eXBtaWYxAAAAAG1pZjFhdmlmbWlhZgAAAPJtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAABEAAAQABAAAAAAEWAAEAAAAgAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUltYWdlAAAAAHFpcHJwAAAAUmlwY28AAAAUaXNwZQAAAAAAAAAIAAAACAAAABBwYXNwAAAAAQAAAAEAAAAWYXYxQ4EgAAAKCDgIv2kBDQAgAAAAEHBpeGkAAAAAAwgICAAAABdpcG1hAAAAAAAAAAEAAQQBAoOEAAAAKG1kYXQKCDgIv2kBDQAgMhQWQAAASAAADAZuZXHwA9LzjNWygA==';
  const img = document.createElement('img');
  const prom = getAsPromise(img).then(() => true, () => false);
  img.src = TestAVIFData;

  return prom;
}

function checkSupportedImageFormats(): string[] {
  const Formats = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/bmp',
    'image/avif',
    'image/webp',
  ];

  const cv = document.createElement('canvas');
  cv.width = 1;
  cv.height = 1;

  const result: string[] = [];
  for( const f of Formats ) {
    const url = cv.toDataURL(f);
    if( url.indexOf(f) >= 0 ) {
      result.push(f);
    }
  }

  return result;
}

/*
async function convertToDatURLList(list: File[]): Promise<string[]> {
  const urllist: string[] = [];
  for( const file of list ) {
    const type = file.type;
    const reader = new FileReader();
    const p = getAsPromise(reader).then((ev:any) => {
      urllist.push(ev.target?.result as string);
    });
    reader.readAsDataURL(file);
    await p;
  }
  return urllist;
}

async function convertImageList(list: string[], ctx) {
  for( const url of list ) {
    const img = new Image();
    const p = getAsPromise(img).then(ev => {
      ctx.drawImage(img, 0, 0);
    }).catch(e => {
      //
    });
    img.src = url;
    await p;
  }
}
*/


function getAsPromise(onloadableElement: any) {
  if( typeof onloadableElement.onload === 'undefined' )
    throw new Error(`it doesn't have "onload" property.`);

  return new Promise((res, rej) => {
    onloadableElement.onload = res;
    onloadableElement.onerror = rej;
  });
}


</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.droptarget {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: large;
  width: 100%;
  height: 100%;
}
</style>
