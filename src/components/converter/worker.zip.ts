import AnZip from "@gitcobra/anzip";


console.log('converter.worker.zip started');

let azip = new AnZip();
let bytesSum = 0;
let count = 0;
let terminated = false;

let MaxZipSize = 1024 * 1024 * 1024;
let keepPrevExtension = false;
let outputExtension = '';





// message from main thread
type ZipMessageType = MessageEvent<{
  action: string
  
  // configurations
  zipSize?: number
  keepExt?: boolean
  outputExt?: string

  // for failed file
  buffer?: ArrayBuffer
  path?: string
}>;
self.onmessage = (params: ZipMessageType) => {
  const { data: { action, zipSize, keepExt, outputExt, buffer, path }, ports } = params;
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
    
    case 'add-filelist':
      if( bytesSum >= MaxZipSize ) {
        outputZipUrl('push-filelist-zip');
      }
      
      //const path = (webkitRelativePath || file.webkitRelativePath || file.name).replace(/^\//, '');
      //const buf = await file.arrayBuffer();
      azip.add(path, buffer);
      bytesSum += buffer.byteLength;
      count++;
      break;
    
    case 'squeeze-filelist':
      outputZipUrl('squeeze-filelist-zip');
      break;

    default:
      console.error(`zip.worker got an unknown action. "${action}"`);
      break;
  }
};




// message from canvas worker
type ZipMessageFromCanvasType = MessageEvent<{
  //action: string
  data?: ArrayBuffer | Uint8Array
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
  let { data: { data, path, fileId } } = params;
  
  if( terminated ) {
    //console.log('terminated flag is true for zip worker');
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
  const abuffer = data;
  const bufferSize = abuffer.byteLength ?? 0;
  if( bytesSum + bufferSize > MaxZipSize ) {
    outputZipUrl('push-zip');
  }

  azip.add(outputPath, abuffer);
  bytesSum += bufferSize;
  count++;

  
  // inform main thread that adding the file to the zip is completed
  let message: AddingZipMessageToMain = {
    action: 'add-zip-completed',
    fileId, 
  };
  self.postMessage( message );
  // inform canvas.worker that adding the file to the zip is completed
  port.postMessage({fileId, renamed: dupCounter >= 2, outputPath});
  
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
    action: 'zip-squeeze-error' | 'zip-error'
  }
);
function outputZipUrl(action: ZippingMessageToMain['action']) {
  console.log('zipworker emitZIP: ' + MaxZipSize, action);
  
  let message: ZippingMessageToMain;
  try {
    const url = azip.url();
    message = {url, action, size:bytesSum, count};
  } catch(e: any) {
    console.warn(e.message, action);
    message = {action: action === 'squeeze-zip' ? 'zip-squeeze-error' : 'zip-error', size:bytesSum, count};
  }
  self.postMessage( message );

  
  azip.clear();
  azip = new AnZip();
  count = 0;
  bytesSum = 0;
}


export type MessageToMainFromZipWorker = ZippingMessageToMain | AddingZipMessageToMain;
