import { ref, watch, WatchStopHandle } from 'vue';

import * as WorkerManager from './workers/worker-manager';
import ZipWorker from './workers/worker.zip.ts?worker';
import ImgLoadWorker from './workers/worker.loader.ts?worker';
//import ZipWorkerURL from './worker.zip.ts?worker&url';
import type { MessageToCanvasWorker, MessageFromCanvasWorker } from './workers/worker.canvas';

import type { FileWithId } from '../file-selector.vue'
import type Converter from './converter.vue';
import ConversionStatus from './status/status.vue';
import { MessageToMainFromZipWorker } from './workers/worker.zip';
import { MaxThreads, UserSettings } from '@/user-settings';
import { MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider';
//import { NotificationApiInjection } from 'naive-ui/es/notification/src/NotificationProvider';
import { ConverterResult } from './converter.vue';
import { LoaderMessageType, MessageFromLoader } from './workers/worker.loader';
import { sleep } from "@/components/util";


// types

type ConverterType = InstanceType<typeof Converter>;
type Props = ConverterType['$props'];
type ConversionStatusType = InstanceType<typeof ConversionStatus>;
type Stat = ConversionStatusType['status'];
type LogType = Stat['logs'][number];



// constants

const TIMEOUT_WORKER_AVAILABILITY_MSEC = 1000 * 10;



// module scope variables
let zipWorkerModuleScope: Worker;
const processingLogItems = new Map<number, LogType>;//ref(new Map<number, LogType>).value;
const fileMapById = new Map<number, FileWithId>;
const failedFileCountMap = new Map<number, number>;
const variousFileInfo = new Map<number, {
  shrinked?: boolean;
}>();



// parameters from parent module

let completedFileIdSet: Set<number>;
let ConvStats: Stat;
let canceled: Ref<boolean, boolean>;
let props: Props;
let files: FileWithId[];
let format: string;
let quality: number;
let outputExt: string;
let imageType: string;
let message: MessageApiInjection;
//let notification: NotificationApiInjection;

// set or clear the variables
function clearModuleVariables(param?: ConverterParameter) {
  let obj = param || {} as any;
  ({
    files,
    completedFileIdSet, 
    ConvStats, 
    canceled, 
    props, 
    format, 
    quality, 
    outputExt, 
    imageType, 
    message, 
    //notification,
  } = obj);

  zipWorkerModuleScope = null;
  

  processingLogItems.clear();
  fileMapById.clear();
  failedFileCountMap.clear();
  variousFileInfo.clear();

  fileMapById.clear();
  failedFileCountMap.clear();
  variousFileInfo.clear();

  // clear param object
  if( param ) {
    for( const p in param ) {
      delete param[p];
    }
  }
};






// main routine

type ConverterParameter = {
  files: FileWithId[];
  completedFileIdSet: Set<number>;
  ConvStats: Stat;
  canceled;
  props: Props;
  format: string;
  quality: number;
  outputExt: string;
  imageType: string;
  message: MessageApiInjection;
  //notification: NotificationApiInjection
};
export async function convertTargetFilesInMultithread(param: ConverterParameter): Promise<ConverterResult> {
  // init variables
  clearModuleVariables(param);
  completedFileIdSet.clear();
  
  
  // initialize workers

  // setup zip worker
  let createdWorkers: [Worker, Worker];
  try {
    createdWorkers = await setupWorkers();
  } catch(e) {
    // terminate the entire application here if failed to load the worker
    clearModuleVariables();
    return {
      exception: new Error('worker-load-error'),
      callbackToClearConverter: new Function as any,
      callbackToGenerateFailedZips: new Function as any,
    };
  }
  
  const [imgloadWorker, zipWorker] = createdWorkers;
  zipWorkerModuleScope = zipWorker;

  // prepare a promise to detect completion of the last zip creation
  const promiseWaitZipSqueezing = new Promise(resolve => {
    zipWorker.onmessage = ( params: MessageEvent<MessageToMainFromZipWorker> ) => {
      const data = params.data;
      const { action } = data;
      switch( action ) {
        case 'squeeze-zip':
        case 'zip-squeeze-error':
          resolve(void 0);
          break;
      }
    };
  });

  // prepare a promise to wait all conversion process
  const promiseWaitLoaderEnd = new Promise<void>((resolve) => {
    imgloadWorker.onmessage = (params) => {
      const {data: {action}} = params;
      if( action === 'end-convert' ) {
        resolve();
      }
    };
  });



  
  // start to convert

  // NOTE: *fileIdList is needed because chrome cannot read FileWithId._id property on a Worker
  const fileIdList = files.map(val => val._id);

  // create a file list by id
  files.forEach(v => fileMapById.set(v._id, v));

  // prepare watcher in case that the conversion process is canceled
  const unwatchCancelButton = watch(canceled, (val) => {
    if( !val )
      return;
    
    unwatchCancelButton();
    const message: LoaderMessageType = {
      action: 'cancel-convert',
    };
    imgloadWorker.postMessage(message);
  });

  // send message
  const msgToLoader: LoaderMessageType = {
    action: 'start-convert',
    list: files,
    fileIdList,
    outputQuality: quality,
    outputType: format,
    threads: props.threads,
  };
  imgloadWorker.postMessage(msgToLoader);
  
  
  // wait for end of conversion
  await promiseWaitLoaderEnd;
  console.log('end loader worker');

  /*
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
  */

  // squeeze remaining zip
  zipWorker.postMessage({action: 'squeeze'});
  await promiseWaitZipSqueezing;
  console.log('end zip worker');

  
  // end process

  unwatchCancelButton();

  const callbackToClearConverter = () => {
    WorkerManager.init();
    zipWorker.onmessage = null;
    zipWorker.terminate();
    imgloadWorker.onmessage = null;
    imgloadWorker.terminate();
    clearModuleVariables();
  };
  let doneCalled = false;
  const callbackToGenerateFailedZips = async (list: FileWithId[]) => {
    if( doneCalled )
      return;
    doneCalled = true;
    await pushErrorZipsInMultithread(list, zipWorker, {}, ConvStats);
  };

  return {
    callbackToClearConverter,
    callbackToGenerateFailedZips, 
  };
}




// setup worker
//async function setupWorkers(canvasWorkerCount: number, workerCountForHugeImages: number, canvasListener: ReturnType<typeof createCanvasWorkerListener>) {
async function setupWorkers(): Promise<[Worker, Worker]> {
  WorkerManager.init();  
  

  // create loader worker
  const imgloadWorker = new ImgLoadWorker();
  // create a Worker for zip archives (zip worker is always only one instance)
  const zipWorker = new ZipWorker();


  // promise to wait the first response and check if the workers are available
  const promiseToWaitForResponseFromWorkers = new Promise<boolean>((resolve, reject) => {
    const determinator = (flag: boolean) => {
      zipWorker.removeEventListener('message', listener); 
      imgloadWorker.removeEventListener('message', listener);
      clearTimeout(tid);
      
      if( flag ) {
        console.log('workers are avialble');
        resolve(flag);
      }
      else {
        console.error(`couldn't get responses from workers`);
        reject(flag);
      }
    };
    
    let recievedZipWorker = false;
    let recievedLoadWorker = false;
    const listener = (ev: MessageEvent) => {
      if( ev.target === zipWorker ) {
        console.log('got a message from zip worker');
        recievedZipWorker = true;
      }
      if( ev.target === imgloadWorker ) {
        console.log('got a message from loader worker');
        recievedLoadWorker = true;
      }
      
      if( recievedZipWorker && recievedLoadWorker )
        determinator(true);
    }

    let tid = 0;
    zipWorker.addEventListener('message', listener);
    imgloadWorker.addEventListener('message', listener);
    tid = window.setTimeout(() => determinator(false), TIMEOUT_WORKER_AVAILABILITY_MSEC);
  });


  // set ports between loader and zip worker
  const {port1, port2} = new MessageChannel();
  const msgToLoader: LoaderMessageType = {
    action: 'set-zip-port',
  };
  zipWorker.postMessage({action: 'set-port-loader'}, [port1]);
  imgloadWorker.postMessage(msgToLoader, [port2]);

  
  // wait 
  console.log('test workers\' availability');
  await promiseToWaitForResponseFromWorkers;


  
  // set zip.worker configurations
  zipWorker.postMessage({
    action: 'set-config',
    zipSize: props.maxZipSizeMB * 1024 * 1024,
    keepExt: props.retainExtension,
    outputExt,
    imageType,
  });

  // set listeners for main process
  imgloadWorker.addEventListener('message', ImgLoaderListener);
  zipWorker.addEventListener('message', zipWorkerListener);

  return [imgloadWorker, zipWorker];
}

// create a listener for zip.worker
const zipWorkerListener = ( params: MessageEvent<MessageToMainFromZipWorker> ) => {
  const data = params.data;
  const { action } = data;
  //console.log(`recieved a message from zipWorker: ${action}`);

  // completion
  switch( action ) {
    case 'add-zip-completed': {
      const {fileId, entireIndex, storedPath} = data;
      
      // NOTE: this code is moved to "file-completed" action in canvas listener
      //   because firefox seems to recieve this action before canvas listener.
      /*
      ConvStats.done++;
      ConvStats.success++;
      completedFileIdSet.add(fileId);
      
      const item = processingLogItems.get(fileId);
      item.zippedIndex = entireIndex;
      ConvStats.ziplogs.push({
        fileId,
        storedPath,
      });
      */

      return;
    }

    case 'respond-image': {
      const {url, index, path, size, fileId} = data;
      
      ConvStats.convertedImageUrl = url;
      ConvStats.convertedImageSize = size;
      ConvStats.convertedImageIndex = index;
      ConvStats.convertedImageName = path;
      
      // create an object url of the original image
      let orgUrl = '', orgSize = 0, orgName = '';
      if( fileId >= 0 ) {
        const file = fileMapById.get(fileId);
        orgUrl = URL.createObjectURL(file);
        orgSize = file.size;
        orgName = file.webkitRelativePath || file.name;
      }
      ConvStats.convertedImageOrgUrl = orgUrl;
      ConvStats.convertedImageOrgSize = orgSize;
      ConvStats.convertedImageOrgName = orgName;
      ConvStats.convertedImageShrinked = variousFileInfo.get(fileId)?.shrinked;
      
      return;
    }
    
    case 'respond-delete': {
      const {index, success, fileId} = data;
      processingLogItems.get(fileId).command = '❌deleted';
      processingLogItems.get(fileId).completed = false;
      return;   
    }
  }

  // error creating failed zips
  switch( action ) {
    case 'error-push-filelist-zip':
      const {path} = data;
      ConvStats.failedZipDone = true;
      message.error(`an error occurred "${path}"`, {duration: 3000});
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
      //resolve(void 0);
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
      console.log(count);
      break;
    
    // NOTE:
    // error occured during zipping process (untested)
    case 'zip-error':
    case 'zip-squeeze-error':
      ConvStats.zippingErrorCount += count;
      if( action === 'zip-squeeze-error' ) {
        //resolve(void 0);
      }
      break;
  }
};


// listener for canvas worker
// all canvas workers share the single listener
type MessageTypeCanvasWorkerListener = MessageEvent<MessageFromLoader>;
const ImgLoaderListener = (params: MessageTypeCanvasWorkerListener) => {
  const worker = params.target as Worker;
  
  const { data } = params;
  const { action } = data;


  switch(action) {
    case 'list-start':
      break;
    case 'list-end':
      break;
    
    case 'file-start': {
      const { index, path, fileId } = data;
      //console.log(`file-start ${index}`);
      fileStart(index, path, fileId);
      break;
    }
    case 'file-load': {
      const { thumbnail, width, height, fileId, shrinked, workerId } = data;
      const item = processingLogItems.get(fileId)!;
      item.core = workerId;//worker.id;
      item.command = `🖼️loaded`;

      if( thumbnail ) {
        ConvStats.thumbnail = thumbnail;
      }
      
      let dat = variousFileInfo.get(fileId);
      
      if( !dat ) {
        dat = {};
        variousFileInfo.set(fileId, dat);
      }
      dat.shrinked ??= shrinked;
      //console.log(fileId, dat, "load")
      break;
    }
    case 'file-converted': {
      const { index, path, fileId } = data;

      const item = processingLogItems.get(fileId)!;
      item.command = `🔃converted`;
      //processingCoreLogItems.delete(worker.id);
      //completedItemsLog.set(fileId, item);
      ConvStats.converted++;

      break;
    }

    // otherwese 'file-completed' action is caused by worker.zip
    case 'file-completed': {
      const { inputsize, outputsize, fileId, entireIndex, storedPath } = data;
 
      const item = processingLogItems.get(fileId);//completedItemsLog.get(fileId);
      if( item ) {
        item.command = `✅completed`;
        item.completed = true;
        item.fileId = fileId;
      }
      
      ConvStats.inputTotalSize += inputsize;
      ConvStats.outputTotalSize += outputsize;


      ConvStats.done++;
      ConvStats.success++;
      completedFileIdSet.add(fileId);
      

      item.zippedIndex = entireIndex;
      ConvStats.ziplogs[entireIndex] = {
        fileId,
        storedPath,
      };

      break;
    }
    
    case 'file-retry': {
      const { index, path, fileId } = data;
      fileRetry(index, path, fileId);
      break;
    }
    case 'file-error': {
      const { index, path, fileId } = data;
      fileError(index, path, fileId);
      break;
    }
    // canceled before zippping
    case 'file-canceled': {
      const { fileId, path } = data;
      fileCanceled(fileId);
      break;
    }
    
  }
};

let _keyCounter = 0;
function fileStart(/*workerId: number,*/ index: number, path: string, fileId: number) {
  const item = {
    key: _keyCounter++,
    core: -1,//workerId, *it is unknown which worker is used at this point.
    index: index,//fileId,
    path,
    command: `➡️started`,
  };
  processingLogItems.set(fileId, item);
  ConvStats.logs.push(item);
  
  if( !failedFileCountMap.has(fileId) ) {   
    if( !canceled.value ) {
      ConvStats.startedCount++;
    }
  }
  else {
    console.warn(`retry "${path}".`);
  }
}

function fileRetry(index: number, path: string, fileId: number) {
  const item = processingLogItems.get(fileId)!;
  item.command = `⚠️retrying`;
  item.error = true;
    
  message.warning(`retrying "${path}"`, {
    duration: 3000,
  });

  ConvStats.retried++;
  failedFileCountMap.set(fileId, 1);
}
function fileError(index: number, path: string, fileId: number) {
  console.error(`failed to load "${path}". the image may be corrupted or cannot be read by some reason.`);
  const item = processingLogItems.get(fileId);
  ConvStats.done++;
  ConvStats.failure++;
  item.command = `❗failed`;
  item.error = true;

  message.error(`failed to load "${path}"`, {duration: 5000});
}

function fileCanceled(fileId: number) {
  const item = processingLogItems.get(fileId);
  ConvStats.done++;
  ConvStats.failure++;
  item.command = `❗canceled`;
  item.error = true;
}



export function demandImage(index: number) {
  zipWorkerModuleScope?.postMessage({action: 'request-image', index});
}
export function deleteImage(index: number) {
  zipWorkerModuleScope?.postMessage({action: 'delete-image', index});
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
    

    if( ConvStats.failedZipDone ) {
      break;
    }
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

  if( ConvStats.failedZipDone ) {
    message.error(`Zipping error files was aborted`, {duration: 5000});
    return;
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
