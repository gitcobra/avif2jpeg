// legacy converter that runs in single thread

import type { FileWithId, SingleImageDataType } from './converter.vue';
import AnZip from '@gitcobra/anzip';

import type Converter from './converter.vue';
import type ConversionStatus from './status.vue';

type ConverterType = InstanceType<typeof Converter>;
type Props = ConverterType['$props'];
type ConversionStatusType = InstanceType<typeof ConversionStatus>;
type Stat = ConversionStatusType['status'];


export async function convertImagesInSingleThread(list: FileWithId[], completedFileIdSet: Set<number>, SingleImageData: SingleImageDataType, props: Props, canceled, ConvStats: Stat ) {
  let currentImgBlobUrl = '';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let azip = new AnZip;
  const type = props.format;
  const quality = props.quality / 100;
  const ext = [...type.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/, 'jpg');

  const fileCount = list.length;
  const maxZipSizeMB = props.maxZipSizeMB * 1024 * 1024;

  let index = 0;
  let lastImageBlob = null;
  let lastImageName = '';
  let lastImageWidth = 0;
  let lastImageHeight = 0;

  let outputSize = 0;
  let _keyCounter = 0;
  let zippedCount = 0;
  let currentOutputSizeSum = 0;
  let memoryProblemOccurred = false;
  for( const file of list ) {
    if( canceled.value )
      break;

    const fileName = file.name;
    let fname: string = '';
    const inputSize = file.size;
    const path = (file.webkitRelativePath || (file as any).relativePath || fileName).replace(/^\//, '');
    const img: HTMLImageElement = document.createElement('img');

    index++;
    const item: Stat['logs'][number] = {
      key: _keyCounter++,
      core: -1,
      index,
      path,
      command: `➡️start`,
    };
    ConvStats.index = index;
    ConvStats.logs.push(item);
    let curLogItemIdx = ConvStats.logs.length - 1;

    let abuffer: ArrayBuffer;
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


    // failed to load or canceled
    if( !img.complete || !imgloaded || canceled.value ) {
      ConvStats.done++;
      ConvStats.failure++;
      item.command = `❗failed`;
      
      continue;
    }

    // draw on the canvas
    const w = img.width;
    const h = img.height;
    canvas.width = w;
    canvas.height = h;
    lastImageWidth = w;
    lastImageHeight = h;
    ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
    item.command = `🖼️imgload`;
    ConvStats.thumbnail = img;

    // get the converted image as an ArrayBuffer
    abuffer = await new Promise<ArrayBuffer>(resolve => {
      const callback = (blob: Blob) => {
        lastImageBlob = blob;
        resolve( blob?.arrayBuffer() );
      };
      canvas.toBlob(callback, type, quality);
    });
    
    if( canceled.value )
      break;

    // toBlob failure
    if( !abuffer ) {
      console.log('failed to toBlob', fileName);
      ConvStats.failure++;
      continue;
    }

    outputSize = abuffer.byteLength;
    ConvStats.converted++;
    
    // emit a zip when the current total size exceeds maxZipSize
    let zipUrl = '';
    if( /*restItemCount > 5 &&*/ currentOutputSizeSum + outputSize >= maxZipSizeMB ) {
      try {
        zipUrl = azip.url();
      } catch(e: any) {
        memoryProblemOccurred = true;
        console.warn(e.message, currentOutputSizeSum);
        alert("memory problem occurred");
        break;
      }
      ConvStats.zips.push({url: zipUrl, size:currentOutputSizeSum, count:zippedCount});
      ConvStats.zipped += zippedCount;
      ConvStats.zippedTotalSize += currentOutputSizeSum;
      
      currentOutputSizeSum = 0;
      zippedCount = 0;
      azip.clear();
      azip = new AnZip();
    }

    currentOutputSizeSum += outputSize;
    
    const basename = (path || fileName);
    // add a number to the filname if the name already exists in the zip file
    for( let dupCounter = 1; dupCounter < 0xFF; dupCounter++ ) {
      fname = basename.replace(props.retainExtension? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '') + (dupCounter > 1 ? `(${dupCounter})` : '') + '.' + ext;
      if( azip.has(fname) ) {
        continue;
      }
      break;
    }


    ConvStats.done++;
    try {
      zippedCount++;
      azip.add(fname, abuffer);
      ConvStats.inputTotalSize += inputSize;
      ConvStats.outputTotalSize += outputSize;
    }
    catch(e: any) {
      console.error(e.message);
      //failure++;
      //emit('failure', {name: fileName});
      continue;
    }
    

    lastImageName = fname;
    ConvStats.success++;
    item.command = `✅completed`;
    item.completed = true;
    completedFileIdSet.add(file._id);
  }
  

  // convert last image buffer to DataURI
  if( ConvStats.success > 0 ) {
    if( fileCount === 1 ) {
      if( lastImageBlob ) {
        SingleImageData.convertedImageBlob = lastImageBlob;
        SingleImageData.convertedImageName = lastImageName;
        SingleImageData.convertedImageWidth = lastImageWidth;
        SingleImageData.convertedImageHeight = lastImageHeight;
      }
    }
    else {
      // emit as ZIP
      try {
        if( memoryProblemOccurred )
          throw new Error(`terminated zipping process for memory problems`);
        const zipUrl = azip.url();
        ConvStats.zips.push({url: zipUrl, count: zippedCount, size:currentOutputSizeSum});
        ConvStats.zipped += zippedCount;
        ConvStats.zippedTotalSize += currentOutputSizeSum;
      } catch(e: any) {
        console.error(e.message);
      }
    }
  }

  const Terminated = {value:false};
  const callbackToClearConverter = () => {
    Terminated.value = true;
  };
  let doneCalled = false;
  const callbackToGenerateFailedZips = async (list: FileWithId[]) => {
    if( doneCalled )
      return;
    doneCalled = true;
    pushErrorZips(list, maxZipSizeMB, ConvStats, Terminated);
  };

  return {
    callbackToClearConverter,
    callbackToGenerateFailedZips,
  };
}

async function pushErrorZips(list: File[], maxZipSizeMB: number, ConvStats, Terminated) {
  let count = 0;
  let size = 0;
  let azip = new AnZip;
  for( let i = 0; i < list.length; i++ ) {
    const file = list[i];
    const path = (file.webkitRelativePath || file.name).replace(/^\//, '');
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    }
    catch(e) {
      console.warn(path);
      ConvStats.failedToCreateFailedZip = true;
      return;
    }

    if( Terminated.value )
      return;
    azip.add(path, buffer);
    size += file.size;
    count++;
    ConvStats.failedFileZippedCount++;

    if( size >= maxZipSizeMB || i === list.length - 1 ) {
      const url = azip.url();
      ConvStats.failedZips.push({url, size, count});    
      azip.clear();
      size = 0;
      count = 0;
    }
  }

  ConvStats.failedZipDone = true;
}


export function getAsPromise(onloadableElement: any) {
  if( typeof onloadableElement.onload === 'undefined' )
    throw new Error(`it doesn't have "onload" property.`);

  return new Promise((res, rej) => {
    onloadableElement.onload = res;
    onloadableElement.onerror = rej;
  });
}
