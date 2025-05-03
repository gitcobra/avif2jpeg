<script setup lang="ts">
import { ComponentInstance, ComponentInternalInstance, Directive, type CSSProperties } from 'vue';
import { dataTableDark, type DropdownOption, NIcon, NScrollbar, NSpin, useThemeVars } from 'naive-ui';
import { ImageSharp, Archive, Warning, WarningOutline, DocumentTextOutline, DownloadOutline, Filter } from '@vicons/ionicons5';
import { useI18n } from 'vue-i18n';
import ImageViewer from './image-viewer.vue';
import CenterColumn from './status.center-column.vue';
import { getThumbnailedSize, getUnitSize, sleep, useTimeoutRef } from '../../util';

import type { CollapseProps } from 'naive-ui';
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
const THUMB_SIZE = {W:160, H:80};
//const LOG_SIZE_LIMIT = 999999;
//const LOG_EXPANDED_MINHEIGHT = 250;
const LOG_INVISIBLE_ITEM_MARGIN = 3;


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

    logs: {
      key: number
      index: number
      core: number
      command: string
      path: string
      error?: boolean
      completed?: boolean
      zippedIndex?: number
      fileId?: number
      size?: number
      width?: number
      height?: number
    }[]
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
const logtable = useTemplateRef('table');
const logtbody = useTemplateRef<HTMLTableSectionElement>('tbody');
const currentSelectedLogNode = ref<HTMLTableRowElement>(null);

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

const expandLog = ref(false);
const autoScrollLog = ref(true);
const hideSuccess = ref(false);

const logMaxHeightPX = ref(80);
const expandedLogMinHeight = ref(200);
const logOpened = computed(() => expandedNames.value.includes('log'));
const filteredLogList = computed(() => {
  let list = workingLogs.value;
  switch( filterLogValue.value ) {
    case 'success':
      list = list.filter(item => item.completed);
      break;
    case 'error':
      list = list.filter(item => !item.completed);
      break;
  }

  return list;
});
const logSizeSliderShow = useTimeoutRef(false);

const expandedNames = ref<string[]>(['progress', 'log', 'output']);
const isExpanded = (name: string) => expandedNames.value.includes(name);
const setExpanded = (name: string) => expandedNames.value.push(name);
const removeExpanded = (name: string) => {
  const index = expandedNames.value.findIndex(v => v === name);
  if( index >= 0 )
    expandedNames.value.splice( index, 1)
};


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
const thumbcanvas = ref<HTMLCanvasElement>(null);
const processingBitmap = ref<ImageBitmap | HTMLImageElement | null>(null);
const scrollref = ref<InstanceType<typeof NScrollbar>>();
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

  // update processing image
  watch([processingBitmap, logOpened], () => {
    if( !processingBitmap.value || !logOpened.value )
      return;
    const {width, height} = getThumbnailedSize(processingBitmap.value, {width:THUMB_SIZE.W, height:THUMB_SIZE.H});
    thumbcanvas.value.width = width;
    thumbcanvas.value.height = height;
    thumbcanvas.value.style.width = width + 'px';
    thumbcanvas.value.style.height = height + 'px';
    
    if( processingBitmap.value instanceof HTMLImageElement ) {
      const ctxThumb = thumbcanvas.value.getContext('2d');
      ctxThumb.drawImage(processingBitmap.value, 0, 0, width, height);
    }
    else {
      const ctxThumb = thumbcanvas.value.getContext('bitmaprenderer');
      ctxThumb.transferFromImageBitmap(processingBitmap.value);
      processingBitmap.value.close();
      processingBitmap.value = null;
      props.status.thumbnail = null;
    }
  });

  
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

  // watch processing flag
  watch(() => props.processing, (newv, oldv) => {
    // start timer
    if( newv ) {
      startTimer();
      
      // some reactive values need to clean up
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

    // on finished
    if( !props.processing ) {
      onFinished();
    }
  });

  

  let _unmounted = false;
  
  
  // FIXME: change max-height of the log-container when the window is resized
  inst = getCurrentInstance();
  changeLogMaxHeight();
  window.addEventListener('resize', changeLogMaxHeight);
  const observer = new ResizeObserver(changeLogMaxHeight);
  observer.observe( inst.parent.parent.vnode.el as HTMLElement );

  
  onBeforeUnmount(() => {
    _unmounted = true;
    clearInterval(_intvId);
    clearTimeout(_tid);
    clearTimeout(hookedUpdateTimeoutId);
    clearTimeout(scrollTimeoutId);
    window.removeEventListener('resize', changeLogMaxHeight);
    observer.disconnect();
  });
  onUnmounted(() => clearInterval(_intvId));
});



// FIXME: change max-height of the log-container when the window is resized
let _tid;
let inst: ComponentInternalInstance;
const availDocumentHeight = ref(document.documentElement.clientHeight);
const availDialogHeight = ref(10);
const changeLogMaxHeight = () => {
  clearTimeout(_tid);
  _tid = setTimeout(() => {
    const logHeight = scrollref.value.$parent.$el.offsetHeight;
    const modalMargin = window.innerHeight - inst.parent.parent.vnode.el.offsetHeight - 8;
    const availModalHeight = Math.max(100, logHeight + modalMargin);
    
    availDocumentHeight.value = document.documentElement.clientHeight;
    availDialogHeight.value = availModalHeight;

    if( !logOpened.value || !expandLog.value /*|| _unmounted*/ )
      return;
    
    logMaxHeightPX.value = Math.max(availModalHeight, expandedLogMinHeight.value);
  }, 100);
};





onBeforeUnmount(() => {
  cleanup();
});
onUnmounted(() => {
  clearTimeout(_tid);
  clearTimeout(hookedUpdateTimeoutId);
  clearTimeout(scrollTimeoutId);
  clearTimeout(_tidLogItem);
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


// focus current selected log item
let causedChangeSelectByKeyboard = false;
let prevOpindexInLog = 0;
watch(() => outputImg.index, async () => {
  // calculate the index in the log item list
  const opindex = outputImg.index;
  let opindexInLog = filteredLogList.value.findIndex(item => item.zippedIndex === opindex);
  if( opindexInLog === -1 )
    opindexInLog = opindex;

  // recalculate current table view if selected item was out of the view
  let redrawnView = false;
  const overTopOfView = opindexInLog < logStartIndex.value;
  const overBottomOfView = opindexInLog > logStartIndex.value + logDisplayQuantity.value;
  if( overTopOfView || overBottomOfView ) {
    const scrollAmount = opindexInLog * logItemHeight - (overBottomOfView ? logMaxHeightPX.value : 0);
    scrollref.value?.scrollTo({behavior: 'instant', top: scrollAmount});
    await nextTick();
    calculateLogTableViewRange(true);
    await nextTick();

    redrawnView = true;
  }
  
  nextTick( () => {
    let node = currentSelectedLogNode.value;
    if( !node )
      return;
    
    // *sticky "<th>"s may hide the selected target node if the node is aligned to the top of the visible area of the scrollable ancestor.
    //  hence when scrolling up, focus previous sibling of the target instead of the target itself for that reason.
    if( prevOpindexInLog > opindexInLog ) {
      node = <HTMLTableRowElement>node.previousSibling || node;
      
      if( !(node instanceof HTMLElement) ) {
        scrollref.value?.scrollTo(0, 0);
        node = null;
      }
    }

    //node?.scrollIntoView?.({behavior: 'instant', block: redrawnView ? prevOpindexInLog > opindexInLog ? 'start' : 'end' : 'nearest'});
    node?.scrollIntoView?.({behavior: 'instant', block: 'nearest'});

    if( !causedChangeSelectByKeyboard ) {
      if( isExpanded('preview') ) {
        imageViewer.value?.$el.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      }
    }

    prevOpindexInLog = opindexInLog;
    causedChangeSelectByKeyboard = false;
  });
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
    const recievedlog = stat.logs;//stat.logs.slice(-LOG_SIZE_LIMIT);
    workingLogs.value.push(...recievedlog);
    
    if( recievedlog.length ) {
      nextTick( calculateLogTableViewRange );
      if( autoScrollLog.value ) {
        scrollLogViewToBottom();
      }
    }
  }
  stat.logs.length = 0; // clear the log;


  // thumbnail
  processingBitmap.value = stat.thumbnail;


  // current status color
  if( props.processing ) {
    statusColor.value = failure.value[0] ? c.value.errorColor : retried.value ? c.value.warningColor : c.value.infoColor;
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

  // close log unless it is expanded
  if( !expandLog.value ) {
    removeExpanded('log');
    expandLog.value = true;
  }
  setExpanded('preview');
  //imageViewerStarted.value = true;

  /*
  if( logOpened.value ) {
    setTimeout(scrollLogViewToBottom, 500);
    
    // focce rerendering for log table
    vm.proxy.$forceUpdate();
    vm = null;
  }

  update();
  */
}










// functions for the components' event handlers

async function changeViewerIndexBySelectedLogItem(completed: boolean, path:string, fileId: number, zippedIndex: number) {
  if( !completed )
    return;

  /*
  const index = props.status.ziplogs.findIndex(item => item.fileId === fileId);
  if( index === -1 )
    return;
  */
  const index = zippedIndex;

  console.log(path, fileId, zippedIndex);
  console.log(index, props.status.ziplogs[index]);

  if( !isExpanded('preview') ) {
    setExpanded('preview');
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

function onKeyPressInLogTable(ev: KeyboardEvent) {
  const logs = workingLogs.value;
  const currentSelectedIndex = logs.findIndex(item => item.zippedIndex === outputImg.index);
  
  let sign = 0;
  let count = 1;
  switch( ev.code ) {
    case 'ArrowUp':
      sign = -1;
      break;
    case 'ArrowDown':
      sign = 1;
      break;
    case 'PageUp':
      sign = -1;
      count = logMaxHeightPX.value / logItemHeight |0;
      break;
    case 'PageDown':
      sign = 1;
      count = logMaxHeightPX.value / logItemHeight |0;
      break;
    
    case 'Enter':
      if( currentSelectedIndex >= 0 ) {
        if( !imageViewer.value?.isPreviewing() ) {
          nextTick(() => imageViewer.value?.openPreview());
          ev.stopPropagation();
          ev.preventDefault();
        }
      }
      break;

    default:
      return;
  }
  
  let i = currentSelectedIndex;
  let lastTargetedIndex = -1;
  const len = logs.length;
  do {
    i += sign;
    /*
    if( i < 0 )
      i = len - 1;
    else if( i > len -1 )
      i = 0;
    */
    if( i < 0 || i > len - 1 )
      break;
    
    if( i === currentSelectedIndex )
      break;
    
    if( logs[i].completed ) {
      lastTargetedIndex = i;
      if( --count > 0 )
        continue;
      break;
    }
  } while( true )

  if( lastTargetedIndex >= 0 ) {
    imageViewer.value?.changeIndex(logs[lastTargetedIndex].zippedIndex + 1);
    ev.preventDefault();
  }

  causedChangeSelectByKeyboard = true;
}

// filter for log
const FilterOptions: {label:() => any, readonly value: 'success'|'error'|''}[] = [
  {
    label: () => t('status.showAll'),
    value: '',
  }, {
    label: () => t('status.showOnlySuccess'),
    value: 'success',
  }, {
    label: () => t('status.showOnlyError'),
    value: 'error',
  },
];

const filterLogValue = ref<typeof FilterOptions[number]['value']>(FilterOptions[0].value);



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
    if( !props.processing ) {
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




const logTopMarginStyle = ref<CSSProperties>({height: '0px'});
const logBottomMarginStyle = ref<CSSProperties>({height: '0px'});
const logStartIndex = ref(0);
const logDisplayQuantity = computed(() => logMaxHeightPX.value / logItemHeight + LOG_INVISIBLE_ITEM_MARGIN*2 |0);
let logItemHeight = 15;
let realLogHeight = 0;
let _tidLogItem = 0;
let lastTimeLogViewUpdated = 0;
let lastScrollTopWhenRangeUpdated = -999;
let lastLogLengthWhenRangeUpdated = -1;
function calculateLogTableViewRange(force?: any/*ev: Event*/) {
  const now = Date.now();
  if( force !== true ) {
    if( _tidLogItem )
      return;
    
    if( now - lastTimeLogViewUpdated < 30 ) {
      _tidLogItem = window.setTimeout(() => {
        _tidLogItem = 0;
        calculateLogTableViewRange();
      }, 30 - (now - lastTimeLogViewUpdated));
      return;
    }
  }
  lastTimeLogViewUpdated = now;
  
  if( !realLogHeight ) {
    realLogHeight = logtbody.value.rows[1].offsetHeight;
    logItemHeight = realLogHeight;
  }

  const loglen = filteredLogList.value.length;//workingLogs.value.length;
  //const scrollEl = ev.target! as HTMLElement;
  const scrollEl = scrollref.value.scrollbarInstRef.containerRef; // *HACK: get container element
  //const bottomScrollVal = scrollEl.scrollHeight - scrollEl.clientHeight - 1;
  const scrtop = scrollEl.scrollTop;
  // ignore too small scroll amount
  if( !force ) {
    if( loglen === lastLogLengthWhenRangeUpdated ) {
      if( Math.abs(scrtop - lastScrollTopWhenRangeUpdated) < logItemHeight*0.5 ) {
        return;
      }
    }
  }
  lastScrollTopWhenRangeUpdated = scrtop;
  lastLogLengthWhenRangeUpdated = loglen;

  const viewStartIndex = Math.max(0, (scrtop / logItemHeight | 0) - LOG_INVISIBLE_ITEM_MARGIN);
  logStartIndex.value = viewStartIndex;
  logTopMarginStyle.value.height = (viewStartIndex * logItemHeight) + 'px';
  logBottomMarginStyle.value.height = Math.max(0, loglen - (viewStartIndex + logDisplayQuantity.value)) * logItemHeight + 'px';

  //console.log("updated", logTopMarginStyle.value, logBottomMarginStyle.value);
}

function resetLogTableViewRange() {
  scrollref.value?.scrollTo(0, 0);
  calculateLogTableViewRange();
}

watch(logOpened, (val) => {
  if( val ) {
    calculateLogTableViewRange();
  }
});




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



const SCROLL_INTERVAL = 100;
let scrollTimeoutId = 0;
let scrollWaitingFlag = false;
function scrollLogViewToBottom(instant = false) {
  if( scrollWaitingFlag )
    return;
  else if( scrollTimeoutId ) {
    scrollWaitingFlag = true;
    return;
  }
  nextTick(() => {
    if( !instant && (/*!expandLog.value ||*/ !autoScrollLog.value) )
      return;
    //scrollref.value.scrollTo({behavior: instant ? 'instant' : 'smooth', top: workingLogs.value.length * 50});
    scrollref.value.scrollTo({behavior: 'instant', top: workingLogs.value.length * 50});

    scrollTimeoutId = window.setTimeout(() => {
      scrollTimeoutId = 0;
      if( scrollWaitingFlag ) {
        scrollWaitingFlag = false;
        scrollLogViewToBottom();
      }
    }, SCROLL_INTERVAL);
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
  failedZipList.value.length = 0;
  zipList.value.length = 0;
  //body.value.$el.innerHTML = '';

  //getCurrentInstance()?.update();

  expandLog.value = false;
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
    <n-collapse-item name="progress" style="white-space:nowrap;">
      <template #header="{collapsed}">
        <n-flex>
          {{ $t('status.Progress') }}
          <template v-if="collapsed">
            ({{ successPercentage[0] |0 }}%)
          </template>
        </n-flex>
      </template>
      <n-flex justify="center" align="center" :wrap="false" style="white-space: nowrap; margin-top:-2em">

        <!-- left column -->
        <n-flex vertical justify="center" class="left-column">
    
          <n-statistic tabular-nums :label="$t('status.elapsedTime')">
            <n-flex>
              {{ elapsedTime }}
            </n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.multiThreading')">
            <n-flex :style="{color: !props.status.threads ? 'red' : '', fontSize: '0.7rem'}">
              {{ props.status.threads ? $rt('{n} @:threads', props.status.threads) : $t('disabled') }}
            </n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.outputSettings')">
            <n-flex vertical justify="end" style="font-size: 0.6rem; line-height:0.6rem;">
              <div>{{$t('settings.imageType')}}: {{ props.status.type }}</div>
              <div v-if="status.shrink">{{$t('status.Shrinking')}}: <span style="">{{status.shrink[0]}}×{{status.shrink[1]}}</span></div>
              <div>Zip: {{ props.status.zipSize }}MB</div>
            </n-flex>
          </n-statistic>

        </n-flex>


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
          
          :processing="processing"
          :interval="UPDATE_INTERVAL_MSEC"
          :status-color="statusColor"

          class="center-column"
        />

        <!-- right column -->
        <n-flex vertical style="height:100%;" justify="center">
          <n-statistic tabular-nums :label="$t('status.inputSize')">
            <n-flex justify="end" :wrap="false" style="font-family:v-mono;">{{(inputTotalSize / 1024 | 0).toLocaleString('en-us')}} KB</n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.outputSize')">
            <n-flex justify="end" :wrap="false" style="font-family:v-mono;">{{(outputTotalSize / 1024 | 0).toLocaleString('en-us')}} KB</n-flex>
          </n-statistic>

          <n-statistic tabular-nums :label="$t('status.outInRate')">
            <n-flex vertical align="end" justify="start" style="font-size: smaller; font-family:v-mono; line-height:50%;">
              <span :style="{color:rateColor, fontSize:'larger'}">× {{ (outputTotalSize / inputTotalSize || 1).toFixed(2) }}</span>
              <span :style="{color:difColor}">({{ totalSizeDifStr }})</span>
              
            </n-flex>
          </n-statistic>
        </n-flex>

      </n-flex>
    </n-collapse-item>






    <!-- log view -->
    <n-collapse-item name="log" style="white-space:nowrap;">
      <template #header>
        <n-flex align="center" :wrap="false">{{$t('status.Log')}}<n-spin :size="16" v-show="processing && !logOpened"> </n-spin></n-flex>
      </template>
      <template #header-extra>
        <n-flex v-show="logOpened" align="center" justify="end" :wrap="true" style="margin-top:0.2em; margin-left:0.5em;">
          <!--<transition-group>-->
          <!-- filter completed item -->
          <n-select
            v-model:value="filterLogValue"
            :options="FilterOptions"
            @update:value="resetLogTableViewRange()"
            :placeholder="$t('status.filterLogSelect')" size="tiny" style="width:auto; font-size: smaller;" :consistent-menu-width="false" :show-on-focus="false"
          />
          <!--<n-checkbox key="a" v-model:checked="hideSuccess" size="small" style="font-size: smaller" class="hide-mobile">{{$t('status.filterSuccess')}}</n-checkbox>-->
          
          <!-- auto scroll -->
          <n-checkbox key="b" v-model:checked="autoScrollLog" @update:checked="flag => flag && scrollLogViewToBottom(true)" size="small" style="font-size: smaller">
            {{$t('status.autoScroll')}}
          </n-checkbox>
          <!--</transition-group>-->

          <!-- expand log -->
          <n-popover trigger="hover" :show="logSizeSliderShow" :disabled="!expandLog" placement="top" :delay="0">
            <template #trigger>
              <n-tooltip style="max-width:30em;" :disabled="true">
                <template #trigger>
                  <n-checkbox
                    size="small"
                    v-model:checked="expandLog"
                    @update:checked="flag => { if( flag ) {scrollLogViewToBottom(true);changeLogMaxHeight();logSizeSliderShow=true;} }"
                    style="font-size:smaller;"
                  >
                    {{ $t('status.expandLog') }}
                  </n-checkbox>
                </template>
                <template #default>
                  <!-- {{$t('status.expandLogTooltip')}} -->
                  {{ $t('status.expandLog') }}
                </template>
              </n-tooltip>
            </template>

            <n-flex :wrap="false" align="center" style="font-size: 0.8rem">
              <n-slider
                v-model:value="expandedLogMinHeight"
                @update-value="changeLogMaxHeight"
                :disabled="!expandLog"
                :format-tooltip="value => `Log size: ${value}`"
                :tooltip="true"
                :step="1"
                :min="availDialogHeight"
                :max="availDocumentHeight"
                style="z-index:3; width:100px;"
              />
              <!--
              <span style="width:3em; text-align: center;">
                {{ LOG_EXPANDED_MINHEIGHT }}px
              </span>
              -->
            </n-flex>
          </n-popover>

        </n-flex>
      </template>
      
      <n-flex :wrap="false" align="stretch"
        :class="{'log-container':1, 'expand-log': expandLog}"
        :style="expandLog ? {maxHeight: logMaxHeightPX + 'px'} : {height: '110px'}"
        @keydown="onKeyPressInLogTable"
        tabindex="-1"
      >
        <!-- filename table -->
        <n-scrollbar
          ref="scrollref"
          :distance="10"
          :x-scrollable="true"
          @mousedown.capture="autoScrollLog=false"
          @wheel="autoScrollLog=false"
          @scroll="calculateLogTableViewRange"
          load="handleLogLoad"
          trigger="none"
          style="z-index:2; padding-right:10px; height:100%;"
          :size="50"
          :style="expandLog ? {height: logMaxHeightPX + 'px'} : {}"
        >
          <table v-if="logOpened" class="log-table" ref="table">
          <thead>
          <tr class="log-tr label">
            <th class="log-th" :title="$t('status.table.core')">th</th>
            <th class="log-th">no.<!--{{$t('status.table.index')}}--></th>
            <th style="min-width:7em;" class="log-th">{{$t('status.table.status')}}</th>
            <th style="padding-left:2em;" class="log-th">{{$t('status.table.details')}}</th>
          </tr>
          </thead>
          
          <!-- converting items -->
          <tbody ref="tbody">
          <tr :style="logTopMarginStyle"></tr>
          <tr
            v-for="({index, key, command, path, core, zippedIndex, completed, fileId}, i) in filteredLogList.slice(logStartIndex, logStartIndex + logDisplayQuantity)"
            :key="key"
            :class="{'log-tr':1, completed, selected:outputImg.index === zippedIndex}"
            :ref="(el: any) => {if( outputImg.index === zippedIndex ) currentSelectedLogNode = el}"
            @click="changeViewerIndexBySelectedLogItem(completed, path, fileId, zippedIndex)"
            @dblclick="() => {if( outputImg.index === zippedIndex ) imageViewer.openPreview()}"
          >
            <td class="log-td">{{ (core >= 0 ? core+1 : '-') }}</td>
            <td class="log-td">{{ index+1 }}</td>
            <td class="log-td">{{ command }}</td>
            <td class="log-td">{{path}}</td>
          </tr>
          <tr :style="logBottomMarginStyle"></tr>
          </tbody>
          </table>
          <div style="height:1em"></div>
        </n-scrollbar>

        <!-- processing image -->
        <n-flex style="align-self:center; position:absolute; z-index:0; margin-top:10px; right:0.1em; line-height:0px;" :style="{width:THUMB_SIZE.W+'px', height:THUMB_SIZE.H+'px'}" justify="center" align="center">
          <n-spin size="small" :show="processing">
            <n-empty v-if="props.status.thumbnail===undefined" description="EMPTY" />
            <canvas v-show="props.status.thumbnail!==undefined" ref="thumbcanvas" width="106" height="80" :style="{border:'1px solid gray', filter: processing? '' : 'opacity(0.35)'}"/>
          </n-spin>
        </n-flex>

      </n-flex>
    </n-collapse-item>


    





    
    <n-collapse-item :title="$t('status.PreviewImage')" name="preview" style="white-space:nowrap;" :disabled="!(success[0] > 0)">
      <!-- image browser -->
      <n-flex justify="center" align="center" vertical>
          <!--
          <transition>
            <n-button v-if="!imageViewerStarted" tertiary type="success" size="small" :disabled="!(status.success > 0)" @click="imageViewerStarted=true">
              {{$t('status.browseConvertedImages')}}
            </n-button>
          -->
          
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
                :processing="processing"
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
          <template v-if="zipList.length >= 1 || props.processing">
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
      <n-flex v-show="!props.processing" justify="center" align="center" v-if="!cleaningUp">

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
          _v-if="!processing && !(status.success === length)"
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
  font-size: 1rem;
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

.log-container {
  position: relative;
  overflow: hidden;
  font-size: 1rem;

  transition: all .2s ease;
  margin-top: -1em;
  margin-left: 1em;
  /*height: 7em;*/

  &:focus {
    outline: 0px;
  }
  /* log table */
  .log-table {
    z-index: 1;
    position:relative;
    font-size: 0.7rem;
    line-height: 0.7rem;
    white-space: nowrap;
    border-collapse: collapse;
    
    .completed {
      cursor: pointer;
    }
    .selected {
      background-color: #29a36155;
      /*color: white;*/
    }
    .label {
      position:sticky;
      top:0px;
      
      .log-th {
        color: #666;
        padding: 0px 3px 3px;
        background-color: white;
      }
      .log-th:nth-of-type(4) {
        text-align: left;
        width: 250px;
      }
      .log-th:nth-of-type(5) {
        background-color: transparent;
      }
    }
    .blank-space {
      height: 1em;
    }
    .log-td {
      border-left: 1px dotted #CCC;
      &:first-child, &:nth-of-type(2) {
        text-align: right;
        font-family: v-mono;
      }
      &:first-child {
        border-left: none;
      }
    }
  }

  &.expand-log {
    /* change max-height by logMaxHeight */

    border: 1px dashed #BBB;
    border-width: 0px 1px 0px;
    /*
    th {
      background-color: white;
    }
    */
  }
}



.in-button-anchor {
  color: white;
  display: flex;
}



.left-column {
  height:100%;
}
.center-column {
  width: 10rem;
  font-size: 1.5rem;
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