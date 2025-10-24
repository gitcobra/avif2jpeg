import { OutputFileType } from "typescript";
import { buildDirsAndWriteFile } from "../../filesystem-api";
import { addSelfAndAncestorPathToSet, setFileNameAndExtension } from "../../util";

console.log('running converter.worker.canvas');

const canvas = new OffscreenCanvas(100, 100);
const bmctx = canvas.getContext('bitmaprenderer');
let dataOutputPort: MessagePort;
let fileSysDirHandler: FileSystemDirectoryHandle;
let existingFolderSet: Set<string>;
let keepPrevExt: string;
let outputExt: string;

const fileStat = new Map<number/*fileId*/, {
  outputsize: number;
  inputsize: number;
  path: string;
  index: number;
}>;

const overwriteAllowList = new Set<string>();
const overwriteDenyList = new Set<string>();
const overwriteDialogResolvers = new Map<
  string,
  (commands: OverwriteCommand) => void
>();

let overwriteDecision: boolean | undefined = undefined;



type FileInfo = {
  fileId: number;
  index: number;
  path: string;
};

export type MessageFromCanvasWorker = {
  action: 'list-start' | 'list-end' | 'respond-to-first-message';
} |
FileInfo & ({
    action: 'file-start';
  } |
  {
    action: 'file-load';
    thumbnail?: ImageBitmap;
    width: number;
    height: number;
    workerId?: number;
    inputsize: number;
  } |
  {
    action: 'file-converted'
    convertedImageBlob?: Blob;
    //blobUrl?: string
    shrinked: boolean;
    outputWidth: number;
    outputHeight: number;
    outputsize: number;
  } |
  {
    action: 'file-error' | 'file-canceled' | 'file-skip';
  } |
  {
    action: 'file-completed' | 'file-sys-completed';
    inputsize: number;
    outputsize: number;
    entireIndex: number;
    storedPath: string;
  }
);

export type MessageToCanvasWorker = {
  index: number;
  file: File;
  bitmap: ImageBitmap;
  fileId: number;
  outputPath: string;
  webkitRelativePath: string;
  quality: number;
  type: string;
  keepPrevExt: boolean;
  outputExt: string;
  
  demandThumbnail: boolean;
  isSingleImage: boolean;
  maxSize?: { width:number, height:number };
  retriedTime: number;

  //outputToMain: boolean
};

export type MessageToCanvasWorkerPort = {
  port: 'zip' | 'main';
  fsysDirHandler?: FileSystemDirectoryHandle;
  existingFolders?: Set<string>;
};

export type RequestOverwrite = FileInfo & {
  action: 'confirm-overwrite';
  type: 'file' | 'folder';
  target: string;
};
export type OverwriteResponse = {
  action: 'respond-overwrite';
  command: OverwriteCommand;
  target: string;
  fileId: number;
  path: string;
};
export type OverwriteCommand =
  'skip' | 'skip-all' | 'overwrite' | 'overwrite-all' | 'close' | 'cancel';

// listen messages from main thread
self.onmessage = async (
  params: MessageEvent<MessageToCanvasWorker | OverwriteResponse | MessageToCanvasWorkerPort>
) => {
  const data = params.data;
  
  // set an output port for zip
  if( 'port' in data ) {
    const { ports } = params;
    if( ports[0] ) {
      const {port: type, fsysDirHandler, existingFolders} = data;
      fileSysDirHandler = fileSysDirHandler || fsysDirHandler;
      existingFolderSet = existingFolders;

      switch( type ) {
        case 'zip':
          // zip.worker
          dataOutputPort = ports[0];
          
          // set a listener that get messages from zip.worker
          dataOutputPort.onmessage = listenerForZipWorker;

          self.postMessage({action: 'respond-to-first-message'});
          overwriteDecision = undefined;
          break;
        default:
          throw new Error(`unexptected port type ${type}`);
      }
    }
    return;
  }

  if( 'action' in data ) {
    const { action, command, fileId, path, target } = data;
    switch( action ) {
      case 'respond-overwrite':
        const callback = overwriteDialogResolvers.get(path);
        if( !callback )
          throw new Error(`no resolver exists for overwrite confirmation "${path}"`);
        
        overwriteDialogResolvers.delete(path);
        callback(command);
        break;
    }
    return;
  }

  await convertRecievedData( data );
  
  // end
  self.postMessage({
    action: 'list-end',
  } satisfies MessageFromCanvasWorker);

  canvas.width = 1;
  canvas.height = 1;
};

export type MessageToZipFromCanvasType = {
  //action: string
  //data?: ArrayBuffer | Uint8Array
  blob: Blob
  crc?: number
  //zipSize?: number
  path?: string
  outputPath?: string
  fileId: number
};
//async function convertRecievedData(data: MessageToCanvasWorker[number]) {
async function convertRecievedData(data: MessageToCanvasWorker) {
  const {
    index, file, bitmap, fileId, type, quality, demandThumbnail, isSingleImage,
    webkitRelativePath, maxSize, keepPrevExt, outputExt, 
    //outputToMain,
  } = data;

  const path = webkitRelativePath || file.webkitRelativePath || file.name;
  const inputsize = file.size;
  
  // start
  let messageToMain: MessageFromCanvasWorker;

  let sourceWidth = 0, sourceHeight = 0;
  let sourceBitmap: ImageBitmap;
  let width: number, height: number;
  let outputWidth: number, outputHeight: number;
  let shrinked = false;

  try {
    sourceBitmap = bitmap; //await createImageBitmap(file);
    
    ({width, height} = sourceBitmap);
    sourceWidth = outputWidth = width;
    sourceHeight = outputHeight = height;
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
      outputWidth = sourceBitmap.width;
      outputHeight = sourceBitmap.height;
      bitmap.close();
    }
  } catch(e) {
    console.error('error occurred on canvas worker', fileId, path, e);
    self.postMessage({
      action: 'file-error', 
      path, 
      fileId, 
      index,
    } satisfies MessageFromCanvasWorker);
    return;
  }
  
  // create a thumbnail image before transferring
  let dbitmap: ImageBitmap | undefined;
  if( demandThumbnail ) {
    //dbitmap = await createImageBitmap(sourceBitmap, {resizeHeight:80, resizeQuality: 'low'});
    const resize = width > height ? {resizeWidth: 110} : {resizeHeight:80};
    dbitmap = await createImageBitmap(sourceBitmap, {...resize, resizeQuality: 'low'});
  }

  // transfer the bitmap to the canvas
  bmctx!.transferFromImageBitmap(sourceBitmap);
  sourceBitmap.close();

  
  // file loaded
  self.postMessage({
    action: 'file-load', 
    fileId, 
    path, 
    index, 
    thumbnail: dbitmap, 
    width: sourceWidth,
    height: sourceHeight,
    inputsize,
  } satisfies MessageFromCanvasWorker);


  // convert  
  let blob: Blob;
  try {
    blob = await canvas.convertToBlob({type, quality});
  } catch(e) {
    console.error('error occurred while converting', fileId, path, e);
    self.postMessage({
      action: 'file-error', 
      path, 
      fileId, 
      index,
    } satisfies MessageFromCanvasWorker)
    return;
  }
  const outputsize = blob.size;
  
  // clear canvas
  canvas.width = 1;
  canvas.height = 1;

  // send message to loader
  self.postMessage({
    action: 'file-converted',
    path,
    fileId,
    index,
    outputsize,
    //inputsize,
    //convertedImageBlob: messageToMain ? blob : null,
    //blobUrl,
    //width,
    //height
    outputWidth,
    outputHeight,
    shrinked,
  } satisfies MessageFromCanvasWorker)
  
  fileStat.set(fileId, {outputsize, inputsize, path, index});
  
  
  // wrtie via File System API
  if( fileSysDirHandler ) {
    const outputPath = setFileNameAndExtension(path, outputExt, keepPrevExt)
    const overwrite = typeof overwriteDecision === 'boolean' ?
      overwriteDecision : createOverwriteDialog(outputPath, fileId, index);
    
    try {
      if( await buildDirsAndWriteFile(fileSysDirHandler, outputPath, blob, overwrite) ) {
        addSelfAndAncestorPathToSet(overwriteAllowList, outputPath);

        // post to loader
        self.postMessage({
          action: 'file-sys-completed',
          fileId,
          path,
          index,
          inputsize, 
          outputsize, 
          
          entireIndex: index,
          storedPath: outputPath,
          //renamed,
        } satisfies MessageFromCanvasWorker);
      }
      else {
        //throw new Error(`failed to write file "${path}"`);
        self.postMessage({
          action: 'file-skip',
          fileId,
          path,
          index,
        } satisfies MessageFromCanvasWorker);
      }
    } catch(e: any) {
      // post to loader
      console.error(e.message);
      self.postMessage({
        action: 'file-error',
        fileId,
        path,
        index,
      } satisfies MessageFromCanvasWorker);
    }
  }  
  // output to worker.zip
  //const crc = await AnZip.getCRC32(blob);  
  else {
    dataOutputPort.postMessage({
      //data: abuffer, 
      blob,
      path, 
      fileId
    } satisfies MessageToZipFromCanvasType);
  }
}

const listenerForZipWorker = (params) => {
  // informed that the file was zipped
  const {fileId, renamed, outputPath, canceled, entireIndex, storedPath} = params.data;
  
  // post to loader
  const {inputsize, outputsize, path, index} = fileStat.get(fileId)!;
  self.postMessage({
    action: canceled ? 'file-canceled' : 'file-completed',
    /*path: response,*/ 
    fileId,
    path,
    index,
    inputsize, 
    outputsize, 
    
    entireIndex,
    storedPath,
    //renamed,
  } satisfies MessageFromCanvasWorker);
};


function createOverwriteDialog(path: string, fileId: number, index: number) {
  // create callback for overwrite confirmation
  return async (handle: FileSystemHandle, fname: string, parentPath: string): Promise<boolean> => {
    const isFile = handle instanceof FileSystemFileHandle;
    
    const targetPath = parentPath + fname;
    if( !isFile && !existingFolderSet.has(targetPath) ) {
      console.log('not existing', targetPath);
      return true;
    }

    const command = await new Promise<OverwriteCommand>((resolve) => {
      console.log(`request overwrite confirmation to main`);

      // send message to main
      self.postMessage({
        action: 'confirm-overwrite',
        type: isFile ? 'file' : 'folder',
        target: parentPath + fname,
        
        path,
        fileId,
        index,
      } satisfies RequestOverwrite);

      // hook callback into message listerner
      // *path must be unique in the file list
      overwriteDialogResolvers.set(path, (command: OverwriteCommand) => {
        console.log(`resolved confirmation "${command}"`);
        resolve(command);
      });
    });

    console.log(command)

    switch(command) {
      case 'overwrite-all':
        overwriteDecision = true;
      case 'overwrite':
        //addSelfAndAncestorPathToSet(overwriteAllowList, parentPath + fname);
        return true;
      
      case 'skip-all':
        overwriteDecision = false;
      case 'close':
      case 'cancel':
      case 'skip':
        overwriteDenyList.add(path);
        return false;
      
      default:
        throw new Error(`unexpected OverwriteCommand ${"command"}`);
    }
  };
}
