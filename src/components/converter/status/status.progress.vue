<script setup lang="ts">
import { getThumbnailedSize } from '@/components/util';


const props = defineProps<{
  processing: boolean;
  
  successPerc: number;
  elapsedTime: string;
  
  threads: number;
  fileType: string;
  shrink?: [number, number] | null;
  zipSize: number;
  outputToDir: boolean;

  inputTotalSize: number;
  outputTotalSize: number;

  rateColor: string;
  difColor: string;
  totalSizeDifStr: string;

  thumbnail: ImageBitmap | HTMLImageElement | null;
  opened: boolean;
}>();

const thumbcanvas = ref<HTMLCanvasElement>(null);
const THUMB_SIZE = {W:110, H:80};


// update processing image
let prevThumbBitmap;
watch(() => [props.thumbnail, props.opened], () => {
  if( !props.thumbnail || !props.opened || props.thumbnail === prevThumbBitmap || !thumbcanvas.value )
    return;
  const {width, height} = getThumbnailedSize(props.thumbnail, {width:THUMB_SIZE.W, height:THUMB_SIZE.H});
  thumbcanvas.value.width = width;
  thumbcanvas.value.height = height;
  thumbcanvas.value.style.width = width + 'px';
  thumbcanvas.value.style.height = height + 'px';
  
  if( props.thumbnail instanceof HTMLImageElement ) {
    const ctxThumb = thumbcanvas.value.getContext('2d');
    ctxThumb.drawImage(props.thumbnail, 0, 0, width, height);
  }
  else {
    const ctxThumb = thumbcanvas.value.getContext('bitmaprenderer');
    ctxThumb.transferFromImageBitmap(props.thumbnail);
    prevThumbBitmap = props.thumbnail;
    props.thumbnail.close();
  }
});


</script>

<template>
  <n-collapse-item name="progress" style="white-space:nowrap;">
    <template #header="{collapsed}">
      <n-flex align="center">
        {{ $t('status.Progress') }}
        <template v-if="collapsed">
          ({{ successPerc |0 }}%)
        </template>

        <!-- <n-spin :size="16" v-if="processing && !props.opened"> </n-spin> -->
      </n-flex>
    </template>
    <n-flex justify="center" align="center" :size="0" :wrap="false" style="white-space: nowrap; margin-top:-1em; padding-bottom:5px;">
      
      <div class="grow"></div>


      <n-flex justify="center" class="grow" :wrap="false" style="z-index:1;">
        
        <!-- left column -->
        <n-flex vertical justify="center" class="left-column">
    
          <n-statistic tabular-nums :label="$t('status.elapsedTime')">
            <n-flex>
              {{ elapsedTime }}
            </n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.multiThreading')">
            <n-flex :style="{color: !threads ? 'red' : '', fontSize: '0.7rem'}">
              {{ threads ? $rt('{n} @:threads', threads) : $t('disabled') }}
            </n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.outputSettings')">
            <n-flex vertical justify="end" style="font-size: 0.6rem; line-height:0.6rem;">
              <div>{{$t('settings.imageType')}}: {{ fileType }}</div>
              <div v-if="shrink">{{$t('status.Shrinking')}}: <span style="">{{shrink[0]}}×{{shrink[1]}}</span></div>
              <div v-if="!outputToDir">Zip: {{ zipSize }}MB</div>
              <div v-else style="color:red">{{ $t('status.outputToDir') }}</div>
            </n-flex>
          </n-statistic>

        </n-flex>

        <!-- center column -->
        <slot name="center"/>

        <!-- right column -->
        <n-flex vertical style="height:100%;" justify="center" class="right-column">
          <n-statistic tabular-nums :label="$t('status.inputSize')">
            <n-flex justify="end" :wrap="false" style="font-family:v-mono;">{{(inputTotalSize / 1024 | 0).toLocaleString('en-us')}} KB</n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.outputSize')">
            <n-flex justify="end" :wrap="false" style="font-family:v-mono;">{{(outputTotalSize / 1024 | 0).toLocaleString('en-us')}} KB</n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.outInRate')">
            <n-flex vertical align="end" justify="start" style="font-size: 0.8em; font-family:v-mono; line-height:50%;">
              <span :style="{color:rateColor, fontSize:'larger'}">× {{ (outputTotalSize / inputTotalSize || 1).toFixed(2) }}</span>
              <span :style="{color:difColor}">({{ totalSizeDifStr }})</span>
              
            </n-flex>
          </n-statistic>
        </n-flex>
      </n-flex>

      <!-- thumbnail -->
      <n-flex class="thumb-container" align="center" style="position:relative;">
        <!-- processing image -->
        <n-flex justify="center" align="center" class="grow thumbnail" :style="{width:THUMB_SIZE.W+'px', height:THUMB_SIZE.H+'px'}">
        <!--<n-spin size="small" :show="processing">-->
          <!-- <n-empty v-if="props.thumbnail===undefined || !processing" description="EMPTY" /> -->
          <transition name="fade" mode="out-in">
            <canvas v-if="processing" ref="thumbcanvas" width="106" height="80" class="thumb-canvas"/>
            <div v-else style="width:106px; height:80px; opacity:0.15; border: 1px solid gray;"/>
          </transition>
        <!--</n-spin>-->
        </n-flex>
      </n-flex>     

    </n-flex>
  </n-collapse-item>
</template>

<style scoped lang="scss">
.grow {
  flex-grow: 1;
}
.thumb-container {
  flex-grow: 1;
}
.thumbnail {
  position: absolute;
  right: 20%;
  z-index: 0;
}
.thumb-canvas {
  border: 1px solid gray;
  /*filter: opacity(0.35);*/
}

.right-column {
  width: 8em;
}

.left-column {
  height:100%;
}
.center-column {
  width: 10rem;
  font-size: 1rem;
}
@media screen and (max-width: 800px) {
  .thumbnail {
    position: absolute;
    filter: opacity(0.35);
  }
  .thumb-container {
    flex-grow: 1;
  }
}
@media screen and (max-width: 580px) {
	.left-column {
    > * {
      display: none;
    }
  }
  .center-column {
  }
  .hide-mobile {
    display: none;
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

</style>