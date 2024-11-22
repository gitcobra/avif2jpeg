
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

