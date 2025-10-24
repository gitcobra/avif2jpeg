// legacy converter that runs in single thread

import type { FileWithId } from '../file-selector.vue';
import AnZip from '@gitcobra/anzip-es6';
import { SplitZipsIndexer } from '../util';

import type Converter from './converter.vue';
import type ConversionStatus from './status/status.vue';
import { ConverterResult } from './converter.vue';
import { EnqueueOverwriteConfirmation } from './converter.multi';
import { buildDirsAndWriteFile, getFileHandle } from '../filesystem-api';


type ConverterType = InstanceType<typeof Converter>;
type Props = ConverterType['$props'];
type ConversionStatusType = InstanceType<typeof ConversionStatus>;
type Stat = ConversionStatusType['status'];

let demandImageModuleScope: (index: number) => any | null;

export async function convertImagesInSingleThread(
  list: FileWithId[],
  completedFileIdSet: Set<number>,
  props: Props,
  canceled,
  ConvStats: Stat,
  enqueueConfirmation: EnqueueOverwriteConfirmation,

): Promise<ConverterResult> {
  let currentImgBlobUrl = '';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let azip = new AnZip;
  const aziplist: AnZip[] = [azip];
  const zipIndex = new SplitZipsIndexer;

  const type = props.format;
  const quality = props.quality / 100;
  const ext = [...type.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/, 'jpg');

  const fileCount = list.length;
  const maxZipSizeMB = props.maxZipSizeMB * 1024 * 1024;

  const fsysDirHandle = props.outputDirHandle;

  let index = 0;
  let lastImageBlob = null;
  let lastImageName = '';
  let lastImageWidth = 0;
  let lastImageHeight = 0;
  
  let lastImageOrgUrl = '';
  let lastImageOrgSize = 0;

  let outputSize = 0;
  let _keyCounter = 0;
  let zippedCount = 0;
  let currentOutputSizeSum = 0;
  let memoryProblemOccurred = false;


  const completedFileDat: {id: number, path: string, originalIndex: number}[] = [];
  demandImageModuleScope = async (index: number) => {
    if( fsysDirHandle ) {
      const citem = completedFileDat[index];
      if( !citem ) {
        console.error('item is not in completedFileDat', index);
        return;
      }
      
      // create an object url of the original image
      let orgUrl = '', orgSize = 0, orgName = '';
      const orgfile = list[citem.originalIndex];
      console.log(list);
      console.log(orgfile, citem.originalIndex);
      orgUrl = URL.createObjectURL(orgfile);
      orgSize = orgfile.size;
      orgName = orgfile.webkitRelativePath || orgfile.name;
      ConvStats.convertedImageOrgUrl = orgUrl;
      ConvStats.convertedImageOrgSize = orgSize;
      ConvStats.convertedImageOrgName = orgName;

      // load an image written to local folder
      const path = citem.path;
      const file = await getFileHandle(fsysDirHandle, path, true);
      // Create a Blob URL for the image
      const url = URL.createObjectURL(file);
      ConvStats.convertedImageUrl = url;
      ConvStats.convertedImageSize = file.size;
      ConvStats.convertedImageIndex = index;
      ConvStats.convertedImageName = citem.path;
    }
    else { 
      const [zidx, fidx] = zipIndex.get(index);
      const azip = aziplist[zidx];

      const blob = azip.get(fidx, type);
      ConvStats.convertedImageIndex = index;
      ConvStats.convertedImageName = azip.getPathByIndex(fidx);
      //ConvStats.convertedImageUrl = URL.createObjectURL( new Blob([azip.get(fidx)], {type}) );
      ConvStats.convertedImageUrl = URL.createObjectURL( blob );
      ConvStats.convertedImageSize = blob.size;
      
      // create an object url of the original image
      let orgUrl = '', orgSize = 0, orgName = '';
      const file = fileListByZippedIndex[index];
      orgUrl = URL.createObjectURL(file);
      orgSize = file.size;
      orgName = file.webkitRelativePath || file.name;
      ConvStats.convertedImageOrgUrl = orgUrl;
      ConvStats.convertedImageOrgSize = orgSize;
      ConvStats.convertedImageOrgName = orgName;
    }
  };

  const fileListByZippedIndex: FileWithId[] = [];
  for( const file of list ) {
    if( canceled.value )
      break;

    const fileName = file.name;
    let fname: string = '';
    const inputSize = file.size;
    const path = (file.webkitRelativePath || (file as any).relativePath || fileName).replace(/^\//, '');
    const img: HTMLImageElement = document.createElement('img');
    const basename = (path || fileName);

    const item: Stat['logs'][number] = {
      key: _keyCounter++,
      core: -1,
      index: index++,
      path,
      command: `➡️start`,
    };
    
    // started count
    ConvStats.startedCount = index;

    ConvStats.logs.push(item);
    let curLogItemIdx = ConvStats.logs.length - 1;

    let abuffer: ArrayBuffer;
    // clear previous object url
    if( currentImgBlobUrl ) {
      URL.revokeObjectURL(currentImgBlobUrl);
      currentImgBlobUrl = '';
    }
    
    // convert to Object URL
    currentImgBlobUrl = URL.createObjectURL(file);
    lastImageOrgUrl = currentImgBlobUrl;
    lastImageOrgSize = file.size;

    // load img element
    img.src = currentImgBlobUrl;
    const imgloaded: boolean = await getAsPromise(img).then(() => true).catch(() => false);


    // failed to load or canceled
    if( !img.complete || !imgloaded || canceled.value ) {
      ConvStats.done++;
      ConvStats.failure++;
      item.command = `❗failed`;
      
      continue;
    }

    // draw on the canvas
    const w = img.width;
    const h = img.height;
    canvas.width = w;
    canvas.height = h;
    lastImageWidth = w;
    lastImageHeight = h;
    ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
    item.command = `🖼️imgload`;
    item.width = w;
    item.height = h;
    item.size = file.size;
    ConvStats.thumbnail = img;

    // get the converted image as an ArrayBuffer
    /*
    abuffer = await new Promise<ArrayBuffer>(resolve => {
      const callback = (blob: Blob) => {
        lastImageBlob = blob;
        resolve( blob?.arrayBuffer() );
      };
      canvas.toBlob(callback, type, quality);
    });
    */
    const blob = await new Promise<Blob>(resolve => {
      const callback = (blob: Blob) => {
        lastImageBlob = blob;
        resolve( blob );
      };
      canvas.toBlob(callback, type, quality);
    });
    
    if( canceled.value )
      break;

    // toBlob failure
    //if( !abuffer ) {
    if( !blob ) {
      console.log('failed to toBlob', fileName);
      ConvStats.failure++;
      continue;
    }

    outputSize = blob.size;//abuffer.byteLength;
    ConvStats.converted++;
    item.outputSize = outputSize;

    // output
    const baseOutputName =
      basename.replace(props.retainExtension? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '');
    
    if( fsysDirHandle ) {
      // use File Sytem API
      fname = baseOutputName + '.' + ext;
      
      try {
        const writeSucceeded = await buildDirsAndWriteFile(
          fsysDirHandle,
          fname,
          blob,
          async (handle, name, parent) => {
            const type = handle instanceof FileSystemFileHandle ? 'file' : 'folder';
            const targetPath = parent + name;
            console.log([type, name, parent, fname]);
            const command = await enqueueConfirmation(targetPath, type, "fname");
            switch(command) {
              case 'overwrite-all':
              case 'overwrite':
                return true;
              case 'skip-all':
              case 'close':
              case 'cancel':
              case 'skip':
                return false;
              
              default:
                throw new Error(`unexpected OverwriteCommand ${"command"}`);
            }
          }
        );

        if( !writeSucceeded ) {
          item.command = `⚠skipped`;
          ConvStats.done++;
          continue;          
        }
      } catch(e) {
        item.command = `❗failed`;
        ConvStats.done++;
        continue;
      }
    }
    else {
      // emit a zip when the current total size exceeds maxZipSize
      let zipUrl = '';
      if( /*restItemCount > 5 &&*/ currentOutputSizeSum + outputSize >= maxZipSizeMB ) {
        try {
          await azip.wait();
          zipUrl = await azip.url();
        } catch(e: any) {
          memoryProblemOccurred = true;
          console.warn(e.message, currentOutputSizeSum);
          alert("memory problem occurred");
          break;
        }
        ConvStats.zips.push({url: zipUrl, size:currentOutputSizeSum, count:zippedCount});
        ConvStats.zippedTotalCount += zippedCount;
        ConvStats.zippedTotalSize += currentOutputSizeSum;
        
        currentOutputSizeSum = 0;
        zippedCount = 0;
        zipIndex.split();
        //azip.clear();
        azip = new AnZip();
        aziplist.push(azip);
      }

      currentOutputSizeSum += outputSize;
      
      // add a number to the filname if the name already exists in the zip file
      for( let dupCounter = 1; dupCounter < 0xFF; dupCounter++ ) {
        fname = baseOutputName + (dupCounter > 1 ? `(${dupCounter})` : '') + '.' + ext;
        if( azip.has(fname) ) {
          continue;
        }
        break;
      }


      ConvStats.done++;
      try {
        zippedCount++;
        //azip.add(fname, abuffer);
        azip.add(fname, blob);
      }
      catch(e: any) {
        console.error(e.message);
        //failure++;
        //emit('failure', {name: fileName});
        continue;
      }

      zipIndex.increase();
      fileListByZippedIndex.push(file);
      
      ConvStats.ziplogs.push({
        fileId: file._id,
        storedPath: fname,
      });
    }

    ConvStats.inputTotalSize += inputSize;
    ConvStats.outputTotalSize += outputSize;

    lastImageName = fname;
    item.zippedIndex = ConvStats.success;
    ConvStats.success++;
    item.command = `✅completed`;
    item.completed = true;
    item.fileId = file._id;

    completedFileIdSet.add(file._id);
    completedFileDat.push({id: file._id, path: fname, originalIndex: index - 1});
  }
  

  // convert last image buffer to DataURI
  if( ConvStats.success > 0 ) {
    if( fileCount === 1 ) {
      if( lastImageBlob ) {
        ConvStats.convertedImageIndex = 0;
        ConvStats.convertedImageName = lastImageName.replace(/^.*\/(?=[^/]+$)/, '').replace(props.retainExtension ? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '') + '.' + ext;
        ConvStats.convertedImageUrl = URL.createObjectURL(lastImageBlob);
        
        ConvStats.convertedImageOrgUrl = lastImageOrgUrl;
        ConvStats.convertedImageOrgSize = lastImageOrgSize;
      }
    }
    else {
      // emit as ZIP
      try {
        if( memoryProblemOccurred )
          throw new Error(`terminated zipping process for memory problems`);
        await azip.wait();
        const zipUrl = await azip.url();
        ConvStats.zips.push({url: zipUrl, count: zippedCount, size:currentOutputSizeSum});
        ConvStats.zippedTotalCount += zippedCount;
        ConvStats.zippedTotalSize += currentOutputSizeSum;
      } catch(e: any) {
        console.error(e.message);
      }
    }
  }

  const Terminated = {value:false};
  const callbackToClearConverter = () => {
    Terminated.value = true;
    aziplist.forEach(azip => azip.clear());
    aziplist.length = 0;
    fileListByZippedIndex.length = 0;
    demandImageModuleScope = null;
  };
  let doneCalled = false;
  const callbackToGenerateFailedZips = async (list: FileWithId[]) => {
    if( doneCalled )
      return;
    doneCalled = true;
    pushErrorZips(list, maxZipSizeMB, ConvStats, Terminated);
  };
  
  return {
    callbackToClearConverter,
    callbackToGenerateFailedZips,
  };
}

export function demandImage(index: number) {
  demandImageModuleScope?.(index);
}

async function pushErrorZips(list: File[], maxZipSizeMB: number, ConvStats: Stat, Terminated) {
  let count = 0;
  let size = 0;
  let azip = new AnZip;
  for( let i = 0; i < list.length; i++ ) {
    const file = list[i];
    const path = (file.webkitRelativePath || file.name).replace(/^\//, '');
    /*
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    }
    catch(e) {
      console.warn(path);
      ConvStats.failedToCreateFailedZip = true;
      return;
    }
    */

    if( Terminated.value )
      return;
    //azip.add(path, buffer);
    try {
      await azip.add(path, file);
    } catch(e) {
      alert(`an error occurred during access to "${path}"`);
      break;
    }
    size += file.size;
    count++;
    ConvStats.failedFileZippedCount++;

    if( size >= maxZipSizeMB || i === list.length - 1 ) {
      await azip.zip();
      const url = await azip.url();
      ConvStats.failedZips.push({url, size, count});    
      azip.clear();
      size = 0;
      count = 0;
    }
  }

  ConvStats.failedZipDone = true;
}


export function getAsPromise(onloadableElement: any) {
  if( typeof onloadableElement.onload === 'undefined' )
    throw new Error(`it doesn't have "onload" property.`);

  return new Promise((res, rej) => {
    onloadableElement.onload = res;
    onloadableElement.onerror = rej;
  });
}
