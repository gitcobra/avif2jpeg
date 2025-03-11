import { ref, watch, WatchStopHandle } from 'vue';
import * as WorkerManager from './worker-manager';
import ZipWorker from './worker.zip.ts?worker';
//import ZipWorkerURL from './worker.zip.ts?worker&url';
import type { MessageToCanvasWorker, MessageFromCanvasWorker } from './worker.canvas';
import type { FileWithId, SingleImageDataType } from './converter.vue';
import type Converter from './converter.vue';
import type ConversionStatus from './status.vue';
import { MessageToMainFromZipWorker } from './worker.zip';
import { UserSettings } from '@/user-settings';


type ConverterType = InstanceType<typeof Converter>;
type Props = ConverterType['$props'];
type ConversionStatusType = InstanceType<typeof ConversionStatus>;
type Stat = ConversionStatusType['status'];



// constants

const TIMEOUT_WORKER_AVAILABILITY_MSEC = 1000 * 10;

// retry this number of times to load an image if an error occurs
const MAX_RETRY_COUNT = 1;

// large image size
const IMG_OVER_LOADING_SIZE = 2000 * 2000 * 4;
const MAX_HEAVY_LOADING_THREADS = 6;

// max list length for each thread
const LIST_MAX_LEN = 5;
// max total file size for each list
const LIST_CHUNK_SIZE_LIMIT = IMG_OVER_LOADING_SIZE;

// demand a thumbnail from a worker at the intervals
const THUMB_DEMAND_INTERVAL = 100; // (msec)

// max total file size for all lists
const TOTAL_CHUNK_SIZE_LIMIT = IMG_OVER_LOADING_SIZE * 6;//1024 * 1024 * 120; // (MB)


// main routine

// 
const chunksEachWorkerPossessed = new Map<Worker, number>;
const retriedFileTime = new Map<File, number>;
let totalChunkSize = 0;

export async function convertTargetFilesInMultithread(ConvStats: Stat, canceled, props: Props, SingleImageData: SingleImageDataType, message, notification, files: FileWithId[], completedFileIdSet: Set<number>, format: string, quality: number, outputExt: string, imageType: string) {
  const progressingFileIdSet = new Set<number>;
  const targetFileMapById = new Map<number, FileWithId>();
  const failedFileCountMap = new Map<File, number>();
  const variousFileInfo = new Map<number, {
    shrinked?: boolean;
  }>();

  // initialize workers
  const canvasWorkerCount = Math.min(props.threads! - 1, files.length); // preserve +1 for worker.zip
  const workerCountForHugeImages = Math.min(MAX_HEAVY_LOADING_THREADS, canvasWorkerCount);//Math.min(MAX_HEAVY_LOADING_THREADS, Math.max(0, canvasWorkerCount / 2 |0));
  WorkerManager.init();  
  
  // create a Worker for zip archives (zip worker is always only one instance)
  const zipWorker = new ZipWorker();
  // create a listener for the zip worker
  const promiseToWaitSqueezingZip = createZipWorkerListenerAndPromise(zipWorker, ConvStats, canceled, completedFileIdSet, targetFileMapById, variousFileInfo);

  // set zip.worker configurations
  zipWorker.postMessage({
    action: 'set-config',
    zipSize: props.maxZipSizeMB * 1024 * 1024,
    keepExt: props.retainExtension,
    outputExt,
    imageType,
  });


  // create a listener for canvas Workers
  const canvasListener = createCanvasWorkerListener(ConvStats, canceled, SingleImageData, message, notification, files, completedFileIdSet, failedFileCountMap, targetFileMapById, progressingFileIdSet, props, outputExt, variousFileInfo);

  // create canvas Workers to convert each image
  let canvasSampleWorker: Worker;
  for( let i = 0; i < canvasWorkerCount; i++ ) {
    const worker = WorkerManager.createWorker(workerCountForHugeImages > i);
    canvasSampleWorker ??= worker;
    
    // set the listener
    worker.onmessage = canvasListener;

    // Open ports between "worker.zip" and each "worker.canvas" so that converted data are directly sent to "worker.zip".
    // NOTE:
    //   I'm not sure if it would improve perfomance.
    const {port1, port2} = new MessageChannel();
    zipWorker.postMessage({action: 'set-port'}, [port1]);
    worker.postMessage({}, [port2]);
  }


  

  // wait the first response and check if the workers are available
  const promiseToWaitForResponseFromWorkers = new Promise<boolean>(resolve => {
    const determinator = (flag: boolean) => {
      zipWorker.removeEventListener('message', listener); 
      canvasSampleWorker.removeEventListener('message', listener);
      clearTimeout(tid);
      resolve(flag);
    };
    
    let recievedZipWorker = false;
    let recievedCanvasWorker = false;
    const listener = (ev: MessageEvent) => {
      console.log(ev);
      
      if( ev.target === zipWorker )
        recievedZipWorker = true;
      if( ev.target === canvasSampleWorker )
        recievedCanvasWorker = true;
      
      if( recievedZipWorker && recievedCanvasWorker )
        determinator(true);
    }

    let tid = 0;
    zipWorker.addEventListener('message', listener);
    canvasSampleWorker.addEventListener('message', listener);
    tid = window.setTimeout(() => determinator(false), TIMEOUT_WORKER_AVAILABILITY_MSEC);
  });

  console.log('wait for first worker\'s responses');
  const workerIsAvailable = await promiseToWaitForResponseFromWorkers;
  if( !workerIsAvailable ) {
    // terminate the entire application here if failed to load the worker
    return {
      exception: new Error('worker-load-error'),
      callbackToClearConverter: () => {},
      callbackToGenerateFailedZips: () => {},
    };
  }




  // prepare watcher in case of the conversion process is canceled
  const unwatchCancelButton = watch(canceled, (val) => {
    if( !val )
      return;
    
    unwatchCancelButton();
    WorkerManager.releaseAllWorkers();
  });

  ConvStats.demandImage = (index: number) => {
    zipWorker.postMessage({action: 'request-image', index});
  };


  // post all image files to workers
  // NOTE:
  // listners of the workers will update ConvStats object, and the core conversion routine depends on the properties of ConvStats.
  
  const fileCount = files.length;
  const isSingleImageFile = ( fileCount === 1 ); // not to zip
  let startedCount = 0;
  let prevThumbDemandedTime = 0;
  let outputPath = '';
  let index = 0;
  let lastRetriedTime = 0;
  
  // reset totalChunkSize
  totalChunkSize = 0;
  chunksEachWorkerPossessed.clear();

  while( index < files.length ) {    
    // abort
    if( canceled.value ) {
      //WorkerManager.releaseWorker(worker);
      break;
    }

    if( totalChunkSize > TOTAL_CHUNK_SIZE_LIMIT ) {
      console.log(index, "overload", totalChunkSize);
      await new Promise(r => setTimeout(r, 30));
      continue; 
    }

    // check chunk size
    if( totalChunkSize > TOTAL_CHUNK_SIZE_LIMIT ) {
      // @ts-ignore
      //console.log(performance.memory);
      /*const bworkers = WorkerManager.getBusyWorkers();
      if( bworkers.length ) {
        //await Promise.any(bworkers);
      }*/
      await new Promise(r => setTimeout(r, 20));
    }
    
    // create message list
    
    const messages: MessageToCanvasWorker = [];
    const trnsBitmaps: ImageBitmap[] = [];
    let isLastItem = false;
    const rest = files.length - index;
    const len = Math.min( index + Math.max(Math.min(LIST_MAX_LEN, rest / props.threads! |0), 1), files.length);
    let chunkSize = 0;

    // demand a ImageBitmap for a thumbnail
    let demandThumbnail = false;
    const now = Date.now();
    if( now - prevThumbDemandedTime > THUMB_DEMAND_INTERVAL ) {
      prevThumbDemandedTime = now;
      demandThumbnail = true;
    }
    

    const startmsgs: MessageEvent<MessageFromCanvasWorker>[] = [];
    const errmsgs: MessageEvent<MessageFromCanvasWorker>[] = [];
    let includesRetryingFile = false;
    for( ;index < len; index++ ) {
      if( chunkSize > LIST_CHUNK_SIZE_LIMIT || totalChunkSize > TOTAL_CHUNK_SIZE_LIMIT ) {
        break;
      }
    
      const file = files[index];
      const fileId = file._id;
      //chunkSize += file.size;
      isLastItem = index === files.length - 1;

      console.log(index, len, file.name);
      
      // wait a second for retrying
      const retriedTime = retriedFileTime.get(file);
      includesRetryingFile = includesRetryingFile || !!retriedTime;
      const retryingDelay = retriedTime ? Math.max(0, 100 - (Date.now() - (lastRetriedTime || retriedTime))) : 0;
      if( retryingDelay ) {
        await new Promise(r => setTimeout(r, retryingDelay));
      }
      if( includesRetryingFile ) {
        console.log('retrying', "retryingDelay", retryingDelay);
        lastRetriedTime = Date.now();
      }

      if( !targetFileMapById.has(fileId) ) {
        targetFileMapById.set(fileId, file);
      }
      
      // HACK: execute canvas listener directly
      const startmsg = {data: {
        action: 'file-start', 
        path: file.webkitRelativePath || file.name, 
        fileId, 
        index,
      }} as MessageEvent<MessageFromCanvasWorker>;
      /*// @ts-ignore
      startmsg.target = worker;
      canvasListener(startmsg);
      */
      startmsgs.push(startmsg);

      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file);
        let {width, height} = bitmap;

        // resize the source bitmap
        const maxSize = UserSettings.shrinkImage ? {width: UserSettings.maxWidth, height: UserSettings.maxHeight} : null;
        if( maxSize ) {
          const whrate = width / height;
          let {width: mw, height: mh} = maxSize;
          
          let resize: any = null;
          if( width > mw ) {
            width = mw;
            height = width / whrate;
            resize = {resizeWidth: width};
          }
          if( height > mh ) {
            height = mh;
            width = height * whrate;
            resize = {resizeHeight: height};
          }
          
          let shrinked = !!resize;
          let dat = variousFileInfo.get(fileId);
          if( !dat ) {
            dat = {};
            variousFileInfo.set(fileId, dat);
          }
          dat.shrinked ??= shrinked;
          
          bitmap = await createImageBitmap(bitmap, {resizeQuality:'high', ...(resize||{})});
        }

      } catch(e) {
        console.error('error occurred while creating a bitmap', fileId, file.webkitRelativePath, e);
        // @ts-ignore
        //console.log(performance.memory);

        // HACK: execute canvas listener directly
        const errmsg = {data: {
          action: 'file-error', 
          path: file.webkitRelativePath || file.name, 
          fileId, 
          index,
        }} as MessageEvent<MessageFromCanvasWorker>;
        /*//@ts-ignore
        errmsg.target = worker;
        canvasListener(errmsg);
        */
        errmsgs.push(errmsg);

        continue;
      }
      trnsBitmaps.push(bitmap);
      const bitmapSize = bitmap.width * bitmap.height * 4;
      chunkSize += bitmapSize + file.size;
      totalChunkSize += bitmapSize + file.size;

      // create a message
      messages.push({
        index,
        bitmap,
        file,
        fileId,
        outputPath,
        type: format,
        quality: quality / 100,
        demandThumbnail: demandThumbnail || isLastItem,
        isSingleImage: isSingleImageFile,
        maxSize: UserSettings.shrinkImage ? {width: UserSettings.maxWidth, height: UserSettings.maxHeight} : null,
        retriedTime: retriedFileTime.get(file) || 0,
        
        // chrome (currently v126.0.6478.127) cannot seem to read a property of a File that defined by Object.defineProperty from a Worker,
        // (Firefox can) so send the property directly.
        webkitRelativePath: file.webkitRelativePath,
      });
      
      const path = file.webkitRelativePath || file.name;
      if( !failedFileCountMap.has(file) ) {   
        startedCount++;
        ConvStats.index = startedCount;
      }
      else {
        console.warn(`retry "${path}".`);
      }

      demandThumbnail = false;
      
    }

    // post the messages to canvas worker
    let worker: WorkerManager.WorkerWithId;
    if( messages.length ) {

      // wait to get an available worker
      const heavyImage = chunkSize > IMG_OVER_LOADING_SIZE;
      worker = await WorkerManager.getWorker(workerCountForHugeImages > 0 && (includesRetryingFile ? 1 : heavyImage));
      
      // abort
      if( canceled.value ) {
        WorkerManager.releaseWorker(worker);
        break;
      }

      //setTimeout(()=>worker.postMessage(messages), 0);
      //worker.postMessage( messages, trnsBitmaps );
      
      // store chunk size
      chunksEachWorkerPossessed.set(worker, chunkSize);
    }
    /*
    // otherwise release the worker
    else
      WorkerManager.releaseWorker(worker);
    */

    for( const msg of startmsgs.concat(errmsgs) ) {
      // @ts-ignore
      msg.target = worker || {id:-1};
      canvasListener(msg);
    }

    // post
    if( worker ) {
      worker.postMessage( messages, trnsBitmaps );
      // @ts-ignore
      //console.log(performance.memory.totalJSHeapSize.toLocaleString('en-us'));
    }
    
    // when it is a last file, wait until all workers are done because the file list could expand when retrying.
    if( isLastItem ) {
      await WorkerManager.waitAllWorkers();
      
      if( canceled.value )
        break;
    }
  }
  console.log('end file loop', files.length);





  // wait until all workers are resolved
  await WorkerManager.waitAllWorkers();
  console.log('resolved all workers');
  
  if( !canceled.value ) {
    // wait to complete conversion process
    let unwatch: WatchStopHandle;
    await new Promise(resolve => {
      unwatch = watch([() => ConvStats.done, canceled], () => {
        if( ConvStats.done >= startedCount || canceled.value ) {
          resolve(void 0);
        }
      }, {immediate: true});
    });
    unwatch!();

    console.log('processed all files');
  }
  unwatchCancelButton();

  // close all canvas workers
  setTimeout(() => WorkerManager.init(), 500);

  // squeeze remaining zip
  zipWorker.postMessage({action: 'squeeze'});
  await promiseToWaitSqueezingZip;

  // create callbacks
  const Terminated = {value: false};
  const callbackToClearConverter = () => {
    Terminated.value = true;
    //WorkerManager.init();
    zipWorker.terminate();
  };
  let doneCalled = false;
  const callbackToGenerateFailedZips = async (list: FileWithId[]) => {
    if( doneCalled )
      return;
    doneCalled = true;
    await pushErrorZipsInMultithread(list, zipWorker, Terminated, ConvStats);
  };

  return {
    callbackToClearConverter,
    callbackToGenerateFailedZips,
  };
}





// create a listener for zip.worker
function createZipWorkerListenerAndPromise(zipWorker: Worker, ConvStats: Stat, canceled, completedFileIdSet, targetFileMapById, variousFileInfo) {
  
  const promise = new Promise(resolve => {
    
    zipWorker.onmessage = ( params: MessageEvent<MessageToMainFromZipWorker> ) => {
      const data = params.data;
      const { action } = data;
      //console.log(`recieved a message from zipWorker: ${action}`);
      
      
      /*
      if( canceled.value ) {
        resolve(void 0);
        return;
      }
      */

      // completion
      if( action === 'add-zip-completed' ) {
        const {fileId} = data;
        ConvStats.done++;
        ConvStats.success++;
        completedFileIdSet.add(fileId);
        return;
      }

      if( action === 'respond-image' ) {
        const {url, index, path, size, fileId} = data;
        
        ConvStats.convertedImageUrl = url;
        ConvStats.convertedImageSize = size;
        ConvStats.convertedImageIndex = index;
        ConvStats.convertedImageName = path;
        ConvStats.convertedImageFileId = fileId;
        
        // create an object url of the original image
        let orgUrl = '', orgSize = 0, orgName = '';
        if( fileId >= 0 ) {
          const file = targetFileMapById.get(fileId);
          orgUrl = URL.createObjectURL(file);
          orgSize = file.size;
          orgName = file.name;
        }
        ConvStats.convertedImageOrgUrl = orgUrl;
        ConvStats.convertedImageOrgSize = orgSize;
        ConvStats.convertedImageOrgName = orgName;
        ConvStats.convertedImageShrinked = variousFileInfo.get(fileId)?.shrinked;
        
        return;
      }

      const { size, count } = data;
      const url = ('url' in params.data) ? params.data.url : '';
      
      switch(action) {
        case 'push-zip':
          ConvStats.zips.push({url, size, count});
          ConvStats.zippedTotalCount += count;
          ConvStats.zippedTotalSize += size;
          break;

        case 'squeeze-zip':
          if( count > 0 ) {
            ConvStats.zips.push({url, size, count});
            ConvStats.zippedTotalCount += count;
            ConvStats.zippedTotalSize += size;
          }
          resolve(void 0);
          break;
        
        // zip failed files
        case 'push-filelist':
          ConvStats.failedFileZippedCount++;
          break;
        case 'squeeze-filelist-zip':
          ConvStats.failedZipDone = true;
        case 'push-filelist-zip':
          console.log('push-filelist-zip', count)
          ConvStats.failedZips.push({url, size, count});
          //ConvStats.failedFileZippedCount += count;
          break;
        
        // NOTE:
        // error occured during zipping process (untested)
        case 'zip-error':
        case 'zip-squeeze-error':
          ConvStats.zippingErrorCount += count;
          if( action === 'zip-squeeze-error' ) {
            resolve(void 0);
          }
          break;
      }
    };
  });

  return promise;
}

// create a listener for canvas worker
// all canvas workers share the single listener
function createCanvasWorkerListener(ConvStats: Stat, canceled, SingleImageData: SingleImageDataType, message, notification, fileList: File[], completedFileIdSet: Set<number>, failedFileCountMap: Map<File, number>, targetFileMapById: Map<number, FileWithId>, progressingFileMapById, props: Props, outputExt:string, variousFileInfo) {
  type LogType = Stat['logs'][number];
  
  
  let _keyCounter = 0;
  // Map<worker.id, logitem>
  const processingCoreLogItems = ref(new Map<number, LogType>);
  //const processingCoreLogItems = { value: new Map<number, LogType> };
  // Map<fileId, logitem>
  const completedItemsLog = ref(new Map<number, LogType>); 
  //const completedItemsLog = { value: new Map<number, LogType> };
  
  // message type
  type MessageTypeCanvasWorkerListener = MessageEvent<MessageFromCanvasWorker>;
  
  const cworkerlistener = (params: MessageTypeCanvasWorkerListener) => {
    const worker = params.target as WorkerManager.WorkerWithId;
    
    const { data } = params;
    const { action } = data;

    if( canceled.value ) {
      //console.log(`canceling action from canvas "${action}"`);
      /*
      if( !processingCoreLogItems.value.has(worker.id) )
        return;
      */
      
      switch( action ) {
        /*
        case 'list-start':
        case 'file-start':
          return;
        
        case 'file-load':
        case 'file-converted':
          return;
        */
        
        case 'file-canceled':
          console.log('file-canceled');
          ConvStats.done++;
          //ConvStats.failure++;
          /*
          try {
            const { fileId } = data;
            ( completedItemsLog.value.get(fileId) || processingCoreLogItems.value.get(worker.id) || {} as any ).command = '⛔canceled';
          } catch(e) {
            console.warn(action);
          }
          */
          return;
      }
    }


    switch(action) {
      case 'list-start':
        console.log(`list started on worker ${worker.id}`);
        break;
      case 'file-start': {
        const { index, path, fileId } = data;
        //console.log(`file-start ${index}`);

        const item = {
          key:_keyCounter++,
          core:worker.id,
          index: index,//fileId,
          path,
          command: `➡️started`,
        };
        processingCoreLogItems.value.set(fileId, item);
        ConvStats.logs.push(item);
        //console.log(item);
        break;
      }
      case 'file-load': {
        const { thumbnail, width, height, fileId, shrinked } = data;
        processingCoreLogItems.value.get(fileId)!.command = `🖼️loaded`;
        if( thumbnail ) {
          ConvStats.thumbnail = thumbnail;
        }
        
        let dat = variousFileInfo.get(fileId);
        
        if( !dat ) {
          dat = {};
          variousFileInfo.set(fileId, dat);
        }
        dat.shrinked ??= shrinked;
        console.log(fileId, dat, "load")
        break;
      }
      case 'file-converted': {
        const { index, path, fileId/*, image, blobUrl*/ } = data;

        const item = processingCoreLogItems.value.get(fileId)!;
        item.command = `🔃converted`;
        //processingCoreLogItems.delete(worker.id);
        completedItemsLog.value.set(fileId, item);
        ConvStats.converted++;

        /*
        if( !blobUrl )
          break;
        
        
        if( !image )
          break;

        // output a single image data if the image count is 1
        const { width, height } = data;
        SingleImageData.convertedImageBlob = image;
        SingleImageData.convertedImageWidth = width;
        SingleImageData.convertedImageHeight = height;
        SingleImageData.convertedImageName = path;
        // and directly go down "file-completed" block↓
        ConvStats.done++;
        ConvStats.success++;
        
        ConvStats.convertedImageName = path.replace(/^.*\/(?=[^/]+$)/, '').replace(props.retainExtension ? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '') + '.' + outputExt;
        ConvStats.convertedImageUrl = blobUrl;
        */

        break;
      }

      // otherwese 'file-completed' action is caused by worker.zip
      case 'file-completed': {
        const { inputsize, outputsize, fileId } = data;
        ConvStats.inputTotalSize += inputsize;
        ConvStats.outputTotalSize += outputsize;
        
        // NOTE: these commands moved in zip listener
        //ConvStats.done++;
        //ConvStats.success++;
        //completedFileIdSet.add(fileId);
        
        //progressingFileMapById.delete(fileId);
        
        // NOTE:
        // the listener may recieves 'file-completed' before 'file-converted' depending on the load situation.
        // completedItemsLog doesn't have an item for the file in that case.
        const item = completedItemsLog.value.get(fileId);
        if( item ) {
          item.command = `✅completed`;
          item.completed = true;
        }
        

        break;
      }
      
      case 'file-error': {
        const { index, path, fileId } = data;
        const file = targetFileMapById.get(fileId);
        if( !file )
          throw new Error(`the file doesn't exist in the Map. "${fileId}":"${path}"`);
        
        const failedCount = failedFileCountMap.get(file) || 0;
        const item = processingCoreLogItems.value.get(fileId)!;
        if( failedCount < MAX_RETRY_COUNT ) {
          failedFileCountMap.set(file, failedCount + 1);
          
          // append the failed file to the conversion list to retry
          fileList.push(file);
          retriedFileTime.set(file, Date.now());

          //progressingFileMapById.delete(fileId);
          console.error(`worker ${worker.id} threw an error when loading "${path}". retrying the file.`);
          item.command = `⚠️retrying`;
          item.error = true;
          
          message.warning(`retrying "${path}"`, {
            duration: 3000,
          });
        }
        else {
          console.error(`failed to load "${path}" after ${MAX_RETRY_COUNT} retries. the image may be corrupted or cannot be read by some reason.`);
          ConvStats.done++;
          ConvStats.failure++;
          item.command = `❗failed`;
          item.error = true;

          notification.error({
            content: `failed to load "${path}"`,
            duration: 5000,
          });
        }

        break;
      }
      // canceled before zippping
      case 'file-canceled': {
        const { fileId, path } = data;
        const item = completedItemsLog.value.get(fileId)!;
        ConvStats.done++;
        ConvStats.failure++;
        item.command = `❗zip-aborted`;
        item.error = true;

        break;
      }
      
      case 'list-end': {
        // release the worker
        WorkerManager.releaseWorker(worker);

        // check chunk size
        totalChunkSize -= chunksEachWorkerPossessed.get(worker) || 0;
        chunksEachWorkerPossessed.delete(worker);
        break;
      }
    }
  };

  return cworkerlistener;
}





// create zips for failed files
async function pushErrorZipsInMultithread(list: FileWithId[], zipWorker: Worker, Terminated, ConvStats: Stat) {
  let count = 0;
  for( const file of list ) {
    const path = (file.webkitRelativePath || file.name).replace(/^\//, '');
    
    /*
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch(e:any) {
      console.warn(`failed to load `, path);
      //throw e;
      ConvStats.failedToCreateFailedZip = true;
      return;
    }
    */
    
    if( Terminated.value )
      return;

    // prevent too much call stacks
    if( count - ConvStats.failedFileZippedCount > 20 )
      await new Promise(r => setTimeout(r, 10));
    
    zipWorker.postMessage({
      action: 'add-filelist',
      //buffer,
      file,
      path,
    });

    count++;
  }
  
  zipWorker.postMessage({
    action: 'squeeze-filelist',
  });
}

async function checkIsWorkerUrlAvailable(url: string) {
  // check if the workers are exist on the server
  const flag = await fetch( url ).then<boolean>(response => {
    return response.statusText !== 'OK';
  });

  return flag;
}
