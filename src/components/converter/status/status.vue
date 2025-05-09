<script setup lang="ts">
import { ComponentInstance, ComponentInternalInstance, Directive, type CSSProperties } from 'vue';
import { dataTableDark, type DropdownOption, NIcon, NScrollbar, NSpin, useThemeVars } from 'naive-ui';
import { ImageSharp, Archive, Warning, WarningOutline, DocumentTextOutline, DownloadOutline, Filter } from '@vicons/ionicons5';
import { useI18n } from 'vue-i18n';
import ImageViewer from './image-viewer.vue';
import Progress from './status.progress.vue';
import CenterColumn from './status.progress-center.vue';
import LogTable from './status.log.vue';
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
const dialog = useDialog();
const { t } = useI18n();
const c = useThemeVars();



// constants
//const LOG_SIZE_LIMIT = 999999;
//const LOG_EXPANDED_MINHEIGHT = 250;


// props
// FIXME: too messy
const props = defineProps<{
  processing: boolean
  status: {
    processing: boolean
    length: number
    
    startedCount: number
    converted: number
    success: number
    failure: number
    retried: number
    done: number
    zippedTotalCount: number
    zippedTotalSize: number
    zippingErrorCount: number

    logs: InstanceType<typeof LogTable>['logs'];
    ziplogs: {
      fileId: number
      storedPath: string
    }[]
    
    baseZipName: string
    zips: { url:string, size:number, count:number }[] // count: file count

    unconvertedListText: string
    unconvertedFileCount: number
    unconvertedTotalSize: number
    failedZips: { url:string, size:number, count:number }[]
    failedZipDone: boolean
    failedToCreateFailedZip: boolean
    failedFileZippedCount: number
    
    inputTotalSize: number
    outputTotalSize: number

    thumbnail: ImageBitmap | HTMLImageElement | null
    startedTime: number

    convertedImageName?: string
    convertedImageUrl?: string
    convertedImageOrgUrl?: string
    convertedImageDataUrl?: string
    convertedImageWidth?: number
    convertedImageHeight?: number
    convertedImageSize?: number
    convertedImageOrgSize?: number
    convertedImageOrgName?: string
    convertedImageIndex?: number
    convertedImageShrinked?: boolean
    

    type: string
    threads?: number
    zipSize: number
    shrink?: [number, number]
  }
  interval?: number
}>();



// emits
const emit = defineEmits<{
  'all-zips-clicked': []
  'demand-zip-errors': []
  'demand-image': [index: number]
  'delete-image': [index: number]
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

type ZipList = {
  url: string
  size: number
  sizeByUnit: string
  name: string
  number: number
  count: number
  clicked: boolean
}[];
const zipList = ref<ZipList>([]);
const failedZipList = ref<ZipList>([]);

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
const statusColor = ref(c.value.infoColor);
const rateColor = ref('#000000');
const difColor = ref('#000000');

const inputTotalSize = ref(0);
const outputTotalSize = ref(0);
const totalSizeDifStr = ref('');
const elapsedTime = ref('00:00:00');

const autoPopoverErrorButtonFlag = ref(undefined);

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
// for log-table property
const logExpanded = ref(false);
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
      zipList.value = [];
      failedZipList.value = [];
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


watch([() => props.status.zips.length, () => props.status.failedZips.length], () => {
  const stat = props.status;
  
  // update zip list
  {
    if( zipList.value.length > stat.zips.length )
      zipList.value.length = 0;//s.zips.length;
    
    let size = 0;
    const singlar = stat.zips.length === 1 && stat.zippedTotalCount === stat.length;
    for( let i = zipList.value.length; i < stat.zips.length; i++ ) {
      const item = stat.zips[i];
      const name = stat.baseZipName + ( singlar ? '' : '-' + String(i + 1).padStart(2, '0') ) + '.zip';
      size += item.size;
      zipList.value[i] = {
        url: item.url,
        size: item.size,
        number: singlar ? 0 : i + 1,
        sizeByUnit: getUnitSize(item.size),
        name,
        count: item.count,
        clicked: false,
      };
    }
  }

  // failed zip list
  {
    if( failedZipList.value.length > stat.failedZips.length )
      failedZipList.value.length = 0;
    let size = 0;
    const singlar = stat.failedZipDone && stat.failedZips.length === 1;
    for( let i = failedZipList.value.length; i < stat.failedZips.length; i++ ) {
      const item = stat.failedZips[i];
      const name = stat.baseZipName + '-error' + ( singlar ? '' : '-' + String(i + 1).padStart(2, '0') ) + '.zip';
      size += item.size;
      failedZipList.value[i] = {
        url: item.url,
        size: item.size,
        number: singlar ? 0 : i + 1,
        sizeByUnit: getUnitSize(item.size),
        name,
        count: item.count,
        clicked: false,
      };
    }
  }
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
    if( !logExpanded.value ) {
      removeCollapsed('log');
      //logExpanded.value = true;
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

  console.log(completed, path, fileId, zippedIndex, "completed, path, fileId, zippedIndex");
  console.log(index, props.status.ziplogs[index]);

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



// PopSelects for errors 
const PopSelectErrorItems = computed<{key: string, label:any, icon:any, onSelect: Function}[]>(() => [
  {
    key: 'open',
    label: t('status.openFailedList'),
    icon: () => h(NIcon, () => h(DocumentTextOutline)),
    onSelect() {
      createFailedFileLink();
    }
  }, {
    key: 'download',
    label: t('status.saveFailedList'),
    icon: () => h(NIcon, () => h(DownloadOutline)),
    onSelect() {
      createFailedFileLink(true);
    }
  }, {
    key: 'zip',
    label: `${t('status.zipFailedList')}` + (props.status.failedZipDone ? `(✔${t('status.done')})` : ``),
    icon: () =>  h(NSpin, {show: demandedFailedZips.value && !props.status.failedZipDone, size:'small'}, () => h(NIcon, () => h(Archive))),
    disabled: demandedFailedZips.value,
    onSelect(ev) {
      demandedFailedZips.value = true;
      emit('demand-zip-errors');
      return false;
    }
  }
]);



function download(item: typeof zipList.value[number], create = false) {
  const {url, name: fileName} = item;
  if( create ) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }
  
  if( !item.clicked ) {
    item.clicked = true;

    // check if all zips are clicked
    if( !statusProcessing.value ) {
      if( zipList.value.every(val => val.clicked) )
        emit('all-zips-clicked');
    }
  }
}

async function onSaveButtonClick() {
  if( zippingFlag.value ) {
    if( zipList.value.length >= 2 ) {
      const flag = await new Promise((resolve, reject) => dialog.warning({
        title: t('Download'),
        content: t('status.confirmDownloadMessage', [zipList.value.length]),
        positiveText: 'OK',
        negativeText: t('cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => reject(),
      }));

      if( !flag )
        return;
    }

    const zips = zipList.value;
    for( const item of zips ) {
      download(item, true);
    }
  }
  else {
    imageViewer.value.download();
  }
}







function createFailedFileLink(download = false) {
  const blob = new Blob([props.status.unconvertedListText], {type: 'text/plain;charset=utf8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  if( download )
    a.download = props.status.baseZipName + '-error.txt';
  a.click();
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
  failedZipList.value.length = 0;
  zipList.value.length = 0;
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
      :elapsed-time="elapsedTime"
      :success-perc="successPercentage[0]"
      :input-total-size="inputTotalSize"
      :output-total-size="outputTotalSize"
      
      :file-type="props.status.type"
      :shrink="props.status.shrink"
      :threads="props.status.threads"
      :zip-size="props.status.zipSize"

      :rate-color="rateColor"
      :dif-color="difColor"
      :total-size-dif-str="totalSizeDifStr"
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
      :thumbnail="processingBitmap"
      :opened="logOpened"
      :preview-collapsed="isCollapsed('preview')"
      :logs="workingLogs"
      :expanded="logExpanded"
      :order="logTableOrder"
      @change-index="changeImgViewerIndexBySelectedLogItem"
      @open-preview="imageViewer?.openPreview()"
      
      name="log" style="white-space:nowrap;"
    />
    
    <n-collapse-item :title="$t('status.PreviewImage')" name="preview" style="white-space:nowrap;" :disabled="!(success[0] > 0)">
      <!-- image browser -->
      <n-flex justify="center" align="center" vertical>
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
      
    

    <n-collapse-item name="output" style="white-space:nowrap;" disabled>
      <template #header>
        <span style="color:black;" v-html="$t('status.Output')" />
      </template>
      <!-- output files -->
      <n-flex :wrap="false" vertical style="margin-top: -1.3em">
      <n-flex justify="center" v-if="!cleaningUp">
        
        <!-- zip list -->
        <n-flex v-show="zippingFlag" vertical align="center">
          
          <!-- zipping progress -->
          <n-popover placement="left">
            <template #trigger>
              <n-progress
                type="line"
                indicator-placement="inside"
                color="lime"
                rail-color="rgba(99, 255, 99, 0.5)"
                :indicator-text-color="zipped[0] === length ? 'white' : 'green'"
                :processing="statusProcessing"
                :percentage="zipped[0] / length * 100 |0"
                style="width:300px; font-weight: bold; font-family: v-mono;"
              >
                <span style="margin:1px;">{{zipped[0]/length*100|0}}% {{$t('status.zipped')}} ({{ zipped[0] }}/{{ converted[0] }})</span>
              </n-progress>
            </template>
            {{$t('status.zippingProgress')}} ({{ zipped[0]/length*100|0 }}%)
          </n-popover>

          <!-- converted zips -->
          <transition name="zipcontainer">
          <template v-if="zipList.length >= 1 || statusProcessing">
            <transition-group name="zips" class="zip-buttons-parent" tag="n-flex">
              <span v-for="(item, index) in zipList" :key="index">
                <n-popover trigger="hover" :duration="0" :delay="0">
                  <template #trigger>
                    
                    <a :href="item.url" :download="item.name" class="in-button-anchor" @click="download(item)">
                    <n-button
                      class="zip-button"
                      size="tiny"
                      :color="item.clicked? '#050' : 'lime'"
                      :text-color="item.clicked? 'gray' : 'white'"
                      @click.stop="download(item)"
                      round
                    >
                      <n-icon size="tiny"><Archive /></n-icon>ZIP{{ item.number || '' }}
                    </n-button>
                    </a>

                  </template>

                  <div :style="{color:c.successColor}">
                  <div>ZIP {{ item.number || '' }} ({{ $t('success') }})</div>
                  <div>{{item.name}}</div>
                  <div>{{ item.sizeByUnit }}</div>
                  <div>{{ $rt(`{n} @:files`, item.count) }}</div>
                  </div>

                </n-popover>
              </span>
            </transition-group>
          </template>
          </transition>

        </n-flex>


      </n-flex>

      <!-- result -->
      <Transition>
      <n-flex v-show="!statusProcessing" justify="center" align="center" v-if="!cleaningUp">

        <!-- save button -->
        <n-popover trigger="hover" :duration="0" :delay="0" placement="left" :style="{color:'white', backgroundColor:c.successColor}" :arrow-style="{backgroundColor:c.successColor}">
          <template #trigger>
            <Transition name="save">
            <span v-if="success[0] > 0" style="position:relative;">
              <n-badge :value="zippingFlag ? zipped[0].toLocaleString('en-us') : props.status.type.replace(/\(.+\)/, '')" :color="c.successColorHover" :offset="[-20,-3]">
              <n-button size="medium" @click="onSaveButtonClick" :color="c.successColor" round>
                <template v-if="zippingFlag">
                  <a v-if="zipList.length" :href="zipList[0].url" :download="zipList[0].name" class="in-button-anchor" @click.prevent>
                    <Zipicon/> × {{ zipList.length }}
                    {{$t('status.saveAll')}}
                  </a>
                </template>
                <template v-else>
                  <a :href="outputImg.url" :download="outputImg.name" class="in-button-anchor" @click.prevent>
                    <n-icon size="tiny"><ImageSharp/></n-icon>
                    {{$t('save')}}
                  </a>
                </template>
              </n-button>
              </n-badge>
            </span>
            </Transition>
          </template>
          <template #default>
            <template v-if="status.length >= 2">
              <div>{{t('success')}}: {{zipped[0].toLocaleString()}}</div>
              <div>{{t('status.totalSize')}}: {{getUnitSize(status.zippedTotalSize)}}</div>
              <div>ZIP × {{zipList.length}}</div>
              <div>{{t('status.saveAllZipsTooltip')}}</div>
            </template>
            <template v-else>
              {{ $t(`status.downloadConvertedImage`, zipList.length) }}
            </template>
          </template>
        </n-popover>

        <!-- failed button -->
        <n-dropdown
          v-if="!statusProcessing && !(status.success === length)"
          :options="PopSelectErrorItems"
          @select="(k, opt) => PopSelectErrorItems.find(({key}) => k === key)?.onSelect()"
          :show-arrow="true"
          trigger="click"
          size="small"
          placement="bottom-start"
        >
          <n-popover :show="autoPopoverErrorButtonFlag" :duration="0" :delay="0" placement="right" :style="{color:'white', backgroundColor:c.errorColor}" :arrow-style="{backgroundColor:c.errorColor}">
            <template #trigger>
              <n-badge :value="status.unconvertedFileCount.toLocaleString()" :color="c.errorColorHover" :offset="[-0,-3]">
              <n-button size="small" :color="c.errorColor">
                <n-icon size="medium" style="vertical-align: middle;"><WarningOutline/></n-icon>
              </n-button>
              </n-badge>
            </template>
            <div>
              <div>{{t('failed')}}: {{status.unconvertedFileCount.toLocaleString()}}</div>
              <div>{{t('status.totalSize')}}: {{getUnitSize(status.unconvertedTotalSize)}}</div>
            </div>
          </n-popover>
        </n-dropdown>
        
      </n-flex>
      </Transition>

      
      <!-- zipping progress for failed files -->
      <transition name="zipcontainer">
      <n-flex v-show="demandedFailedZips" vertical align="center" v-if="!cleaningUp">
        
        <n-popover placement="left">
          <template #trigger>
            <n-progress
              type="line"
              indicator-placement="inside"
              color="red"
              rail-color="rgba(255, 0, 0, 0.5)"
              :indicator-text-color="status.failedFileZippedCount === status.unconvertedFileCount ? 'white' : '#500'"
              :processing="demandedFailedZips && !status.failedZipDone && !status.failedToCreateFailedZip"
              :percentage="status.failedFileZippedCount / status.unconvertedFileCount * 100 |0"
              style="width:300px; font-weight: bold; font-family: v-mono;"
            >
              <span v-if="!status.failedToCreateFailedZip" style="margin:1px;">{{status.failedFileZippedCount/status.unconvertedFileCount*100|0}}% {{$t('status.zipped')}} ({{ status.failedFileZippedCount }}/{{ status.unconvertedFileCount }})</span>
              <div v-else :style="{color: c.errorColor}">{{ $t('status.failureZippingFailedFiles') }}</div>
            </n-progress>
          </template>
          {{$t('status.zippingProgress')}} ({{ status.failedFileZippedCount/status.unconvertedFileCount*100|0 }}%)
        </n-popover>

        <!-- failed zips -->
        <transition-group name="zips" class="zip-buttons-parent" tag="n-flex">
          <span v-for="(item, index) in failedZipList" :key="index">
            <n-popover trigger="hover" :duration="0" :delay="0">
              <template #trigger>
                
                <a :href="item.url" :download="item.name" class="in-button-anchor" @click="download(item)">
                <n-button
                  class="zip-button"
                  size="tiny"
                  :color="item.clicked? '#551122': '#F00'"
                  :text-color="item.clicked? 'gray' : 'white'"
                  @click.stop="download(item)"
                  round
                >
                  <n-icon size="tiny"><Warning /></n-icon>ZIP{{item.number || ''}}
                </n-button>
                </a>

              </template>

              <div :style="{color:c.errorColor}">
              <div>ZIP {{ item.number || '' }} ({{ $t('failed') }})</div>
              <div>{{ item.name }}</div>
              <div>{{ item.sizeByUnit }}</div>
              <div>{{ $rt(`{n} @:files`, item.count) }}</div>
              </div>

            </n-popover>
          </span>
        </transition-group>

      </n-flex>
      </transition>

    </n-flex>
    </n-collapse-item>
    </n-collapse>

  </n-flex>
</template>






<style lang="scss" scoped>
.body {
  font-size: 1em;
}

.zip-buttons-parent {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  .zip-button {
    box-shadow: 0px 0px 1px black;
    margin: 0.2em;
    margin-left: -0.5rem;
    font-size: 0.5rem;
  }
}




.in-button-anchor {
  color: white;
  display: flex;
}


/* transitions */
.v-move,
.v-enter-active,
.v-leave-active {
  transition: all .2s ease;
}
.v-leave-active {
  position: absolute;
}
.v-enter-from, .v-leave-to {
  opacity: 0;
  transform: scaleY(0%);
}


.zips-move, 
.zips-enter-active,
.zips-leave-active {
  transition: all .5s ease;
}

.zipcontainer-enter-from {
  opacity: 0;
  transform: scale(0%);
}
.zipcontainer-leave-to {
  opacity: 0;
  transform: scale(0%);
}
.zipcontainer-enter-active,
.zipcontainer-leave-active {
  transition: all .3s ease;
}

.zips-enter-from {
  opacity: 0;
  transform: translateX(300px) scale(1);
}

.zips-leave-active {
  position: absolute;
}



.save-enter-from {
  opacity: 0;
  transform: scaleY(0%);
}
.save-move,
.save-enter-active {
  transition: all .5s ease;
}

.singleimage {
  transition: all .5s ease;
}

</style>