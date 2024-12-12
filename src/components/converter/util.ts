
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

export function getThumbnailedSize(image: {width:number, height:number}, maxSize: number | {width:number, height:number} =100, disallowExpanding=false) {
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

// get a split zips index and a file index from an entire index
export class SplitZipsIndexer {
  private _currentFileCount = 0;
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
    this._totalFileCount++;
  }
  split() {
    this._zipLengthSumList.push(this._totalFileCount);
    this._currentFileCount = 0;
  }
  get(index: number | string) {
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
}
