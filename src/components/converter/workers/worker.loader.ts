import * as WorkerManager from './worker-manager';
import type { MessageToCanvasWorker, MessageFromCanvasWorker } from './worker.canvas';
import type { FileWithId } from '../../file-selector.vue'


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
} | {
  action: 'cancel-convert';
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



// module scope variables
let canceled = false;
let zipWorkerPort: MessagePort;







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
      const {list, fileIdList, outputType, outputQuality, threads} = data;
      list.forEach((val, i) => val._id = fileIdList[i]);
      loadImageList(list, outputType, outputQuality, threads);
      break;
    }
    case 'cancel-convert':
      canceled = true;
      break;
  }
};

async function loadImageList(files: FileWithId[], outputType: string, outputQuality: number, threads: number) {
  let totalChunkSize = 0;
  const chunksEachWorkerPossessed = new Map<number, number>;
  const failedFileCountMap = new Map<number, number>(); // <fileId, count>
  const retriedFileTime = new Map<number, number>; // <fileId, time>
  
  // initialize canvas workers
  const canvasWorkerCount = Math.max(1, Math.min(threads - 3, files.length)); // preserve +3 for main, worker.loader, worker.zip
  const workerCountForHugeImages = Math.min(MAX_HEAVY_LOADING_THREADS, canvasWorkerCount);
  
  // when any error occured in a file, this callback is executed to determin whether to retry
  const retryFileCallback = (index:number, path:string, fileId:number) => {
    const file = files[index];
    if( !file )
      throw new Error(`the file doesn't exist. "${index}":"${path}"`);
    
    const failedCount = failedFileCountMap.get(file._id) || 0;
    if( failedCount < MAX_RETRY_COUNT ) {
      failedFileCountMap.set(file._id, failedCount + 1);
      
      // append the failed file to the conversion list to retry
      files.push(file);
      retriedFileTime.set(fileId, Date.now());
      postFileRetry(index, path, fileId);
    }
    else {
      console.error(`failed to load "${path}" after ${MAX_RETRY_COUNT} retries. the image may be corrupted or cannot be read by some reason.`);
      postFileError(index, path, fileId);
    }
  };
  // subtract worker possesed chunk size from totalChunkSize when recieved "list-end" action
  const chunkSizeCallback = (workerId: number) => {
    totalChunkSize -= chunksEachWorkerPossessed.get(workerId) || 0;
    chunksEachWorkerPossessed.delete(workerId);
    //console.log('totalChunkSize', totalChunkSize, workerId);
  };
  const canvasListener = createCanvasWorkerListener(retryFileCallback, chunkSizeCallback);

  const waitTotalCunkDissolves = async () => {
    // wait until active worker is released if totalChunkSize reaches the limit
    for( let counter = 1; !canceled && totalChunkSize > TOTAL_CHUNK_SIZE_LIMIT; counter++ ) {
      console.log("overloaded ", "index:", index, " totalChunkSize:", totalChunkSize, " counter:", counter);
      if( counter > 9999 ) {
        throw new Error(`totalChunkSize is deadlocking :${totalChunkSize}`);
      }
      await WorkerManager.waitNextRelease();
    }
  };


  createCanvasWorkers(canvasWorkerCount, workerCountForHugeImages, canvasListener);

  
  
  // post all image files to canvas workers
  
  const fileCount = files.length;
  const isSingleImageFile = ( fileCount === 1 ); // avoid zipping
  let prevThumbDemandedTime = 0;
  let outputPath = '';
  let index = 0;
  let lastRetriedTime = 0;
  
  // reset totalChunkSize
  totalChunkSize = 0;
  chunksEachWorkerPossessed.clear();

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
      
      // create an info item to start
      const startMsg: MessageFromCanvasWorker = {
        action: 'file-start',
        index,
        path,
        fileId,
      };
      self.postMessage(startMsg);

      // cancel remaining processes here if canceled flag is true
      if( canceled ) {
        postCanceled(index, path, fileId);
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
        postCanceled(index, path, fileId);
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
        maxSize: null,//UserSettings.shrinkImage ? {width: UserSettings.maxWidth, height: UserSettings.maxHeight} : null,
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

  // close by itself
  //self.close();
}


function createCanvasWorkers(canvasWorkerCount: number, workerCountForHugeImages: number, canvasListener: MessageEventTarget<Worker>["onmessage"]) {
  WorkerManager.init();
  // create canvas Workers to convert each image
  for( let i = 0; i < canvasWorkerCount; i++ ) {
    const cworker = WorkerManager.createWorker(workerCountForHugeImages > i);
    
    // set the listener
    cworker.onmessage = canvasListener;

    // Open ports between "worker.zip" and each "worker.canvas" so that converted data are directly sent to "worker.zip".
    // NOTE: I'm not sure if it would improve perfomance.
    const {port1, port2} = new MessageChannel();
    zipWorkerPort.postMessage({action: 'set-port-canvas'}, [port1]);
    cworker.postMessage({}, [port2]);
  }
}


function createCanvasWorkerListener(retryFileCallback: (index:number, path:string, fileId:number) => any, chunkSizeCallback: (workerId: number) => any) {
  return (
  (params: MessageEvent<MessageFromCanvasWorker>) => {
    const worker = params.target as WorkerManager.WorkerWithId;
    
    const { data } = params;
    const { action } = data;

    switch(action) {
      case 'list-start':
        break;
      
      case 'file-load':
        data.workerId = worker.id;
      case 'file-converted':
      case 'file-completed':
      case 'file-canceled':
        self.postMessage(data);
        break;
      
      case 'file-error': {
        // need to handle retry 
        const { index, path, fileId } = data;
        retryFileCallback(index, path, fileId);

        break;
      }
      case 'list-end': {
        // release the worker
        WorkerManager.releaseWorker(worker);

        chunkSizeCallback(worker.id);
        break;
      }

      case 'respond-to-first-message':
        break;

      default:
        throw new Error(`unexptected action "${action}"`);
    }
  }
  );
}

function postCanceled(index:number, path:string, fileId:number) {
  const cancelMsg: MessageFromCanvasWorker = {
    action: 'file-canceled',
    index,
    path,
    fileId,
  };
  self.postMessage(cancelMsg);
}

function postFileRetry(index: number, path: string, fileId: number) {
  const errorMsg: MessageFromCanvasWorker = {
    action: 'file-retry',
    index,
    path,
    fileId,
  };
  self.postMessage(errorMsg);
}

function postFileError(index: number, path: string, fileId: number) {
  const errorMsg: MessageFromCanvasWorker = {
    action: 'file-error',
    index,
    path,
    fileId,
  };
  self.postMessage(errorMsg);
}

