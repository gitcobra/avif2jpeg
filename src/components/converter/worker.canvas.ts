console.log('running converter.worker.canvas');

const canvas = new OffscreenCanvas(100, 100);
const bmctx = canvas.getContext('bitmaprenderer');
let dataOutputPort: MessagePort;

const fileStat = new Map<number/*fileId*/, {
  outputsize: number
  inputsize: number
  path: string
  index: number
}>;



type FileInfo = {
  fileId: number
  index: number
  path: string
};

export type MessageFromCanvasWorker = {
  action: 'list-start' | 'list-end'
} |
FileInfo & (
  {
    action: 'file-start'
  } | {
    action: 'file-load'
    thumbnail?: ImageBitmap
    width: number
    height: number
    shrinked: boolean
  } | {
    action: 'file-converted'
    image?: Blob
    //blobUrl?: string
    width: number
    height: number
    inputsize: number
    outputsize: number
  } | {
    action: 'file-error' | 'file-canceled'
  } | {
    action: 'file-completed'
    inputsize: number
    outputsize: number
  }
);

export type MessageToCanvasWorker = {
  index: number
  file: File
  bitmap: ImageBitmap
  fileId: number
  outputPath: string
  webkitRelativePath: string,
  quality: number
  type: string
  demandThumbnail: boolean
  isSingleImage: boolean
  maxSize: { width:number, height:number } | null
  retriedTime: number
}[];
// message from main thread
self.onmessage = async (params: MessageEvent<MessageToCanvasWorker | null>) => {
  // set an output port for zip
  const { ports } = params;
  if( ports[0] ) {
    // zip.worker
    dataOutputPort = ports[0];
    
    // set a listener that get messages from zip.worker
    dataOutputPort.onmessage = listenerForZipWorker;

    self.postMessage({action: 'respond-to-first-message'});

    return;
  }

  
  // start
  /*
  self.postMessage({
    action: 'list-start'
  } as MessageFromCanvasWorker);
  */

  // process file list
  const dataList = params.data!;
  for( const data of dataList ) {
    await convertRecievedData( data );
  }
  
  // end
  self.postMessage({
    action: 'list-end',
  } as MessageFromCanvasWorker);

  canvas.width = 1;
  canvas.height = 1;
};


async function convertRecievedData(data: MessageToCanvasWorker[number]) {
  const { index, file, bitmap, fileId, type, quality, demandThumbnail, isSingleImage, webkitRelativePath, maxSize } = data;
  const { retriedTime } = data;

  const path = webkitRelativePath || file.webkitRelativePath || file.name;
  const inputsize = file.size;
  
  // start
  let messageToMain: MessageFromCanvasWorker;

  /*
  messageToMain = {
    action: 'file-start', 
    path, 
    fileId, 
    index,
  };
  self.postMessage( messageToMain );
  */

  let sourceBitmap: ImageBitmap;
  let width: number, height: number;
  let shrinked = false;

  /*  
  // wait a second for retrying
  const retryingDelay = retriedTime ? Math.max(0, 5000 - (Date.now() - retriedTime)) : 0;
  if( retryingDelay )
    await new Promise(r => setTimeout(r, retryingDelay));
  */
  
  try {
    sourceBitmap = bitmap; //await createImageBitmap(file);
    
    ({width, height} = sourceBitmap);
    // resize the source bitmap
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
      shrinked = !!resize;
      
      sourceBitmap = await createImageBitmap(sourceBitmap, {resizeQuality:'high', ...(resize||{})});
      bitmap.close();
    }
  } catch(e) {
    console.error('error occurred on canvas worker', fileId, path, e);
    messageToMain = {
      action: 'file-error', 
      path, 
      fileId, 
      index,
    };
    self.postMessage( messageToMain );
    return;
  }
  
  // create a thumbnail image before transferring
  let dbitmap: ImageBitmap | undefined;
  if( demandThumbnail ) {
    //dbitmap = await createImageBitmap(sourceBitmap, {resizeHeight:80, resizeQuality: 'low'});
    const resize = width > height ? {resizeWidth: 110} : {resizeHeight:80};
    dbitmap = await createImageBitmap(sourceBitmap, {...resize, resizeQuality: 'pixelated'});
  }

  //await new Promise(r => setTimeout(r, 3000));
  //const canvas = new OffscreenCanvas(100, 100);
  //const bmctx = canvas.getContext('bitmaprenderer');

  // transfer the bitmap to the canvas
  bmctx!.transferFromImageBitmap(sourceBitmap);
  
  // file loaded
  messageToMain = {
    action: 'file-load', 
    fileId, 
    path, 
    index, 
    thumbnail: dbitmap, 
    width, 
    height,
    shrinked,
  };
  self.postMessage( messageToMain );
  
  let blob: Blob;
  try {
    blob = await canvas.convertToBlob({type, quality});
  } catch(e) {
    console.error('error occurred while converting', fileId, path, e);
    messageToMain = {
      action: 'file-error', 
      path, 
      fileId, 
      index,
    };
    self.postMessage( messageToMain );
    return;
  }
  const outputsize = blob.size;
  
  // output to worker.zip  
  dataOutputPort.postMessage({
    //data: abuffer, 
    blob,
    path, 
    fileId
  }/*, [blob]*/);

  // send "file-end" message to the main thread
  messageToMain = {
    action: 'file-converted',
    path,
    fileId,
    index,
    outputsize,
    inputsize,
    //image: imageBlob,
    //blobUrl,
    width,
    height
  };
  self.postMessage( messageToMain );
  
  fileStat.set(fileId, {outputsize, inputsize, path, index});
}

const listenerForZipWorker = (params) => {
  // informed that the file was zipped
  const {fileId, renamed, outputPath, canceled} = params.data;
  
  // post to main thread
  const {inputsize, outputsize, path, index} = fileStat.get(fileId)!;
  const messageToMain: MessageFromCanvasWorker = {
    action: canceled ? 'file-canceled' : 'file-completed',
    /*path: response,*/ 
    fileId,
    path,
    index,
    inputsize, 
    outputsize, 
    //renamed,
  };
  self.postMessage( messageToMain );
};
