import * as WorkerManager from './worker-manager';
import type { MessageToCanvasWorker, MessageFromCanvasWorker } from './worker.canvas';
import type { FileWithId } from '../../file-selector.vue'
import { sleep } from '../../util';
import { start } from 'repl';

// message types

export type LoaderMessageType = {
  action: 'set-zip-port';
} | {
  action: 'start-convert';
  list: FileWithId[];
  fileIdList: number[];
  outputType: string;
  outputQuality: number;
  threads: number;
  maxSize?: {
    width: number;
    height: number;
  }
} | {
  action: 'cancel-convert';
};

export type MessageFromLoader = MessageFromCanvasWorker | {
  action: 'file-retry'
  index: number
  path: string
  fileId: number
};



// constants


// retry this number of times to load an image if an error occurs
const MAX_RETRY_COUNT = 1;

// large image size
const IMG_OVER_LOADING_SIZE = 2000 * 2000 * 5;

// max number of threads processing large images
const MAX_HEAVY_LOADING_THREADS = 5;
// max list length for each thread
const LIST_MAX_LEN = 1;
// max total file size for each list
const LIST_CHUNK_SIZE_LIMIT = IMG_OVER_LOADING_SIZE * 1;
// max total file size for all lists
const TOTAL_CHUNK_SIZE_LIMIT = IMG_OVER_LOADING_SIZE * 6;

// demand a thumbnail from a worker at the intervals
const THUMB_DEMAND_INTERVAL = 100; // (msec)



// initialize module scope variables
let zipWorkerPort: MessagePort;
let files: FileWithId[]; // it is got in arguments of loadImageList
const chunksEachWorkerPossessed = new Map<number, number>;
const failedFileCountMap = new Map<number, number>(); // <fileId, count>
const retriedFileTime = new Map<number, number>; // <fileId, time>

let totalChunkSize = 0;
let canceled = false;
let startedCount = 0;
let resolvedCount = 0;


// recieve messages from main thread
self.onmessage = async (params: MessageEvent<LoaderMessageType>) => {
  const { data, ports } = params;
  const { action } = data;

  switch(action) {
    case 'set-zip-port': {
      zipWorkerPort = ports[0];
      self.postMessage({action: 'respond-to-first-message'});
      break;
    }
    case 'start-convert': {
      const {list, fileIdList, outputType, outputQuality, threads, maxSize} = data;
      list.forEach((val, i) => val._id = fileIdList[i]);
      loadImageList(list, outputType, outputQuality, threads, maxSize);
      break;
    }
    case 'cancel-convert':
      canceled = true;
      break;
  }
};

// main
async function loadImageList(filelist: FileWithId[], outputType: string, outputQuality: number, threads: number, maxSize?: {width: number, height:number}) {
  files = filelist;
  
  // initialize canvas workers
  const canvasWorkerCount = Math.max(1, Math.min(threads - 3, files.length)); // preserve +3 for main, worker.loader, worker.zip
  const workerCountForHugeImages = Math.min(MAX_HEAVY_LOADING_THREADS, canvasWorkerCount);
  createCanvasWorkers(canvasWorkerCount, workerCountForHugeImages);

  // wait until active worker is released if totalChunkSize reaches the limit
  const waitTotalCunkDissolves = async () => {
    for( let counter = 1; !canceled && totalChunkSize > TOTAL_CHUNK_SIZE_LIMIT; counter++ ) {
      console.log("overloaded ", "index:", index, " totalChunkSize:", totalChunkSize, " counter:", counter);
      if( counter > 9999 ) {
        throw new Error(`maybe totalChunkSize is deadlocked :${totalChunkSize}`);
      }
      await WorkerManager.waitNextRelease();
    }
  };

 
  // post all image files to canvas workers
  
  const fileCount = files.length;
  const isSingleImageFile = ( fileCount === 1 ); // avoid zipping
  let prevThumbDemandedTime = 0;
  let outputPath = '';
  let index = 0;
  let lastRetriedTime = 0;
  

  while( index < files.length ) {    
    // create message list

    const messages: MessageToCanvasWorker = [];
    const trnsBitmaps: ImageBitmap[] = [];
    let isLastItem = false;
    const rest = files.length - index;
    const sublistLen = Math.min( index + Math.max(Math.min(LIST_MAX_LEN, rest / threads |0), 1), files.length);
    
    let chunkSize = 0;
    let includesRetryingFile = false;
    for( ;index < sublistLen; index++ ) {
      if( chunkSize > LIST_CHUNK_SIZE_LIMIT /*|| totalChunkSize > TOTAL_CHUNK_SIZE_LIMIT*/ ) {
        if( !canceled ) {
          await waitTotalCunkDissolves();
          break;
        }
      }
    
      const file = files[index];
      const fileId = file._id;
      const path = file.webkitRelativePath || file.name;

      // wait a second for retrying
      const retriedTime = retriedFileTime.get(fileId);
      includesRetryingFile = includesRetryingFile || !!retriedTime;
      const retryingDelay = 0;//retriedTime ? Math.max(0, 100 - (Date.now() - (lastRetriedTime || retriedTime))) : 0;
      if( !canceled && retryingDelay ) {
        console.log('retrying', "retryingDelay", retryingDelay);
        await new Promise(r => setTimeout(r, retryingDelay));
      }
      if( includesRetryingFile ) {
        lastRetriedTime = Date.now();
      }
      
      isLastItem = index === files.length - 1;
      
      // post message of start
      startedCount++;
      passMessageToMain('file-start', index, path, fileId);

      // cancel remaining processes here if canceled flag is true
      if( canceled ) {
        passMessageToMain('file-canceled', index, path, fileId);
        continue;
      }

      // try to parse the file as an image
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file);
      } catch(e) {
        // error
        console.error('error occurred while creating a bitmap', fileId, path);
        //postFileError(index, path, fileId);
        retryFileCallback(index, path, fileId);
        continue;
      }

      // check totalChunkSize
      await waitTotalCunkDissolves();
      if( canceled ) {
        passMessageToMain('file-canceled', index, path, fileId);
        continue;
      }

      trnsBitmaps.push(bitmap);
      const bitmapSize = bitmap.width * bitmap.height * 4;
      chunkSize += bitmapSize + file.size;
      totalChunkSize += bitmapSize + file.size;

      // demand a ImageBitmap for a thumbnail
      let demandThumbnail = false;
      const now = Date.now();
      if( now - prevThumbDemandedTime > THUMB_DEMAND_INTERVAL ) {
        prevThumbDemandedTime = now;
        demandThumbnail = true;
      }

      // create a message
      messages.push({
        index,
        bitmap,
        file,
        fileId,
        outputPath,
        type: outputType,
        quality: outputQuality / 100,
        demandThumbnail: demandThumbnail || isLastItem,
        isSingleImage: isSingleImageFile,
        maxSize,
        retriedTime: retriedFileTime.get(fileId) || 0,
        
        // chrome (currently v126.0.6478.127) cannot seem to read a property of a File that defined by Object.defineProperty from a Worker,
        // (Firefox can) so send the property directly.
        webkitRelativePath: file.webkitRelativePath,
      });

      demandThumbnail = false;
      
    }

    // post the messages to canvas worker if messages exist
    let worker: WorkerManager.WorkerWithId;
    if( messages.length ) {
      // wait to get an available worker
      const heavyImage = chunkSize > IMG_OVER_LOADING_SIZE;
      //console.log(workerCountForHugeImages > 0 && (includesRetryingFile ? 1 : heavyImage), 'getworker');
      worker = await WorkerManager.getWorker(workerCountForHugeImages > 0 && (includesRetryingFile ? 1 : heavyImage));
      
      //worker.postMessage( messages, trnsBitmaps );
      
      // store chunk size
      chunksEachWorkerPossessed.set(worker.id, chunkSize);

      // post the bitmap to canvasworker
      worker.postMessage( messages, trnsBitmaps );
      
      //trnsBitmaps.forEach(item => item.close());
      trnsBitmaps.length = 0;
    }
    
    // when it is a last file, wait until all workers are done because the file list could expand when retrying.
    if( isLastItem ) {
      await WorkerManager.waitAllWorkers();
      
      if( canceled )
        break;
    }
  }
  console.log('end file loop', files.length);
  console.log('end of totalChunkSize: ', totalChunkSize);

  // wait until all workers are resolved
  await WorkerManager.waitAllWorkers();
  console.log('resolved all workers');

  // notify the end of the process to main
  self.postMessage({
    action: 'end-convert'
  });
  
  // wait until resolvedCount is equil to startedCount
  for( let i = 0; startedCount !== resolvedCount; i++ ) {
    if( i > 50 ) {
      console.error(`resolvedCount is unequal to startedCount. resolvedCount:${resolvedCount} startedCount:${startedCount}`);
      break;
    }
    await sleep(100);
  }

  // close by itself
  console.log('successfully close worker.loader.');
  self.close();
}


// create canvas Workers to convert each image
function createCanvasWorkers(canvasWorkerCount: number, workerCountForHugeImages: number) {
  WorkerManager.init();
  for( let i = 0; i < canvasWorkerCount; i++ ) {
    const cworker = WorkerManager.createWorker(workerCountForHugeImages > i);
    
    // set the listener
    cworker.onmessage = canvasListener;

    // Open ports between "worker.zip" and each "worker.canvas" so that converted data are directly sent to "worker.zip".
    const {port1, port2} = new MessageChannel();
    zipWorkerPort.postMessage({action: 'set-port-canvas'}, [port1]);
    cworker.postMessage({}, [port2]);
  }
}

const canvasListener = (params: MessageEvent<MessageFromCanvasWorker>) => {
  const worker = params.target as WorkerManager.WorkerWithId;
  
  const { data } = params;
  const { action } = data;

  switch(action) {
    // pass through the message to main
    case 'file-load':
      data.workerId = worker.id;
    case 'file-converted':
    case 'file-completed':
    case 'file-canceled': {
      self.postMessage(data);
      break;
    }
    
    // need to handle retry 
    case 'file-error': {
      const { index, path, fileId } = data;
      retryFileCallback(index, path, fileId);
      break;
    }
    
    // release the worker
    case 'list-end': {        
      WorkerManager.releaseWorker(worker);
      // subtract worker possesed chunk size from totalChunkSize when recieved "list-end" action
      totalChunkSize -= chunksEachWorkerPossessed.get(worker.id) || 0;
      chunksEachWorkerPossessed.delete(worker.id);
      break;
    }

    case 'list-start':
    case 'respond-to-first-message':
      break;

    default:
      console.error(`unexptected action "${action}"`);
  }

  checkIfFileIsDone(action);
};

function passMessageToMain(action: 'file-start'|'file-retry'|'file-canceled'|'file-error', index: number, path: string, fileId: number) {
  const errorMsg: MessageFromLoader = {
    action,
    index,
    path,
    fileId,
  };
  self.postMessage(errorMsg);

  checkIfFileIsDone(action as MessageFromCanvasWorker['action']);
}

function checkIfFileIsDone(action: MessageFromLoader['action']) {
  switch( action ) {
    case 'file-completed':
    case 'file-canceled':
    case 'file-error':
    
    case 'file-retry':
      resolvedCount++;
      break;
  }
};

// when any error occured in a file, this callback is executed to determin whether to retry
function retryFileCallback(index:number, path:string, fileId:number) {
  const file = files[index];
  if( !file )
    throw new Error(`the file doesn't exist. "${index}":"${path}"`);
  
  const failedCount = failedFileCountMap.get(file._id) || 0;
  if( failedCount < MAX_RETRY_COUNT ) {
    failedFileCountMap.set(file._id, failedCount + 1);
    
    // append the failed file to the conversion list to retry
    files.push(file);
    retriedFileTime.set(fileId, Date.now());
    passMessageToMain('file-retry', index, path, fileId);
  }
  else {
    console.error(`failed to load "${path}" after ${MAX_RETRY_COUNT} retries. the image may be corrupted or cannot be read by some reason.`);
    passMessageToMain('file-error', index, path, fileId);
  }
};




