import { ref, watch, WatchStopHandle } from 'vue';
import * as WorkerManager from './worker-manager';
import ZipWorker from './worker.zip.ts?worker';
import type { MessageToCanvasWorker, MessageFromCanvasWorker } from './worker.canvas';
import type { FileWithId, SingleImageDataType } from './converter.vue';
import type Converter from './converter.vue';
import type ConversionStatus from './status.vue';
import { MessageToMainFromZipWorker } from './worker.zip';

type ConverterType = InstanceType<typeof Converter>;
type Props = ConverterType['$props'];
type ConversionStatusType = InstanceType<typeof ConversionStatus>;
type Stat = ConversionStatusType['status'];



// constants

// retry this number of times to load an image if an error occurs
const MAX_RETRY_COUNT = 1;

// max list length for each thread
const LIST_CHUNK = 10;
// max total file size for each list.
// NOTE:
// When the size is too large, Firefox (currently v131) will emit an error while loading Files on the worker
const LIST_CHUNK_SIZE_LIMIT = 1024 * 1024   * 4; // (MB)

// demand a thumbnail from a worker at the intervals
const THUMB_DEMAND_INTERVAL = 100; // (msec)




// main routine
export async function convertTargetFilesInMultithread(ConvStats: Stat, canceled, props: Props, SingleImageData: SingleImageDataType, message, notification, files: FileWithId[], completedFileIdSet: Set<number>, format: string, quality: number, outputExt: string) {
  const progressingFileIdSet = new Set<number>;
  const targetFileMapById = new Map<number, FileWithId>();
  const failedFileCountMap = new Map<File, number>();


  
  // initialize workers
  const canvasWorkerCount = Math.min(props.threads - 1, files.length); // preserve +1 for worker.zip
  WorkerManager.init();
  
  // create a Worker for zip archives
  const zipWorker = new ZipWorker();
  const promiseToWaitSqueezingZip = createZipWorkerListenerAndPromise(zipWorker, ConvStats, canceled, completedFileIdSet);

  // set zip.worker configurations
  zipWorker.postMessage({
    action: 'set-config',
    zipSize: props.maxZipSizeMB * 1024 * 1024,
    keepExt: props.retainExtension,
    outputExt,
  });

  // create a listener for canvas Workers
  const canvasListener = createCanvasWorkerListener(ConvStats, canceled, SingleImageData, message, notification, files, completedFileIdSet, failedFileCountMap, targetFileMapById, progressingFileIdSet);

  // create canvas Workers to convert each image
  for( let i = 0; i < canvasWorkerCount; i++ ) {
    const worker = WorkerManager.createWorker('./worker.canvas.ts');
    
    // set the listener
    worker.onmessage = canvasListener;

    // Open ports between "worker.zip" and each "worker.canvas" so that converted data are directly sent to "worker.zip".
    // NOTE:
    //   I'm not sure if it would improve perfomance.
    const {port1, port2} = new MessageChannel();
    zipWorker.postMessage({action: 'set-port'}, [port1]);
    worker.postMessage({}, [port2]);
  }


  // prepare watcher in case of the conversion process is canceled
  const unwatch = watch(canceled, (val) => {
    if( !val )
      return;
    
    unwatch();
    WorkerManager.releaseAllWorkers();
  });


  // post all image files to workers
  // NOTE:
  // listners of the workers will update ConvStats object, and the core conversion routine depends on the properties of ConvStats.
  
  const fileCount = files.length;
  const isSingleImageFile = ( fileCount === 1 ); // not to zip
  let startedCount = 0;
  let prevThumbDemandedTime = 0;
  let outputPath = '';
  let index = 0;
  
  while( index < files.length ) {
    // wait to get an available worker
    const worker = await WorkerManager.getWorker();
    
    if( canceled.value ) {
      WorkerManager.releaseWorker(worker);
      break;
    }


    
    // create message list
    
    const messages: MessageToCanvasWorker = [];
    let isLastItem = false;
    const rest = files.length - index;
    const len = Math.min( index + Math.max(Math.min(LIST_CHUNK, rest / props.threads |0), 1), files.length);
    let chunkSize = 0;

    // demand a ImageBitmap for a thumbnail
    let demandThumbnail = false;
    const now = Date.now();
    if( now - prevThumbDemandedTime > THUMB_DEMAND_INTERVAL ) {
      prevThumbDemandedTime = now;
      demandThumbnail = true;
    }
    
    for( ;index < len; index++ ) {
      if( chunkSize > LIST_CHUNK_SIZE_LIMIT ) {
        break;
      }
    
      const file = files[index];
      const fileId = file._id;
      chunkSize += file.size;
      isLastItem = index === files.length - 1;

      if( !targetFileMapById.has(fileId) ) {
        targetFileMapById.set(fileId, file);
      }

      // create a message
      messages.push({
        index,
        file,
        fileId: fileId,
        outputPath,
        type: format,
        quality: quality / 100,
        demandThumbnail: demandThumbnail || isLastItem,
        demandImage: isSingleImageFile,
        
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
    //setTimeout(()=>worker.postMessage(messages), 0);
    worker.postMessage( messages );
    
    /*
    DEV: {
      if( ConvStats.outputTotalSize >= props.maxZipSizeMB * 1024 * 1024 ) {
        canceled.value = true;
      }
    }
    */
    
    // when it is a last file, wait until all workers are done because the list could expand when retrying.
    if( isLastItem ) {
      await WorkerManager.waitAllWorkers();
      
      if( canceled.value )
        break;
    }
  }
  console.log('end file loop');





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
    unwatch();

    console.log('processed all files');
  }

  // squeeze remaining zip
  if( !isSingleImageFile && ConvStats.success > 0 ) {
    zipWorker.postMessage({action: 'squeeze'});
    await promiseToWaitSqueezingZip;
  }
  
  // it will lose all blob urls created by zipWorker if terminate it here
  //zipWorker.terminate();

  // end of conversion process
  unwatch();


  // create callbacks
  const Terminated = {value: false};
  const callbackToClearConverter = () => {
    Terminated.value = true;
    WorkerManager.init();
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


// 
async function pushErrorZipsInMultithread(list: FileWithId[], zipWorker: Worker, Terminated, ConvStats: Stat) {
  for( const file of list ) {
    const path = (file.webkitRelativePath || file.name).replace(/^\//, '');
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch(e:any) {
      console.warn(`failed to load `, path);
      //throw e;
      ConvStats.failedToCreateFailedZip = true;
      return;
    }
    
    if( Terminated.value )
      return;
    
    zipWorker.postMessage({
      action: 'add-filelist',
      buffer,
      path,
    });
    ConvStats.failedFileZippedCount++;
  }
  
  zipWorker.postMessage({
    action: 'squeeze-filelist',
  });
}



// create a listener for zip.worker
function createZipWorkerListenerAndPromise(zipWorker: Worker, ConvStats: Stat, canceled, completedFileIdSet) {
  
  const promise = new Promise(resolve => {
    
    zipWorker.onmessage = ( params: MessageEvent<MessageToMainFromZipWorker> ) => {
      const data = params.data;
      const { action } = data;
      //console.log(`recieved a message from zipWorker: ${action}`);
      
      
      if( canceled.value ) {
        //resolve(void 0);
        //return;
      }

      // completion
      if( action === 'add-zip-completed' ) {
        const {fileId} = data;
        ConvStats.done++;
        ConvStats.success++;
        completedFileIdSet.add(fileId);
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
        case 'squeeze-filelist-zip':
          ConvStats.failedZipDone = true;
        case 'push-filelist-zip':
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
function createCanvasWorkerListener(ConvStats: Stat, canceled, SingleImageData: SingleImageDataType, message, notification, fileList: File[], completedFileIdSet: Set<number>, failedFileCountMap: Map<File, number>, targetFileMapById: Map<number, FileWithId>, progressingFileMapById) {
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
      if( !processingCoreLogItems.value.has(worker.id) )
        return;
      
      switch( action ) {
        case 'list-start':
        case 'file-start':
          return;
        
        case 'file-load':
        case 'file-converted':
          return;
        
        case 'file-canceled':
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
        const item = {
          key:_keyCounter++,
          core:worker.id,
          index: index,//fileId,
          path,
          command: `➡️started`,
        };
        processingCoreLogItems.value.set(worker.id, item);
        ConvStats.logs.push(item);
        break;
      }
      case 'file-load': {
        const { thumbnail, width, height } = data;
        processingCoreLogItems.value.get(worker.id).command = `🖼️loaded`;
        if( thumbnail ) {
          ConvStats.thumbnail = thumbnail;
        }
        break;
      }
      case 'file-converted': {
        const { index, path, fileId, image } = data;

        const item = processingCoreLogItems.value.get(worker.id);
        item.command = `🔃converted`;
        //processingCoreLogItems.delete(worker.id);
        completedItemsLog.value.set(fileId, item);
        ConvStats.converted++;
        
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
        const item = processingCoreLogItems.value.get(worker.id);
        if( failedCount < MAX_RETRY_COUNT ) {
          failedFileCountMap.set(file, failedCount + 1);
          
          // append the failed file to the conversion list to retry
          fileList.push(file);
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
        const item = completedItemsLog.value.get(fileId);
        ConvStats.done++;
        ConvStats.failure++;
        item.command = `❗zip-aborted`;
        item.error = true;

        break;
      }
      
      case 'list-end': {
        // release the worker
        WorkerManager.releaseWorker(worker);
        break;
      }
    }
  };

  return cworkerlistener;
}
