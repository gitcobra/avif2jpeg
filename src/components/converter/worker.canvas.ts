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
  } | {
    action: 'file-converted'
    image?: Blob
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
  fileId: number
  outputPath: string
  webkitRelativePath: string,
  quality: number
  type: string
  demandThumbnail: boolean
  demandImage: boolean
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
    return;
  }

  
  // start
  /*
  self.postMessage({
    action: 'list-start'
  } as MessageFromCanvasWorker);
  */

  // process file list
  const dataList = params.data;
  for( const data of dataList ) {
    await convertRecievedData( data );
  }
  
  // end
  self.postMessage({
    action: 'list-end',
  } as MessageFromCanvasWorker);
};


async function convertRecievedData(data) {
  const { index, file, fileId, type, quality, demandThumbnail, demandImage, webkitRelativePath } = data;

  const path = webkitRelativePath || file.webkitRelativePath || file.name;
  const inputsize = file.size;
  
  // start
  let messageToMain: MessageFromCanvasWorker;

  messageToMain = {
    action: 'file-start', 
    path, 
    fileId, 
    index,
  };
  self.postMessage( messageToMain );

  let sourceBitmap: ImageBitmap;
  try {
    sourceBitmap = await createImageBitmap(file);  
  } catch(e) {
    console.error('error occurred on canvas worker', fileId, path);
    messageToMain = {
      action: 'file-error', 
      path, 
      fileId, 
      index,
    };
    self.postMessage( messageToMain );
    return;
  }
  const {width, height} = sourceBitmap;

  // create a thumbnail image before transferring
  let dbitmap: ImageBitmap | null = null;
  if( demandThumbnail ) {
    //dbitmap = await createImageBitmap(sourceBitmap, {resizeHeight:80, resizeQuality: 'low'/*'pixelated'*/});
    const resize = width > height ? {resizeWidth: 110} : {resizeHeight:80};
    dbitmap = await createImageBitmap(sourceBitmap, {...resize, resizeQuality: 'low'});
  }

  // transfer the bitmap to the canvas
  bmctx.transferFromImageBitmap(sourceBitmap);
  
  // file loaded
  messageToMain = {
    action: 'file-load', 
    fileId, 
    path, 
    index, 
    thumbnail:dbitmap, 
    width, 
    height
  };
  self.postMessage( messageToMain );
  
  const blob = await canvas.convertToBlob({type, quality});
  const outputsize = blob.size;
  
  let imageBlob: Blob;
  if( demandImage ) {
    // output the converted image to the main thread 
    imageBlob = blob;
  }
  else {
    // output to worker.zip  
    const abuffer: ArrayBuffer | null = await blob?.arrayBuffer() || null;
    dataOutputPort.postMessage({
      data: abuffer, 
      path, 
      fileId
    }, [abuffer]);
    
    //dataOutputPort.postMessage({data: blob, path, fileId});
  }

  // send "file-end" message to the main thread
  messageToMain = {
    action: 'file-converted',
    path,
    fileId,
    index,
    outputsize,
    inputsize,
    image: imageBlob,
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
  const {inputsize, outputsize, path, index} = fileStat.get(fileId);
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
