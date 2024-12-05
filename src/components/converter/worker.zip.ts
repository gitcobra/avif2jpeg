import AnZip from "@gitcobra/anzip-es6";


console.log('converter.worker.zip started');

const zipList: AnZip[] = [];
const zipListLengthStack = [];
let entireIndex = 0;
const fileIdByIndex = new Map<number, number>();
const errorZipList: AnZip[] = [];
let azip = new AnZip();
zipList.push(azip);
let bytesSum = 0;
let count = 0;
let terminated = false;

let MaxZipSize = 1024 * 1024 * 1024;
let keepPrevExtension = false;
let outputExtension = '';
let outputImageType = '';




// message from main thread
type ZipMessageType = MessageEvent<{
  action: string
  
  // configurations
  zipSize?: number
  keepExt?: boolean
  outputExt?: string
  imageType?: string

  // for failed file
  //buffer?: ArrayBuffer
  file?: Blob
  path?: string

  // request-image
  index?: number
}>;
type ImageMessageToMain = {
  action: 'respond-image'
  url: string
  path: string
  index: number
  size: number
  fileId: number
};
self.onmessage = async (params: ZipMessageType) => {
  const { data: { action, zipSize, keepExt, outputExt, file, index, /*buffer,*/ path, imageType }, ports } = params;
  console.log('zipworker: ' + action);

  switch( action ) {
    case 'set-port': {
      const port = ports[0];
      port.onmessage = (params) => onmessageFromCanvasWorkers(params, port);
      return;
    }
    case 'set-config':
      MaxZipSize = zipSize;
      keepPrevExtension = !!keepExt;
      outputExtension = outputExt || '';
      outputImageType = imageType || '';
      break;
    case 'squeeze':
      //self.close();
      // NOTE:
      // when this worker was terminated, main thread could not access those blob urls created by this.
      // so just flag ignoring the messages from canvas.workers instead of terminating this.
      terminated = true;

      // NOTE:
      // delayed to wait previous stacking buffer
      setTimeout(() => outputZipUrl('squeeze-zip'), 10);
      break;

    
    case 'clear':
      azip.clear();
      count = 0;
      bytesSum = 0;
      break;
    
    case 'add-filelist': {
      if( bytesSum >= MaxZipSize ) {
        outputZipUrl('push-filelist-zip');
      }
      //const path = (webkitRelativePath || file.webkitRelativePath || file.name).replace(/^\//, '');
      //const buf = await file.arrayBuffer();
      //azip.add(path, buffer);
      //bytesSum += buffer.byteLength;      

      const success = await azip.add(path, file);
      if( success ) {
        
        bytesSum += file.size;
        count++;
      }
      let message: ZippingMessageToMain = {
        action: 'push-filelist',
        size: bytesSum,
        count,
      };
      self.postMessage( message );
      break;
    }
    case 'squeeze-filelist':
      await new Promise(r => setTimeout(r, 10));
      outputZipUrl('squeeze-filelist-zip');
      break;
    
    case 'request-image': {
      let targetazip: AnZip = azip;
      let targetidx = index;
      for( let i = 0; i < zipListLengthStack.length; i++ ) {
        if( index <= zipListLengthStack[i] - 1 ) {
          targetidx = i > 0 ? index - zipListLengthStack[i - 1] : index;
          targetazip = zipList[i];
          break;
        }
        if( i === zipListLengthStack.length - 1 ) {
          targetidx = index - zipListLengthStack[i];
          break;
        }
      }

      const blob = targetazip.get(targetidx, outputImageType);
      if( !blob ) {
        console.warn(index, targetidx, blob);
        console.warn(zipListLengthStack);
        break;
      }
      const path = targetazip.getPathByIndex(targetidx);
      const url = URL.createObjectURL(blob);
      let message: ImageMessageToMain = {
        action: 'respond-image',
        url,
        index,
        path,
        fileId: fileIdByIndex.get(index),
        size: blob.size,
      };
      self.postMessage( message );
      break;
    }
    default:
      console.error(`zip.worker got an unknown action. "${action}"`);
      break;
  }
};




// message from canvas worker
type ZipMessageFromCanvasType = MessageEvent<{
  //action: string
  //data?: ArrayBuffer | Uint8Array
  blob: Blob
  //zipSize?: number
  path?: string
  outputPath?: string
  fileId: number
}>;
type AddingZipMessageToMain = {
  action: 'add-zip-completed'
  fileId: number
};
// listener for canvasWorker
const onmessageFromCanvasWorkers = (params: ZipMessageFromCanvasType, port: MessagePort) => {
  let { data: { /*data,*/ blob, path, fileId } } = params;
  
  if( terminated ) {
    port.postMessage({fileId, canceled: true});
    return;
  }
  
  path = path.replace(/^\//, '');
  
  // remove existing extension
  if( !keepPrevExtension )
    path = path.replace(/\.(jpe?g|jfif|pjpeg|pjp|gif|png|avif|webp|bmp|apng|ico)$/i, '');
  
  // add a number to the filename if the name already exists
  const DUPMAX = 0x7FFFFFFF;
  let outputPath = path + '.' + outputExtension;
  let dupCounter = 1;
  for( ; dupCounter <= DUPMAX; dupCounter++ ) {
    if( !azip.has(outputPath) )
      break;
    
    if( dupCounter === DUPMAX )
      throw new Error(`failed to create valid output path. ${outputPath}`);
    
    // generate path
    outputPath = path + '_' + dupCounter + '.' + outputExtension;
  }
  
  // add an image to the zip
  //const abuffer: ArrayBuffer = await data?.arrayBuffer();
  //const abuffer = data;
  const bufferSize = blob.size;// abuffer.byteLength ?? 0;
  if( bytesSum + bufferSize > MaxZipSize ) {
    //await azip.wait(true);
    outputZipUrl('push-zip');
  }

  //azip.add(outputPath, abuffer);
  bytesSum += bufferSize;
  count++;
  fileIdByIndex.set(entireIndex++, fileId);
  //await azip.add(outputPath, blob);
  azip.add(outputPath, blob);
  
  // inform main thread that adding the file to the zip is completed
  let message: AddingZipMessageToMain = {
    action: 'add-zip-completed',
    fileId, 
  };
  self.postMessage( message );
  
  // inform canvas.worker that adding the file to the zip is completed
  /*
  if( terminated ) {
    port.postMessage({fileId, canceled: true});
    return;
  }
  */
  port.postMessage({fileId, /*canceled: terminated,*/ renamed: dupCounter >= 2, outputPath});
  
};




// output a zip url to the main thread
type FileInfo = {
  size: number
  count: number
};
type ZippingMessageToMain = FileInfo & (
  {
    action: 'push-zip' | 'squeeze-zip' | 'push-filelist-zip' | 'squeeze-filelist-zip'
    url: string
  } | {
    action: 'zip-squeeze-error' | 'zip-error' | 'push-filelist'
  }
);
function outputZipUrl(action: ZippingMessageToMain['action']) {
  console.log('zipworker emitZIP: ' + MaxZipSize, action);
  
  let message: ZippingMessageToMain;
  try {
    const azip2 = azip;
    const count2 = count;
    const size2 = bytesSum;
    azip2.wait().then(() => azip2.zip()).then(() => {
      const url = azip2.url();
      message = {url, action, size: size2, count: count2};
      if( action === 'push-zip' || action === 'squeeze-zip') {
        //zipList.push(azip2);
      }
      else {
        //errorZipList.push(azip2);
      }

      // NOTE:
      // it needs to inform 'add-zip-completed' action to main in advance of 'squeeze-zip', so insert a sleep.
      return new Promise(r => setTimeout(r, 0));
    }).then(() => {
      self.postMessage( message );
    }).catch((e) => {
      console.log(e);
    });
  } catch(e: any) {
    console.warn(e.message, action);
    message = {
      action: action === 'squeeze-zip' ? 'zip-squeeze-error' : 'zip-error',
      size:bytesSum,
      count,
    };
    self.postMessage( message );
  }
  
  //azip.clear();
  const prevLength = zipListLengthStack.length ? zipListLengthStack[zipListLengthStack.length - 1] : 0;
  zipListLengthStack.push(azip.count() + prevLength);
  azip = new AnZip();
  zipList.push(azip);
  count = 0;
  bytesSum = 0;

  console.log(zipListLengthStack)
}


export type MessageToMainFromZipWorker = ZippingMessageToMain | AddingZipMessageToMain | ImageMessageToMain;
