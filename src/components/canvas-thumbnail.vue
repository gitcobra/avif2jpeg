<script setup lang="ts">
import { getThumbnailedSize, sleep } from './util';


const props = defineProps<{
  source: ImageBitmapSource;
  width: number;
  height: number;
  fit?: "contain" | "fill";
}>();

// emits
const emit = defineEmits<{
}>();

// methods
defineExpose({
});

// slots
const slots = defineSlots<{
}>();


// variables
const USE_ImageBitmap = (typeof window.createImageBitmap === 'function');
const loadError = ref(false);
const canvas = ref<HTMLCanvasElement>();
const cwidth = ref(100);
const cheight = ref(100);
let ctxbm: ImageBitmapRenderingContext;
let ctx2d: CanvasRenderingContext2D;




onMounted(() => {
  if( USE_ImageBitmap )
    ctxbm = canvas.value.getContext('bitmaprenderer');
  else
    ctx2d = canvas.value.getContext('2d');
  
  watch(() => props.source, (val) => {
    loadError.value = false;
    USE_ImageBitmap ? drawViaImageBitmap(val) : drawVia2Dcontext(val);
  }, {immediate: true});
});



// functions

async function drawViaImageBitmap(data: ImageBitmapSource) {
  try {
    // get image dimensions for aspect ratio
    let width, height;
    let preLoadedBitmap: ImageBitmap;
    if( data instanceof Blob ) {
      preLoadedBitmap = await createImageBitmap(
        data, {resizeWidth: Math.max(200, props.width), resizeQuality:'pixelated'}
      );
      ({width, height} = preLoadedBitmap);
      data = preLoadedBitmap;
    }
    else
      if( data instanceof VideoFrame ) {
      width = data.displayWidth;
      height = data.displayHeight;
    }
    else
      ({width, height} = data);

    const {tw, th, cropx: sx, cropy: sy, cropw: sw, croph: sh} = calcCoverSize(
      width, height, props.width, props.height
    );

    const bitmap = await createImageBitmap(data, 
      sx, sy, sw, sh,
      {
        resizeWidth: tw, resizeHeight: th,
        resizeQuality: 'pixelated',
      }
    );
    cwidth.value = tw;
    cheight.value = th;
    canvas.value.style.width = tw + 'px';
    canvas.value.style.height = th + 'px';
    
    ctxbm.transferFromImageBitmap(bitmap);
    
    if( preLoadedBitmap )
      preLoadedBitmap.close();
  } catch(e) {
    console.error(e);
    loadError.value = true;
  }
}

async function drawVia2Dcontext(data: ImageBitmapSource) {
  if( data instanceof Blob ) {
    const url = URL.createObjectURL(data);
    const img = new Image;
    
    await new Promise(resolve => {
      img.onload = img.onerror = resolve;
      img.src = url;
      setTimeout(resolve, 10000);
    });

    if( !img.complete ) {
      loadError.value = true;
      return;
    }

    data = img;
    URL.revokeObjectURL(url);
  }
  // currently ignore these data types 
  else if( data instanceof ImageData || data instanceof VideoFrame || data instanceof SVGElement) {
    return;
  }
  
  const {width, height} = data;
  const {tw, th, sx, sy, sw, sh} = calcCoverSize(width, height, props.width, props.height);

  canvas.value.width = tw;
  canvas.value.height = th;
  canvas.value.style.width = tw + 'px';
  canvas.value.style.height = th + 'px';
  console.log(calcCoverSize(width, height, props.width, props.height))
  ctx2d.drawImage(data, sx, sy, sw, sh);
}

function calcCoverSize(w:number, h:number, tw:number, th:number) {
  const whRatio = w / h;
  const twhRatio = tw / th;
  let width, height;
  let cropx = 0, cropy = 0;
  let cropw = w, croph = h;
  let sx = 0, sy = 0;
  let sw = 0, sh = 0;
  if( whRatio > twhRatio ) {
    height = th;
    width = height * whRatio;
    cropx = ((width - tw) / 2) * ( w / width );
    cropw = tw * ( w / width );
    sh = th;
    sw = th * whRatio;
    sx = - (sw - tw) / 2
  }
  else {
    width = tw;
    height = width / whRatio;
    cropy = ((height - th) / 2) * ( h / height );
    croph = th * (h / height);
    sw = tw;
    sh = tw / whRatio;
    sy = - (sh - th) / 2;
  }
  return {tw, th, cropx, cropy, cropw, croph, sx, sy, sw, sh};
}


</script>

<template>
  <canvas v-if="!loadError" ref="canvas" :width="cwidth" :height="cheight"></canvas>
  <div v-else class="error">
    <svg xmlns="http://www.w3.org/2000/svg" :style="{width:Math.min(width, height)+'px'}" :height="Math.min(width, height)" viewBox="0 0 32 32">
      <path fill="currentColor" d="M2 16A14 14 0 1 0 16 2A14 14 0 0 0 2 16m23.15 7.75L8.25 6.85a12 12 0 0 1 16.9 16.9M8.24 25.16a12 12 0 0 1-1.4-16.89l16.89 16.89a12 12 0 0 1-15.49 0"/>
    </svg>
  </div>
</template>

<style scoped lang="scss">
.error {
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  border: '1px solid gray';
  color: red;
  padding: 0px;
  margin: 0px;
}
</style>