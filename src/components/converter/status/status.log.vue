<script setup lang="ts">
import { getThumbnailedSize, getUnitSize, useTimeoutRef } from '@/components/util';
import { NScrollbar } from 'naive-ui';
import { ComponentInternalInstance, type CSSProperties } from 'vue';
import { Filter, SwapVertical } from '@vicons/ionicons5';

// common components
const { t } = useI18n();

// constants
const LOG_INVISIBLE_ITEM_MARGIN = 3;
const THUMB_SIZE = {W:160, H:80};
const SORT_LIST_INTERVAL_MSEC = 3000;


// props
const props = defineProps<{
  processing: boolean;
  opened: boolean;
  previewCollapsed: boolean;
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
    outputWidth?: number
    outputHeight?: number
    outputSize?: number
    shrinked?: boolean
  }[];
  imageIndex: number;
  thumbnail: ImageBitmap | HTMLImageElement | null;
}>();

// v-model
const expanded = defineModel<boolean>('expanded', {required: false});
//const sortValue *this v-model variable is described with SortObtions below



// emits
const emit = defineEmits<{
  'open-preview': [number?];
  'change-index': [boolean, string, number, number];
}>();


// element refs
const logtable = useTemplateRef('table');
const logtbody = useTemplateRef<HTMLTableSectionElement>('tbody');
const scrollref = ref<InstanceType<typeof NScrollbar>>();
const currentSelectedLogNode = ref<HTMLTableRowElement>(null);
const thumbcanvas = ref<HTMLCanvasElement>(null);


// reactive values
//const expandLog = ref(false);
const autoScrollLog = ref(true);

const logMaxHeightPX = ref(80);
const expandedLogMinHeight = ref(200);
const filteredLogList = computed(() => {
  let list = props.logs;
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


// sort options
const SortOptions: {label:() => any, readonly value: 'processed'|'zipped'|'status'|'name'|'size'|'outputsize'}[] = [
  {
    label: () => t('status.sortByStart'),
    value: 'processed',
  }, {
    label: () => t('status.sortByCompletion'),
    value: 'zipped',
  }, {
    label: () => t('status.sortByName'),
    value: 'name',
  }, {
    label: () => t('status.sortBySize'),
    value: 'size',
  }, {
    label: () => t('status.sortByOutputSize'),
    value: 'outputsize',
  }, {
    label: () => t('status.sortByStatus'),
    value: 'status',
  },
];
const SortOptionGroup = ref([{
  type: 'group',
  label: () => t('status.sort'),
  key: 'sort',
  children: SortOptions,
}]);
//const sortValue = ref<typeof SortOptions[number]['value']>(SortOptions[0].value);
const sortValue = defineModel<typeof SortOptions[number]['value']>('order', {required: false, default:'processed'});

watch(sortValue, sortListBySortOptions);


// filter options
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















onMounted(() => {
  // FIXME: change max-height of the log-container when the window is resized
  inst = getCurrentInstance();
  changeLogMaxHeight();
  
  window.addEventListener('resize', changeLogMaxHeight);
  const observer = new ResizeObserver(changeLogMaxHeight);
  observer.observe( inst.parent.parent.vnode.el as HTMLElement );
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', changeLogMaxHeight);
    observer.disconnect();
  });
});

onBeforeUnmount(() => {
  prevThumbBitmap.close();
  clearTimeout(_tid);
  clearTimeout(_tidLogItem);
  clearTimeout(scrollTimeoutId);
});

// update processing image
let prevThumbBitmap;
watch(() => [props.thumbnail, props.opened], () => {
  if( !props.thumbnail || !props.opened || props.thumbnail === prevThumbBitmap )
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

// focus current selected log item
let causedChangeSelectByKeyboard = false;
let prevOpindexInLog = 0;
watch(() => props.imageIndex, async () => {
  // calculate the index in the log item list
  const opindex = props.imageIndex;
  let opindexInLog = filteredLogList.value.findIndex(item => item.zippedIndex === opindex);
  if( opindexInLog === -1 )
    opindexInLog = opindex;

  // recalculate current table view if selected item was out of the view
  let redrawnView = false;
  const overTopOfView = opindexInLog < logStartIndex.value;
  const overBottomOfView = opindexInLog > logStartIndex.value + logDisplayQuantity.value;
  if( overTopOfView || overBottomOfView ) {
    const scrollAmount = opindexInLog * logItemHeight - (overBottomOfView ? logMaxHeightPX.value : 0);
    scrollref.value?.scrollTo({behavior: 'instant', top: scrollAmount, left:storedLogTableScrollLeft});
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
        scrollref.value?.scrollTo(storedLogTableScrollLeft, 0);
        node = null;
      }
    }

    //node?.scrollIntoView?.({behavior: 'instant', block: redrawnView ? prevOpindexInLog > opindexInLog ? 'start' : 'end' : 'nearest'});
    node?.scrollIntoView?.({behavior: 'instant', block: 'nearest'});

    /*
    if( !causedChangeSelectByKeyboard ) {
      if( isExpanded('preview') ) {
        imageViewer.value?.$el.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      }
    }
    */

    prevOpindexInLog = opindexInLog;
    causedChangeSelectByKeyboard = false;
  });
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

    if( !props.opened || !expanded.value /*|| _unmounted*/ )
      return;
    
    logMaxHeightPX.value = Math.max(availModalHeight, expandedLogMinHeight.value);
  }, 100);
};


// auto scroll
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
    if( !instant && !autoScrollLog.value )
      return;
    scrollref.value.scrollTo({behavior: 'instant', top: props.logs.length * 50, left:storedLogTableScrollLeft});

    scrollTimeoutId = window.setTimeout(() => {
      scrollTimeoutId = 0;
      if( scrollWaitingFlag ) {
        scrollWaitingFlag = false;
        scrollLogViewToBottom();
      }
    }, SCROLL_INTERVAL);
  });
}



// Redraw log table in the visible area.
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

  const loglen = filteredLogList.value.length;
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

watch(() => props.logs, () => {
  if( !props.opened )
    return;
  
  nextTick( calculateLogTableViewRange );
  if( autoScrollLog.value ) {
    scrollLogViewToBottom();
  }

  sortListPeriodically();
});
watch(() => props.opened, (val) => {
  if( val ) {
    calculateLogTableViewRange();
  }
});



let _tid_sort = 0;
let prevSortTime = 0;
function sortListPeriodically() {
  if( sortValue.value === 'processed' || !sortValue.value )
    return;
  
  const now = Date.now();
  if( now - prevSortTime < SORT_LIST_INTERVAL_MSEC ) {
    if( _tid_sort )
      return;
    _tid_sort = window.setTimeout( sortListPeriodically, SORT_LIST_INTERVAL_MSEC - (now - prevSortTime) );
    return;
  }

  _tid_sort = 0;
  prevSortTime = now;
  sortListBySortOptions();
}

function sortListBySortOptions() {
  console.log('sortList', sortValue.value);
  switch( sortValue.value ) {
    case 'zipped':
      props.logs.sort((a, b) => a.zippedIndex - b.zippedIndex);
      break;
    case 'status':
      props.logs.sort((a, b) => a.command > b.command ? 1 : -1);
      break;
    case 'name':
      props.logs.sort((a, b) => a.path > b.path ? 1 : -1);
      break;
    case 'size':
      props.logs.sort((a, b) => a.size - b.size);
      break;
    case 'outputsize':
      props.logs.sort((a, b) => a.outputSize - b.outputSize);
      break;
    
    case 'processed':
    default:
      props.logs.sort((a, b) => a.index - b.index);
      break;
  }
}

function onKeyPressInLogTable(ev: KeyboardEvent) {
  const logs = props.logs;
  const currentSelectedIndex = logs.findIndex(item => item.zippedIndex === props.imageIndex);
  
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
        if( props.previewCollapsed ) {
          //nextTick(() => imageViewer.value?.openPreview());
          nextTick(() => emit('open-preview'));
          ev.stopPropagation();
          ev.preventDefault();
          return;
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
    //imageViewer.value?.changeIndex(logs[lastTargetedIndex].zippedIndex + 1);
    const item = logs[lastTargetedIndex];
    emit('change-index', true, item.path, item.fileId, item.zippedIndex);
    ev.preventDefault();
  }

  causedChangeSelectByKeyboard = true;
}


let prevScrollLeft = -1;
let prevScrollTop = -1;
let storedLogTableScrollLeft = 0;
let ignoreScrollLeftChangeFlag = false;
function onLogTableScroll(ev) {
  calculateLogTableViewRange();
  
  
  // if only scrollLeft is changed(by user), store and then restore the position after updating the table.
  
  // ignore a change by this function
  if( ignoreScrollLeftChangeFlag ) {
    ignoreScrollLeftChangeFlag = false;
    return;
  }

  const {scrollLeft=0, scrollTop=0} = scrollref.value?.scrollbarInstRef?.containerRef;
  if( scrollLeft !== prevScrollLeft || prevScrollLeft < 0 ) {
    if( scrollTop === prevScrollTop || prevScrollTop < 0 ) {
      storedLogTableScrollLeft = scrollLeft;
      console.log(storedLogTableScrollLeft, "storedLogTableScrollLeft");
    }
  }
  prevScrollLeft = scrollLeft;
  prevScrollTop = scrollTop;

  // restore scrollLeft
  nextTick(() => {
    ignoreScrollLeftChangeFlag = true;
    const el = scrollref.value?.scrollbarInstRef?.containerRef;
    if( el )
      el.scrollLeft = storedLogTableScrollLeft;
  });
}

function onMouseDownScrollbar(ev: MouseEvent) {
  autoScrollLog.value = false;
}





</script>

<template>

  <n-collapse-item name="log" style="white-space:nowrap;">
    <template #header>
      <n-flex align="center" :wrap="false">{{$t('status.Log')}}<n-spin :size="16" v-show="processing && !props.opened"> </n-spin></n-flex>
    </template>
    <template #header-extra>
      <n-flex v-show="props.opened" align="center" justify="end" :wrap="true" style="margin-top:0.2em; margin-left:0.5em;">
        
        <n-select
          v-model:value="sortValue"
          :options="SortOptionGroup"
          @update:value="sortListBySortOptions"

          style="width:auto; font-size: smaller;" :consistent-menu-width="false" :show-on-focus="false" size="tiny"
        >
          <template #arrow><n-icon :component="SwapVertical"/></template>
        </n-select>
        <!-- filter completed item -->
        <n-select
          v-model:value="filterLogValue"
          :options="FilterOptions"
          @update:value="resetLogTableViewRange()"
          :placeholder="$t('status.filterLogSelect')" size="tiny" style="width:auto; font-size: smaller;" :consistent-menu-width="false" :show-on-focus="false"
        >
          <template #arrow><n-icon :component="Filter"/></template>
        </n-select>
        
        <!-- auto scroll -->
        <n-checkbox key="b" v-model:checked="autoScrollLog" @update:checked="flag => flag && scrollLogViewToBottom(true)" size="small" style="font-size: smaller">
          {{$t('status.autoScroll')}}
        </n-checkbox>
        <!--</transition-group>-->

        <!-- expand log -->
        <n-popover trigger="hover" :show="logSizeSliderShow" :disabled="!expanded" placement="top" :delay="0">
          <template #trigger>
            <n-tooltip style="max-width:30em;" :disabled="true">
              <template #trigger>
                <n-checkbox
                  size="small"
                  v-model:checked="expanded"
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
              :disabled="!expanded"
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
      :class="{'log-container':1, 'expand-log': expanded}"
      :style="expanded ? {height: logMaxHeightPX + 'px'} : {height: '110px'}"
      @keydown="onKeyPressInLogTable"
      tabindex="-1"
    >
      <!-- filelist table -->
      <n-scrollbar
        ref="scrollref"
        :distance="10"
        :x-scrollable="true"
        @mousedown.capture="onMouseDownScrollbar"
        @wheel="autoScrollLog=false"
        @scroll="onLogTableScroll"
        load="handleLogLoad"
        trigger="none"
        style="z-index:2; padding-right:10px; height:100%;"
        :size="50"
        :style="expanded ? {height: logMaxHeightPX + 'px'} : {}"
      >
        <table v-if="props.opened" class="log-table" ref="table">
        <thead>
        <tr class="log-tr label">
          <th class="log-th" :title="$t('status.table.core')">th</th>
          <th class="log-th">no.<!--{{$t('status.table.index')}}--></th>
          <th style="min-width:7em;" class="log-th">{{$t('status.table.status')}}</th>
          <th style="padding-left:2em;" class="log-th">{{$t('status.table.details')}}</th>
          <th class="log-th">size</th>
        </tr>
        </thead>
        
        <!-- converting items -->
        <tbody ref="tbody">
        <tr :style="logTopMarginStyle"></tr>
        <tr
          v-for="({index, key, command, path, core, zippedIndex, completed, fileId, shrinked, width, height, outputWidth, outputHeight, size, outputSize}, i) in filteredLogList.slice(logStartIndex, logStartIndex + logDisplayQuantity)"
          :key="key"
          :class="{'log-tr':1, completed, selected:imageIndex === zippedIndex}"
          :ref="(el: any) => {if( imageIndex === zippedIndex ) currentSelectedLogNode = el}"
          @click="emit('change-index', completed, path, fileId, zippedIndex)"
          @dblclick="() => {if( imageIndex === zippedIndex ) emit('open-preview')}"
        >
          <td class="log-td">{{ (core >= 0 ? core+1 : '-') }}</td>
          <td class="log-td">{{ index+1 }}</td>
          <td class="log-td">{{ command }}</td>
          <td class="log-td">{{ path }}</td>
          <td class="log-td log-extra" v-if="width" style="padding-left:0.5em;">
            {{ `[${width}×${height}] (${getUnitSize(size, 0)})`}}
            <span v-if="outputWidth">
              →
              <span>
                ({{ (getUnitSize(outputSize, 0)) }})
              </span>
            </span>
            <span v-if="shrinked" style="color:blue">
              {{ ` [${outputWidth}×${outputHeight}]`}}
            </span>
          </td>
        </tr>
        <tr :style="logBottomMarginStyle"></tr>
        </tbody>
        </table>
        <div style="height:1em"></div>
      </n-scrollbar>

      <!-- processing image -->
      <n-flex style="align-self:center; position:absolute; z-index:0; margin-top:10px; right:0.1em; line-height:0px;" :style="{width:THUMB_SIZE.W+'px', height:THUMB_SIZE.H+'px'}" justify="center" align="center">
        <n-spin size="small" :show="processing">
          <n-empty v-if="props.thumbnail===undefined" description="EMPTY" />
          <canvas v-show="props.thumbnail!==undefined" ref="thumbcanvas" width="106" height="80" :style="{border:'1px solid gray', filter: processing? '' : 'opacity(0.35)'}"/>
        </n-spin>
      </n-flex>

    </n-flex>
  </n-collapse-item>

</template>

<style lang="scss">

.log-container {
  position: relative;
  overflow: hidden;
  font-size: 1rem;
  height: 110px;

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
    width: 100%;
    
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
    }
    .blank-space {
      height: 1em;
    }
    .td {
      width: 1em;
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
      &:nth-of-type(4) {
        width: 100%;
      }
    }
    .log-extra {
      font-size: smaller;
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

</style>