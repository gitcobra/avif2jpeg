import type { MessageToZipFromCanvasType } from "./worker.canvas";
import AnZip from "@gitcobra/anzip-es6";
import {sleep, SplitZipsIndexer} from "@/components/util";

console.log('converter.worker.zip started');

const zipList: AnZip[] = [];
//const zipListLengthStack = [];
let entireIndex = 0;
const fileIdByIndex = new Map<number, number>();
const zipIndexer = new SplitZipsIndexer;
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
type DeleteMessageToMain = {
  action: 'respond-delete'
  index: number
  success: boolean
  fileId: number
};

self.onmessage = async (params: ZipMessageType) => {
  const { data: { action, zipSize, keepExt, outputExt, file, index, /*buffer,*/ path, imageType }, ports } = params;
  console.log('zipworker: ' + action);

  switch( action ) {
    case 'set-config':
      MaxZipSize = zipSize!;
      keepPrevExtension = !!keepExt;
      outputExtension = outputExt || '';
      outputImageType = imageType || '';
      self.postMessage({action: 'respond-set-config'});
      break;
    /*
    case 'set-port': {
      const port = ports[0];
      port.onmessage = (params) => onmessageFromCanvasWorkers(params, port);
      return;
    }
    */
    case 'set-port-loader': {
      const port = ports[0];
      self.postMessage({action: 'respond-to-first-message'});

      port.onmessage = (params: MessageEvent) => {
        const { data: {action}, ports } = params;
        // set canvas port
        if( action === 'set-port-canvas' ) {
          const port = ports[0];
          port.onmessage = (params) => onmessageFromCanvasWorkers(params, port);
          console.log('set-port-canvas');
        }
      };
      return;
    }
    case 'squeeze':
      //self.close();
      // NOTE:
      // when this worker was terminated, main thread could not access those blob urls created by this.
      // so just flag ignoring the messages from canvas.workers instead of terminating this.
      terminated = true;

      // NOTE:
      // delayed to wait previous stacking buffer
      //setTimeout(() => outputZipUrl('squeeze-zip'), 10);
      await azip.wait();
      outputZipUrl('squeeze-zip');
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

      let errorAddFilelist = false;
      await azip.add(path!, file!).catch((e: any) => {
        console.error(e);
        errorAddFilelist = true;
      });
      
      // error
      if( errorAddFilelist ) {
        const message: ZippingListErrorMessageToMain = {
          action: 'error-push-filelist-zip',
          path,
        };
        self.postMessage( message );
        break;
      }


      bytesSum += file!.size;
      count++;

      let message: ZippingMessageToMain = {
        action: 'push-filelist',
        size: bytesSum,
        count,
      };
      self.postMessage( message );
      break;
    }
    case 'squeeze-filelist':
      await azip.wait();
      outputZipUrl('squeeze-filelist-zip');
      break;
    
    case 'request-image': {
      // get split zip index and file index
      const [zindex, findex] = zipIndexer.get(index);
      const targetazip = zipList[zindex];
      const targetidx = findex;

      const blob = targetazip.get(targetidx!, outputImageType);
      if( !blob ) {
        console.warn(index, targetidx, blob);
        //console.warn(zipListLengthStack);
        break;
      }
      const path = targetazip.getPathByIndex(targetidx!);
      const url = URL.createObjectURL(blob);
      let message: ImageMessageToMain = {
        action: 'respond-image',
        url,
        index: index!,
        path,
        fileId: fileIdByIndex.get(index!)!,
        size: blob.size,
      };

      self.postMessage( message );
      break;
    }
    case 'delete-image': {
      let success = false;
      try {
        const [zipIndex, fileIndex] = zipIndexer.get(index);
        zipList[zipIndex].remove(fileIndex);
        success = true;
      } catch(e: any) {
        console.error(e.message);
      }
      const message: DeleteMessageToMain = {
        action: 'respond-delete',
        index,
        success,
        fileId: fileIdByIndex.get(index),
      };
      self.postMessage(message);
      break;
    }

    default:
      console.error(`zip.worker got an unknown action. "${action}"`);
      break;
  }
};




// message from canvas worker
type MessageFromCanvasWorker = MessageEvent<MessageToZipFromCanvasType>;
type AddingZipMessageToMain = {
  action: 'add-zip-completed'
  fileId: number
  entireIndex: number
  storedPath: string
};

// listener for canvasWorker
const onmessageFromCanvasWorkers = (params: MessageFromCanvasWorker, portToCanvas: MessagePort) => {
  let { data: { /*data,*/ blob, path, fileId, crc } } = params;
  
  if( terminated ) {
    console.log('canceled zipping the file. process was terminated.', fileId, path);
    portToCanvas.postMessage({fileId, canceled: true});
    return;
  }
  
  path = path!.replace(/^\//, '');
  
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
  const eindex = entireIndex++
  fileIdByIndex.set(eindex, fileId);
  zipIndexer.increase();
  //await azip.add(outputPath, blob);
  azip.add(outputPath, blob, undefined/*, crc*/);
  
  // inform main that the image has been addded to the zip
  let message: AddingZipMessageToMain = {
    action: 'add-zip-completed',
    fileId,
    entireIndex: eindex,
    storedPath: outputPath,
  };
  self.postMessage( message );
  
  // inform canvas.worker too 
  portToCanvas.postMessage({
    canceled: false, //canceled: terminated,
    fileId, 
    renamed: dupCounter >= 2,
    outputPath,
    storedPath: outputPath,
    entireIndex: eindex,
  });
  
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
type ZippingListErrorMessageToMain = {
  action: 'error-push-filelist-zip'
  path: string
};
function outputZipUrl(action: ZippingMessageToMain['action']) {
  console.log('zipworker emitZIP: ' + MaxZipSize, action);
  
  let message: ZippingMessageToMain;
  try {
    const azip2 = azip;
    const count2 = count;
    const size2 = bytesSum;
    azip2.zip(true).then(() => azip2.url()).then(async (url) => {
      // NOTE:
      // 'add-zip-completed' needs to be notified to main before 'squeeze-zip', so insert a sleep.
      await sleep(0);

      message = {url, action, size: size2, count: count2};
      self.postMessage( message );
    });
  } catch(e: any) {
    console.error(e.message, action);
    console.error('count:', count);
    message = {
      action: action === 'squeeze-zip' ? 'zip-squeeze-error' : 'zip-error',
      size:bytesSum,
      count,
    };
    self.postMessage( message );
  }
  
  //azip.clear();
  //const prevLength = zipListLengthStack.length ? zipListLengthStack[zipListLengthStack.length - 1] : 0;
  //zipListLengthStack.push(azip.count() + prevLength);
  azip = new AnZip();
  zipList.push(azip);
  zipIndexer.split();
  count = 0;
  bytesSum = 0;
}


export type MessageToMainFromZipWorker =
  ZippingMessageToMain |
  AddingZipMessageToMain |
  ImageMessageToMain |
  DeleteMessageToMain |
  ZippingListErrorMessageToMain
  ;
