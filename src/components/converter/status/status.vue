<script setup lang="ts">
import { ComponentInstance, ComponentInternalInstance, Directive, type CSSProperties } from 'vue';
import { dataTableDark, type DropdownOption, NIcon, NScrollbar, NSpin, useThemeVars } from 'naive-ui';
import { ImageSharp, Archive, Warning, WarningOutline, DocumentTextOutline, DownloadOutline, Filter } from '@vicons/ionicons5';
import { useI18n } from 'vue-i18n';
import ImageViewer from './image-viewer.vue';
import Progress from './status.progress.vue';
import CenterColumn from './status.progress-center.vue';
import LogTable from './status.log.vue';
import ConversionResult from './status.result.vue';
import { getThumbnailedSize, getUnitSize, sleep, useTimeoutRef } from '../../util';

import type { CollapseProps } from 'naive-ui';
import { log } from 'console';
type CollapseThemeOverrides = NonNullable<CollapseProps['themeOverrides']>;
const collapseThemeOverrides: CollapseThemeOverrides = {
  itemMargin: '1px',
  titlePadding: '2px',
  titleFontSize: '0.8rem',
};


// common components
const { t } = useI18n();
const c = useThemeVars();



// constants
//const LOG_SIZE_LIMIT = 999999;
//const LOG_EXPANDED_MINHEIGHT = 250;


// props
// FIXME: too messy
const props = defineProps<{
  processing: boolean;
  status: {
    processing: boolean;
    length: number;
    
    startedCount: number;
    converted: number;
    success: number;
    failure: number;
    retried: number;
    done: number;
    zippedTotalCount: number;
    zippedTotalSize: number;
    zippingErrorCount: number;

    logs: InstanceType<typeof LogTable>['logs'];
    ziplogs: {
      fileId: number;
      storedPath: string;
    }[];
    
    baseZipName: string;
    zips: InstanceType<typeof ConversionResult>['zips'];

    unconvertedListText: string;
    unconvertedFileCount: number;
    unconvertedTotalSize: number;
    failedZips: { url:string, size:number, count:number }[];
    failedZipDone: boolean;
    failedToCreateFailedZip: boolean;
    failedFileZippedCount: number;
    
    inputTotalSize: number;
    outputTotalSize: number;

    thumbnail: ImageBitmap | HTMLImageElement | null;
    startedTime: number;

    convertedImageName?: string;
    convertedImageUrl?: string;
    convertedImageOrgUrl?: string;
    convertedImageDataUrl?: string;
    convertedImageWidth?: number;
    convertedImageHeight?: number;
    convertedImageSize?: number;
    convertedImageOrgSize?: number;
    convertedImageOrgName?: string;
    convertedImageIndex?: number;
    convertedImageShrinked?: boolean;

    type: string;
    threads?: number;
    zipSize: number;
    shrink?: [number, number];

    outputToDir: boolean;
    outputDirName?: string;
  }
  interval?: number
}>();



// emits
const emit = defineEmits<{
  'all-zips-clicked': [];
  'demand-zip-errors': [];
  'demand-image': [index: number];
  'delete-image': [index: number];
}>();

// exposes
defineExpose({
  cleanup,
});


// directives
// when you need "visibility: hidden"
const vHidden: Directive<HTMLElement, boolean> = (el, binding) => {
  const val: boolean = binding.value ?? true;
  el.style.visibility = val ? 'hidden' : 'visible';
};



// reactive value
const zippingFlag = ref(false);
const workingLogs = ref<typeof props["status"]["logs"]>([]);
const demandedFailedZips = ref(false);



const statusProcessing = ref(false);
const successPercentage = ref([0, 0]); // [to, from] for n-number-animation
const startedCount = ref([0, 0]); 
const success = ref([0, 0]);
const failure = ref([0, 0]);
const done = ref([0, 0]);
const converted = ref([0, 0]);
const retried = ref(0);
const length = ref(0);
const zipped = ref([0, 0]);
const failedFilesZippedCount = ref(0);
const statusColor = ref(c.value.infoColor);
const rateColor = ref('#000000');
const difColor = ref('#000000');

const inputTotalSize = ref(0);
const outputTotalSize = ref(0);
const totalSizeDifStr = ref('');
const elapsedTime = ref('00:00:00');



const processingBitmap = ref<ImageBitmap | HTMLImageElement | null>(null);


const expandedNames = ref<string[]>(['progress', 'log', 'output']);
const isCollapsed = (name: string) => expandedNames.value.includes(name);
const setCollapsed = (name: string) => expandedNames.value.push(name);
const removeCollapsed = (name: string) => {
  const index = expandedNames.value.findIndex(v => v === name);
  if( index >= 0 )
    expandedNames.value.splice( index, 1)
};
// for collapse
const logOpened = computed(() => expandedNames.value.includes('log'));
const progressOpened = computed(() => expandedNames.value.includes('progress'));
// for log-table property
const logExpanded = ref(false);
const logAutoScroll = ref(true);
const logTableOrder = ref<InstanceType<typeof LogTable>['order']>('processed');

//const imageViewerStarted = ref(false);

const outputImg = reactive({
  name: '',
  originalName: '',
  size: 0,
  url: '',
  originalUrl: '',
  originalSize: 0,
  dataUrl: '',
  index: 0,
  various: {
    shrinked: false,
  }
});





// element references
const body = useTemplateRef('body');
const imageViewer = useTemplateRef('imageViewer');


// common variables
let _tmpCounter = 0;










// onmounted

onMounted(() => {
  // hook update status
  //watch(() => [props.status.index, props.status.done], () => update());
  //watch(() => props.status.done, () => update());
  watch(props.status, () => update(), {deep: false});
  //setInterval(update, UPDATE_INTERVAL_MSEC);

  
  // update elapsed timer
  let _intvId = 0;
  const startTimer = () => {
    if( _intvId )
      return;
    
    const startedTime = Date.now();
    elapsedTime.value = '00:00:00';
    _intvId = window.setInterval(() => {
      const etime = (Date.now() - startedTime) / 1000;
      elapsedTime.value = `${String(etime / 3600 |0).padStart(2, '0')}:${String(etime / 60 % 60 |0).padStart(2, '0')}:${String(etime % 60 |0).padStart(2, '0')}`;
    }, 300);
  };
  
  startTimer();
  statusProcessing.value = true;

  watch(() => props.processing, (newv, oldv) => {
    // on finished
    if( !newv ) {
      onFinished();
    }

    // at the start, some reactive values need to clean up if this component is applied v-show instead of v-if
    if( newv ) {
      startTimer();
      //workingLogs.value = [];
      workingLogs.value.length = 0;
      zippingFlag.value = false;
      demandedFailedZips.value = false;
      //zipList.value = [];
      //failedZipList.value = [];
    }
    else {
      clearInterval(_intvId);
      _intvId = 0;
    }
  });

  

  let _unmounted = false;
  
  


  
  onBeforeUnmount(() => {
    _unmounted = true;
    clearInterval(_intvId);
    //clearTimeout(_tid);
    clearTimeout(hookedUpdateTimeoutId);
    //window.removeEventListener('resize', changeLogMaxHeight);
    //observer.disconnect();
  });
  onUnmounted(() => clearInterval(_intvId));
});







onBeforeUnmount(() => {
  cleanup();
});
onUnmounted(() => {
  clearTimeout(hookedUpdateTimeoutId);
});
















// update status
const UPDATE_INTERVAL_MSEC = props.interval || 100;
let updateWaitingFlag = false;
let hookedUpdateTimeoutId = 0;

function update() {
  if( updateWaitingFlag )
    return;
  else if( hookedUpdateTimeoutId ) {
    updateWaitingFlag = true;
    return;
  }
  hookedUpdateTimeoutId = window.setTimeout(() => {
    hookedUpdateTimeoutId = 0;
    if( updateWaitingFlag ) {
      updateWaitingFlag = false;
      update();
    }
  }, UPDATE_INTERVAL_MSEC);

  const stat = props.status;
  zippingFlag.value = stat.length >= 2 /*|| props.status.threads >= 2*/;
  startedCount.value[1] = startedCount.value[0];
  startedCount.value[0] = stat.startedCount;
  success.value[1] = success.value[0];
  success.value[0] = stat.success;
  failure.value[1] = failure.value[0];
  failure.value[0] = stat.failure;
  done.value[1] = done.value[0];
  done.value[0] = stat.done;
  converted.value[1] = converted.value[0];
  converted.value[0] = stat.converted;
  retried.value = stat.retried;
  length.value = stat.length;
  zipped.value[1] = zipped.value[0];
  zipped.value[0] = stat.zippedTotalCount;
  inputTotalSize.value = stat.inputTotalSize;
  outputTotalSize.value = stat.outputTotalSize;

  failedFilesZippedCount.value = stat.failedFileZippedCount;
  
  
  // conversion size rate
  const dif = (outputTotalSize.value - inputTotalSize.value);
  totalSizeDifStr.value = (dif >= 0 ? '+ ' : '') + getUnitSize(dif);
  // warn color for rate
  const rate = outputTotalSize.value / inputTotalSize.value;
  const rcol = (0x100 | Math.min(255, Math.max(0, rate - 1.5) * 255 |0)).toString(16).substring(1);
  rateColor.value = '#' + rcol + '0000';
  // warn color for size
  const maxDif = 1024 * 1024; // 1GB
  const col = (0x100 | Math.min(255, Math.max(0, dif / 1024 / maxDif) * 255 |0)).toString(16).substring(1);
  difColor.value = '#' + col + '0000';
  

  // percentage
  successPercentage.value[1] = successPercentage.value[0];
  successPercentage.value[0] = success.value[0] / length.value * 100;


  // update log
  if( logOpened.value || !props.processing ) {
    workingLogs.value = workingLogs.value.concat(stat.logs);
    stat.logs.length = 0; // clear the log;
  }


  // thumbnail
  processingBitmap.value = stat.thumbnail;


  // current status color
  if( props.processing ) {
    statusColor.value = failure.value[0] ? c.value.errorColor : retried.value ? c.value.warningColor : c.value.infoColor;
  }
  else {
    statusProcessing.value = false;
  }

  // update output image
  if( stat.convertedImageUrl !== outputImg.url ) {
    outputImg.url = stat.convertedImageUrl;
    outputImg.name = stat.convertedImageName;
    outputImg.dataUrl = stat.convertedImageDataUrl;
    outputImg.size = stat.convertedImageSize || stat.outputTotalSize;
    outputImg.originalSize = stat.convertedImageOrgSize;
    outputImg.originalName = stat.convertedImageOrgName;
    //outputImg.width = stat.convertedImageWidth;
    //outputImg.height = stat.convertedImageHeight;
    outputImg.index = stat.convertedImageIndex;
    outputImg.originalUrl = stat.convertedImageOrgUrl;
    outputImg.various = {
      shrinked: stat.convertedImageShrinked,
    };
    //const {width ,height} = getThumbnailedSize(outputImg, {width:320, height:100});
    //outputImg.twidth = width;
    //outputImg.theight = height;
  }
}


function onFinished() {
  const stat = props.status;

  statusColor.value = props.status.success === props.status.length ? c.value.successColor : c.value.errorColor;

  if( logTableOrder.value === 'processed' )
    logTableOrder.value = 'zipped';
  
  if( stat.success > 0 ) {
    // close log unless it is expanded
    //if( !logExpanded.value ) {
    if( logAutoScroll.value ) {
      removeCollapsed('log');
      //if( workingLogs.value.length >= 5 ) {
        logExpanded.value = true;
      //}
    }
    // show preview
    setCollapsed('preview');
  }
}










// functions for the components' event handlers

async function changeImgViewerIndexBySelectedLogItem(completed: boolean, path:string, fileId: number, zippedIndex: number) {
  if( !completed )
    return;

  const index = zippedIndex;

  //console.log(completed, path, fileId, zippedIndex, "completed, path, fileId, zippedIndex");
  //console.log(index, props.status.ziplogs[index]);

  if( !isCollapsed('preview') ) {
    setCollapsed('preview');
    //imageViewerStarted.value = true;
    await nextTick();
  }
  imageViewer.value?.changeIndex(index + 1);

  await nextTick(() => {
    try {
      imageViewer.value?.$el.scrollIntoView({behavior: 'instant', block: 'nearest'});
    } catch(e){}
  });
}






const cleaningUp = ref(false);
function cleanup() {
  cleaningUp.value = true;
  //imageViewer.value?.cleanup();

  // cleanup
  URL.revokeObjectURL(outputImg.url);
  URL.revokeObjectURL(outputImg.originalName);

  outputImg.originalUrl = '';
  outputImg.url = '';
  outputImg.index = 0;
  
  props.status.logs.length = 0;
  workingLogs.value.length = 0;
  //failedZipList.value.length = 0;
  //zipList.value.length = 0;
  //body.value.$el.innerHTML = '';

  //getCurrentInstance()?.update();

  //imageViewerStarted.value = false;
}





</script>




<template>
<n-flex ref="body" vertical justify="center">
  
  <n-collapse
    display-directive="show"
    :trigger-areas="['arrow', 'main']"
    v-model:expanded-names="expandedNames"
    :theme-overrides="collapseThemeOverrides"
  >

    <Progress
      :processing="statusProcessing"

      :elapsed-time="elapsedTime"
      :success-perc="successPercentage[0]"
      :input-total-size="inputTotalSize"
      :output-total-size="outputTotalSize"
      
      :file-type="props.status.type"
      :shrink="props.status.shrink"
      :threads="props.status.threads"
      :zip-size="props.status.zipSize"
      :output-to-dir="props.status.outputToDir"

      :rate-color="rateColor"
      :dif-color="difColor"
      :total-size-dif-str="totalSizeDifStr"

      :thumbnail="processingBitmap"
      :opened="progressOpened"
    >
      <template #center>
        <!-- center column - progress circle -->
        <center-column
          v-if="!cleaningUp"
          :index="startedCount[0]"
          :success="success[0]"
          :length="status.length"
          :success-to="success[0]"
          :success-from="success[1]"
          :failure="failure[0]"
          :success-perc-to="successPercentage[0]"
          :success-perc-from="successPercentage[1]"
          :retried="retried"
          
          :processing="statusProcessing"
          :interval="UPDATE_INTERVAL_MSEC"
          :status-color="statusColor"

          class="center-column"
        />
      </template>
    </Progress>

    <!-- log view *aliased to n-collapse-item-->
    <log-table
      :processing="statusProcessing"
      :image-index="outputImg.index"
      :opened="logOpened"
      :preview-collapsed="isCollapsed('preview')"
      :logs="workingLogs"
      v-model:expanded="logExpanded"
      v-model:auto-scroll="logAutoScroll"
      :order="logTableOrder"
      @change-index="changeImgViewerIndexBySelectedLogItem"
      @open-preview="imageViewer?.openPreview()"
      
      name="log" style="white-space:nowrap;"
    />
    
    <n-collapse-item :title="$t('status.PreviewImage')" name="preview" style="white-space:nowrap;" :disabled="!(success[0] > 0)">
      <!-- image browser -->
      <n-flex justify="center" align="center" vertical style="margin-top:-1em">
        <ImageViewer
          _v-else-if="imageViewerStarted && status.success > 0 /*&& (props.status.threads || !zippingFlag)*/ && !cleaningUp"
          ref="imageViewer"
          
          :url="outputImg.url"
          :size="outputImg.size"
          :original-url="outputImg.originalUrl"
          :original-size="outputImg.originalSize"   
          :name="outputImg.name"
          :originalName="outputImg.originalName"
          :length="success[0]"
          :index="outputImg.index"
          :various-info="outputImg.various"
          
          :is-single="!zippingFlag"
          @demand-image="index => emit('demand-image', index)"
          @_delete-image="index => emit('delete-image', index)"
          _close="imageViewerStarted=false"
        />
        <!--</transition>-->
      </n-flex>
    </n-collapse-item>
      
    <conversion-result
      :processing="statusProcessing"
      :list-length="length"
      :zippingFlag="zippingFlag"

      :zips="props.status.zips"
      :img-url="outputImg.url"
      :img-name="outputImg.name"
      :success="success[0]"
      :failure="failure[0]"
      :done="done[0]"
      :converted="converted[0]"
      :retried="retried"
      :zipped-total-count="zipped[0]"
      :zipped-total-size="props.status.zippedTotalSize"

      :base-zip-name="props.status.baseZipName"
      :failed-file-zipped-count="failedFilesZippedCount"
      :failed-to-create-failed-zip="props.status.failedToCreateFailedZip"
      :failed-zip-done="props.status.failedZipDone"
      :failed-zips="props.status.failedZips"

      :unconverted-file-count="props.status.unconvertedFileCount"
      :unconverted-list-text="props.status.unconvertedListText"
      :unconverted-total-size="props.status.unconvertedTotalSize"
      :output-to-dir="status.outputToDir"
      :output-dir-name="status.outputDirName"

      :type="props.status.type"

      @all-zips-clicked="emit('all-zips-clicked')"
      @demand-zip-errors="emit('demand-zip-errors')"
    />


  </n-collapse>

</n-flex>
</template>

<style lang="css" scoped>
.body {
  font-size: 1em;
}
</style>


