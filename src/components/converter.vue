<template>
  <div ref="container" class="droptarget" :style="style">
    <slot></slot>
  </div>
  <canvas ref="canvas" width="1" height="1" style="display:none"></canvas>
</template>

<script lang="ts">
import { ref, watch, onMounted, getCurrentInstance, VueElement, defineComponent } from 'vue';
import { useMessage, useNotification, NotificationType } from 'naive-ui';

// uncompressed zip library
// eslint-disable-next-line
/* eslint-disable-next-line*/ /*@ts-ignore*/
var AnZip=function(){"object"==typeof module&&"object"==typeof exports&&(module.exports=AnZip);for(var UseTA="undefined"!=typeof Uint8Array,A8=UseTA?Uint8Array:Array,CRC32Table=new(UseTA?Uint32Array:Array)(256),i=0;i<256;i++){for(var val=i,j=0;j<8;j++)val=1&val?3988292384^val>>>1:val>>>1;CRC32Table[i]=val}function strToUTF8(str){var a=[];return encodeURIComponent(str).replace(/%(..)|(.)/g,function(m,$1,$2){a.push($1?parseInt($1,16):$2.charCodeAt(0))}),UseTA?new A8(a):a}function getLE32(num){return[255&num,num>>8&255,num>>16&255,num>>24&255]}function AnZip(){this._d={},this._lfh=[],this._curLFHind=0,this._cdh=[],this._cdhLen=0,this._c=0}return AnZip.prototype={add:function(path,dat){if(!path)throw new Error("path is empty");if(path=String(path).replace(/\\/g,"/"),/\/{2,}|\\|^\/|^[a-z]+:/i.test(path))throw new Error('invalid path. containing a drive letter, a leading slash, or empty directory name: "'+path+'"');var size=0,crc=0;if(void 0!==dat){if(!/[^/]+$/.test(path))throw new Error('needs a file name: "'+path+'"');if(!((dat="string"==typeof dat?strToUTF8(dat):dat)instanceof A8))try{if(!(dat.buffer||dat instanceof Array||dat instanceof ArrayBuffer||dat instanceof Buffer))throw new Error;dat=new Uint8Array(dat.buffer||dat)}catch(e){throw new Error("data must be one of type Array, TypedArray, ArrayBuffer, Buffer, or string.")}if(this.has(path))throw new Error("the file already exists: "+path);size=dat.length,crc=function(dat){for(var crc=4294967295,i=0,len=dat.length;i<len;i++)crc=CRC32Table[255&(crc^dat[i])]^crc>>>8;return(4294967295^crc)>>>0}(dat)}for(var d=new Date,date=getLE32(d.getFullYear()-1980<<25|d.getMonth()+1<<21|d.getDate()<<16|d.getHours()<<11|d.getMinutes()<<5|d.getSeconds()/2),dirs=path.replace(/\/+$/,"").split("/"),pathstack="";dirs.length;){pathstack+=dirs.shift();var pathbin,pathLen,dsize,dup,isFile=dat&&0===dirs.length;pathstack+=isFile?"":"/",this._d[pathstack]||(this._d[pathstack]=!0,this._c++,pathLen=(pathbin=strToUTF8(pathstack)).length,dup=getLE32(dsize=isFile?size:0),this._lfh.push([80,75,3,4]),dup=[10,0,0,8,0,0].concat(date,getLE32(isFile?crc:0),dup,dup,[255&pathLen,pathLen>>8&255,0,0]),this._lfh.push(dup,pathbin),this._cdh.push([80,75,1,2,10,0].concat(dup,[0,0,0,0,0,0,isFile?0:16,0,0,0],getLE32(this._curLFHind)),pathbin),this._cdhLen+=46+pathLen,this._curLFHind+=30+pathLen+dsize)}dat&&this._lfh.push(dat)},has:function(path){return!!this._d[path.replace(/\/+$/,"")]},zip:function(){var ecd=[80,75,5,6,0,0,0,0,255&this._c,this._c>>8,255&this._c,this._c>>8].concat(getLE32(this._cdhLen),getLE32(this._curLFHind),[0,0]),arrayChain=this._lfh.concat(this._cdh,[ecd]);if(A8===Array)output=[].concat.apply([],arrayChain);else for(var offset=0,output=new A8(this._curLFHind+this._cdhLen+ecd.length),i=0;i<arrayChain.length;i++){var n=arrayChain[i];output.set(n,offset),offset+=n.length}return output},url:function(){if("function"!=typeof Blob||"function"!=typeof URL)return null;var blob=this.zip(),blob=new Blob([blob],{type:"application/zip"});return window.URL.createObjectURL(blob)}},AnZip}();

let processing = false;
let disturbed = false;
let formats: string[] = ['image/png'];
export default defineComponent({
  name: 'converter',
  emits: ['mounted', 'start', 'progress', 'success', 'failure', 'complete', 'prevent', 'noimage', 'avifsupport', 'imgload'],
  props: {
    target: [HTMLElement, HTMLDocument],
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
    sendmessage: Array,
    style: Object,
    retainExtension: Boolean,
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  setup(props: any, context: any): any {
    const canvas = ref(null);
    let target: Node;
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
      setDropEvent(target as HTMLElement, ctx, context, props);

      formats = checkSupportedImageFormats();
      context.emit('mounted', {formats});

      context.emit('avifsupport', await checkAvifSupport());
    });

    watch(() => props.input, (val) => {
      //if( val.length )
      if( val.length )
        startConvert(val, ctx, context, props);
    });

    watch(() => props.sendmessage, ([opt={}, type='info']) => {
      if( /destroy/.test(opt) ) {
        //message.destroyAll();
        notification.destroyAll();
        return;
      }
      //message[type](opt.content, opt);
      notification[type](opt);
    });

    // stop conversion
    watch(() => props.processing, (val) => {
      if( !val ) {
        disturbed = true;
      }
    });

    return {
      container,

      canvas,
      //download,
    };
  }
});

function setDropEvent(droptarget: HTMLElement, ctx, instance, props) {
  document.ondragstart = (ev) => ev.preventDefault();
  document.ondragover = (ev) => ev.preventDefault();
  droptarget.ondrop = async (ev: DragEvent) => {
      ev.preventDefault();
      startConvert(ev.dataTransfer?.files as FileList, ctx, instance, props);
  };
}

const ImageFileExtensions = ['.tif', '.tiff', '.ico', '.cur', '.bmp', '.webp', '.svg', '.png', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.gif', '.avif', '.apng'];
function startConvert(dat, ctx, instance, props) {
  if( processing ) {
    instance.emit('prevent');
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
  if( props.accept ) {
    const accept = String(props.accept).toLowerCase();
    list = list.filter( item => props.accept.includes(item.name.replace(/^.+(\.[^.]+)$/, '$1').toLowerCase()) );
    if( !list.length ) {
      instance.emit('noimage');
      return;
    }
  }

  processing = true;
  disturbed = false;
  convertImages(list, ctx, instance, props);
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

async function convertImages(list, ctx, instance, props) {
  const canvas = ctx.canvas;
  const azip = new AnZip;
  const type = props.format;
  const quality = props.quality / 100;
  //const accept = props.accept || '';
  const ext = [...type.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/, 'jpg');
  instance.emit('start', {list, length: list.length});

  const length = list.length;
  let index = 0;
  let success = 0;
  let failure = 0;
  let lastImage = null;
  let lastName = '';
  for( const file of list ) {
    if( disturbed )
      break;

    const name = file.name;
    const inputSize = file.size;
    const path = file.relativePath || file.webkitRelativePath;
    const reader = new FileReader();
    const img: HTMLImageElement = document.createElement('img');
    instance.emit('progress', {file, name, success, failure, index, length});
    index++;

    // convert to dataURI
    let p: Promise<any> = getAsPromise(reader);
    reader.readAsDataURL(file);
    p = p.then((ev:any) => {
      const url = ev.target?.result as string;
      return url;
    });
    //const url = (await p) as string;

    // load img element
    p = p.then(url => {
      const p = getAsPromise(img);
      (img as any).src = url;
      return p;
    }).then(() => {
      return true;
    }).catch(() => {
      return false;
    });

    // wait for the promise
    const imgloaded: boolean = await p as boolean;
    if( disturbed )
      break;

    if( !img.complete || !imgloaded ) {
      failure++;
      instance.emit('failure', {file, name, success, failure, index, length});
      continue;
    }

    // draw to canvas
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    instance.emit('imgload', {width:img.width, height:img.height, img});

    // add to zip
    const b64 = canvas.toDataURL(type, quality);
    const bstr = atob( b64.split(',')[1] );
    const bin = Uint8Array.from(bstr, str => str.charCodeAt(0));
    const outputSize = bin.length;
    const fname = (path || name).replace(RegExp('\\.'+ext+'$', 'i'), '').replace(props.retainExtension? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '') + '.' + ext;
    azip.add(fname, bin);

    success++;
    lastImage = b64;
    lastName = fname;
    instance.emit('success', {file, name, img:b64, success, failure, index, length, inputSize, outputSize});
  }

  // emit as ZIP
  const url = azip.url();
  //instance.refs.download.href = src;
  instance.emit('complete', {aborted:disturbed, success, failure, index, length, zip:url, img:lastImage, name:lastName});
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
