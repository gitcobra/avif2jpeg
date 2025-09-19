import { start } from "repl";
import { ComputedRef } from "vue";

export function getUnitSize(bytes: number, precise=2) {
  const sign = Math.sign(bytes);
  bytes = Math.abs(bytes);

  const units = [
    'Bytes',
    'KB',
    'MB',
    'GB',
  ];
  const index = bytes ? Math.floor(Math.log(bytes) / Math.log( 1024 )) : 0;
  const val = (bytes / Math.pow(1024, index) * sign).toFixed(precise);
  
  return `${val}${units[index]}`;
}

export function getThumbnailedSize(
  image: {width:number, height:number},
  maxSize: number | {width:number, height:number} =100,
  disallowExpanding=false
) {
  maxSize = typeof maxSize === 'number' ? ({width:maxSize, height:maxSize}) : maxSize;
  const {width: mwidth, height: mheight} = maxSize;

  let { width, height } = image;
  const ratio = width / height;
  const mratio = mwidth / mheight;

  if( ratio >= mratio ) {
    width = disallowExpanding ? Math.min(mwidth, width) : mwidth;
    height = width / ratio |0;
  }
  else {
    height = disallowExpanding ? Math.min(mheight, height) : mheight;
    width = height * ratio |0;
  }
  return {width, height};
}

// get a index of the split zips and the overall index of the stored files
export class SplitZipsIndexer {
  private _currentFileCount = 0;
  private _currentZipIndex = 0;
  private _totalFileCount = 0;
  private _zipLengthSumList: number[] = [];
  private _pathBank: {
    // path: [zip index, file index]
    [path: string]: [number, number];
  } = {};
  constructor() {
  }
  increase(path?: string) {
    if( path )
      this._pathBank[path] = [this._zipLengthSumList.length, this._currentFileCount];
    
    this._currentFileCount++;
    return this._totalFileCount++;
  }
  split() {
    this._zipLengthSumList.push(this._totalFileCount);
    this._currentZipIndex++;
    this._currentFileCount = 0;
  }
  get(index: number | string): [zipIndex: number, fileIndex: number] {
    if( typeof index === 'number' ) {
      let zipIndex = this._zipLengthSumList.findIndex((val, i) => index < val);
      if( zipIndex === -1 )
        zipIndex = this._zipLengthSumList.length;
      
      const prevZipLengthSum = (this._zipLengthSumList[zipIndex - 1] || 0);
      const fileIndex = index - prevZipLengthSum;
      return [zipIndex, fileIndex];
    }
    else {
      const dat = this._pathBank[String(index)];
      if( dat )
        return dat;
    }
    
    return null;
  }
  getZipIndex() {
    return this._currentZipIndex;
  }
  getIndex() {
    return this._totalFileCount;
  }
}

export function sleep(msec: number) {
  return new Promise(res => setTimeout(res, msec));
}

export function invertRef(r: Ref, msec: number = 0, startVal?: any, invertedVal?: any) {
  if( typeof startVal !== 'undefined' )
    r.value = startVal;
  else
    startVal = r.value;
  
  const tid = setTimeout(() => {
    r.value = typeof invertedVal !== 'undefined' ? invertedVal : !startVal;
  }, msec);
  return () => clearTimeout(tid);
}




// This is for the naive-ui components that is triggered by the "show" property, 
// such as n-tooltip, n-popover or any related components when you want to manually display it once
// with :show="true" but do not want to keep it visible permanently.
// It receives a value, waits for the screen to update, and then resets the value to "undefined",
// so that the element's hiding follows settings like "duration".
export function useTimeoutRef<T>(val?: T, ms: number = 0) {
  const tflag = ref(val);
  watch(tflag, (val) => {
    if( val === undefined )
      return;
    
    nextTick(() => {
      setTimeout(() => tflag.value = undefined, ms);
    });
  }, {immediate:true});

  return tflag;
}
export function timeoutRefByAnotherRef<T>(
  targetRef: Ref | ComputedRef, ms: number = 0, invertFlag = false
) {
  const flag = ref<T>(invertFlag ? !targetRef.value : targetRef.value);
  watch(targetRef, (val) => {
    if( val === undefined )
      return;
    
    flag.value = invertFlag ? !val : val;
    nextTick(() => {
      setTimeout(() => flag.value = undefined, ms);
    });
  }, {immediate:true});

  return flag;
}



// path utilities
export function addSelfAndAncestorPathToSet(list: Set<string>, path: string) {
  const dirs = path.replace(/^\s*\/?|\/?\s*$/g, '').split('/');
  do {
    const path = dirs.join('/');
    if( list.has(path) )
      return;
    
    list.add(path);
    dirs.pop();
  } while( dirs.length )
}

export function isAnyAncestorPathInSet(list: Set<string>, path: string) {
  const dirs = path.replace(/^\/?|\/?$/g, '').split('/');
  let curPath = '';
  while( dirs.length ) {
    curPath += dirs.shift();
    if( list.has(curPath) )
      return true;
    
    curPath += '/';
  }

  return false;
}

export function setFileNameAndExtension(path: string, outputExt: string, keepPrevExt: boolean) {
  // remove existing extension
  if( !keepPrevExt )
    path = path.replace(/\.(jpe?g|jfif|pjpeg|pjp|gif|png|avif|webp|bmp|apng|ico)$/i, '');
  
  let outputPath = path + '.' + outputExt;

  return outputPath;
}