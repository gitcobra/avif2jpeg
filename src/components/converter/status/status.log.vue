<script setup lang="ts">
import { getThumbnailedSize, getUnitSize, useTimeoutRef } from '@/components/util';
import { NScrollbar } from 'naive-ui';
import { ComponentInternalInstance, type CSSProperties } from 'vue';
import { Filter, SwapVertical } from '@vicons/ionicons5';

// common components
const { t } = useI18n();

// constants
const LOG_INVISIBLE_ITEM_MARGIN = 2;
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
  //thumbnail: ImageBitmap | HTMLImageElement | null;
}>();

// v-model
const expanded = defineModel<boolean>('expanded', {required: false});
const autoScrollLog = defineModel<boolean>('auto-scroll', {required: false});
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
//const thumbcanvas = ref<HTMLCanvasElement>(null);


// reactive values
//const expandLog = ref(false);
//const autoScrollLog = ref(true);

const logMaxHeightPX = ref(40);
const logDefHeight = 80;
const logTableViewHeight = computed(() => expanded.value? logMaxHeightPX.value : logDefHeight);
const expandedLogMinHeight = ref(logDefHeight);
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

watch(sortValue, () => {
  console.log('sortValue changed');
  sortListBySortOptions();
});


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
  
  window.addEventListener('resize', () => changeLogMaxHeight());
  const observer = new ResizeObserver(() => changeLogMaxHeight());
  observer.observe( inst.parent.parent.vnode.el as HTMLElement );
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', () => changeLogMaxHeight());
    observer.disconnect();
  });
});

onBeforeUnmount(() => {
  //prevThumbBitmap?.close();
  clearTimeout(_tid);
  clearTimeout(_tidLogItem);
  clearTimeout(scrollTimeoutId);
});



// focus current selected log item
let causedChangeSelectByKeyboard = false;
let prevOpindexInLog = 0;
watch(() => props.imageIndex, val => focusCurrentSelectedLogItem(val));

async function focusCurrentSelectedLogItem(imgIndex?: number) {
  // calculate the index in the log item list
  const targIndex = imgIndex || props.imageIndex;
  let targIndexInLog = filteredLogList.value.findIndex(item => item.zippedIndex === targIndex);
  if( targIndexInLog === -1 )
    targIndexInLog = targIndex;

  //console.log("targIndex", targIndex, "targIndexInLog", targIndexInLog);
  //console.log("logStartIndex.value", logStartIndex.value, "logDisplayQuantity.value", logDisplayQuantity.value);

  // recalculate current table view if selected item was out of the view
  let redrawnView = false;
  const overTopOfView = targIndexInLog <= logStartIndex.value;
  const overBottomOfView = targIndexInLog > logStartIndex.value + logDisplayQuantity.value;
  if( overTopOfView || overBottomOfView ) {
    //console.log('overOfTheView');
    const scrollAmount = targIndexInLog * logItemHeight.value - (overBottomOfView ? logTableViewHeight.value : 0);
    scrollref.value?.scrollTo({behavior: 'instant', top: scrollAmount, left:storedLogTableScrollLeft});
    await nextTick();
    calculateLogTableViewRange(true);
    await nextTick();

    redrawnView = true;
  }
  
  nextTick(() => {
    let node = currentSelectedLogNode.value;
    if( !node )
      return;
    
    // *sticky "<th>"s may hide the selected target node if the node is aligned to the top of the visible area of the scrollable ancestor.
    //  hence when scrolling up, focus previous sibling of the target instead of the target itself for that reason.
    if( prevOpindexInLog > targIndexInLog ) {
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

    prevOpindexInLog = targIndexInLog;
    causedChangeSelectByKeyboard = false;
  });
}

watch(() => props.opened, (val) => {
  nextTick(() => {
    if( !val )
      return;
    
    focusCurrentSelectedLogItem();
    calculateLogTableViewRange();
  });
});




// FIXME: change max-height of the log-container when the window is resized
let _tid;
let inst: ComponentInternalInstance;
const availDocumentHeight = ref(document.documentElement.clientHeight);
const availDialogHeight = ref(100);
function changeLogMaxHeight() {
  clearTimeout(_tid);
  _tid = setTimeout(() => {
    if( !props.opened || !scrollref.value )
      return;
    
    const logHeight = scrollref.value.$parent.$el.offsetHeight;
    const modalMargin = window.innerHeight - inst.parent.parent.parent.parent.vnode.el.offsetHeight - 8;
    const availModalHeight = Math.min(logItemHeight.value * Math.max(5, props.logs.length), Math.max(200, logHeight + modalMargin));
    
    availDocumentHeight.value = document.documentElement.clientHeight;
    availDialogHeight.value = Math.min(logItemHeight.value * Math.max(5, props.logs.length), Math.max(logDefHeight, availModalHeight));

    if( !props.opened /*|| !expanded.value*/ )
      return;
    logMaxHeightPX.value = Math.max(availModalHeight, expandedLogMinHeight.value);
  }, 100);
}

function onExpandClick() {
  scrollLogViewToBottom(true);
  changeLogMaxHeight();
  logSizeSliderShow.value = true;
}




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
const logDisplayQuantity = computed(() => logTableViewHeight.value / logItemHeight.value + LOG_INVISIBLE_ITEM_MARGIN*2 |0);
const logItemHeight = ref(15);
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
    logItemHeight.value = realLogHeight;
  }

  const loglen = filteredLogList.value.length;
  //const scrollEl = ev.target! as HTMLElement;
  const scrollEl = scrollref.value.scrollbarInstRef.containerRef; // *HACK: get container element
  //const bottomScrollVal = scrollEl.scrollHeight - scrollEl.clientHeight - 1;
  const scrtop = scrollEl.scrollTop;
  // ignore too small scroll amount
  if( !force ) {
    if( loglen === lastLogLengthWhenRangeUpdated ) {
      if( Math.abs(scrtop - lastScrollTopWhenRangeUpdated) < logItemHeight.value*0.5 ) {
        return;
      }
    }
  }
  lastScrollTopWhenRangeUpdated = scrtop;
  lastLogLengthWhenRangeUpdated = loglen;

  const viewStartIndex = Math.max(0, (scrtop / logItemHeight.value | 0) - LOG_INVISIBLE_ITEM_MARGIN);
  logStartIndex.value = viewStartIndex;
  logTopMarginStyle.value.height = (viewStartIndex * logItemHeight.value) + 'px';
  logBottomMarginStyle.value.height = Math.max(0, loglen - (viewStartIndex + logDisplayQuantity.value)) * logItemHeight.value + 'px';

  //console.log("updated", "logDisplayQuantity", logDisplayQuantity.value, "topmargin", logTopMarginStyle.value, "bottommargin", logBottomMarginStyle.value);
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

  //console.log('updated props.logs');
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
      count = logTableViewHeight.value / logItemHeight.value - 1 |0;
      break;
    case 'PageDown':
      sign = 1;
      count = logTableViewHeight.value / logItemHeight.value - 1 |0;
      break;
    
    case 'Enter':
    case 'NumpadEnter':
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

  console.log("lastTargetedIndex", lastTargetedIndex);

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
function onLogTableScroll(ev: Event) {
  //console.log('onLogTableScroll', (ev.target as HTMLElement)?.scrollLeft, (ev.target as HTMLElement)?.scrollTop);
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


function onLogTableClick(ev: MouseEvent, dbl?: boolean) {
  const target = ev.target as HTMLElement;
  const logidx = target.closest('tr')?.dataset?.indexLoglist;
  if( !/^\d+$/.test(logidx) )
    return;

  const {completed, path, fileId, zippedIndex} = filteredLogList.value[logidx];

  if( completed ) {
    if( props.imageIndex !== zippedIndex )
      emit('change-index', completed, path, fileId, zippedIndex);

    if( dbl )
      emit('open-preview');
  }
}


</script>

<template>

  <n-collapse-item name="log" style="white-space:nowrap;">
    <template #header>
      <n-flex align="center" :wrap="false">
        {{$t('status.Log')}}
        <!-- <n-spin :size="16" v-show="processing && !props.opened"> </n-spin> -->
      </n-flex>
    </template>
    <template #header-extra>
      <n-flex v-show="props.opened" align="center" justify="end" :wrap="true" style="margin-top:0.2em; margin-left:0.5em;">
        
        <n-select
          v-model:value="sortValue"
          :options="SortOptionGroup"
          @update:value="sortListBySortOptions"

          style="width:auto;" :consistent-menu-width="false" :show-on-focus="false" size="tiny"
        >
          <template #arrow><n-icon :component="SwapVertical"/></template>
        </n-select>
        <!-- filter completed item -->
        <n-select
          v-model:value="filterLogValue"
          :options="FilterOptions"
          @update:value="resetLogTableViewRange()"
          :placeholder="$t('status.filterLogSelect')" size="tiny" style="width:auto;" :consistent-menu-width="false" :show-on-focus="false"
        >
          <template #arrow><n-icon :component="Filter"/></template>
        </n-select>
        
        <!-- auto scroll -->
        <n-checkbox key="b" v-model:checked="autoScrollLog" @update:checked="flag => flag && scrollLogViewToBottom(true)" size="small" style="font-size: 0.9em;">
          {{$t('status.autoScroll')}}
        </n-checkbox>
        <!--</transition-group>-->

        <!-- expand log -->
        <n-popover trigger="hover" :show="logSizeSliderShow" :disabled="!expanded" placement="top" :delay="0" :duration="1000">
          <template #trigger>
            <n-tooltip style="max-width:30em;" :disabled="true">
              <template #trigger>
                <n-checkbox
                  size="small"
                  v-model:checked="expanded"
                  @update:checked="onExpandClick"
                  style="font-size: 0.9em;"
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

          <n-flex :wrap="false" align="center" style="font-size: 0.8em">
            <n-slider
              v-model:value="expandedLogMinHeight"
              @update-value="changeLogMaxHeight()"
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
      :style="{height:logTableViewHeight + 'px'}"
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
        :style="{height:logTableViewHeight + 'px'}"
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
        <tbody ref="tbody"
          @click="onLogTableClick"
          @dblclick="ev => onLogTableClick(ev, true)"
        >
        <tr :style="logTopMarginStyle"></tr>
        <tr
          v-for="({index, key, command, path, core, zippedIndex, completed, fileId, shrinked, width, height, outputWidth, outputHeight, size, outputSize}, i) in filteredLogList.slice(logStartIndex, logStartIndex + logDisplayQuantity)"
          :key="key"
          :class="{'log-tr':1, completed, selected:imageIndex === zippedIndex, stripe:(logStartIndex + i) % 2}"
          :ref="(el: any) => {if( imageIndex === zippedIndex ) currentSelectedLogNode = el}"
          :data-index-loglist="logStartIndex + i"
        >
          <td class="log-td">{{ (core >= 0 ? core+1 : '-') }}</td>
          <td class="log-td">{{ index+1 }}</td>
          <td class="log-td">{{ command }}</td>
          <td class="log-td">{{ path }}</td>
          <td class="log-td log-extra" v-if="width" style="padding-left:0.5em;">
            {{ `[${width}×${height}] (${getUnitSize(size, 0)})`}}
            <span v-if="outputSize">
              →
              <span>
                ({{ (getUnitSize(outputSize, 0)) }})
              </span>
            </span>
            <span v-if="shrinked" style="color:blue">
              {{ ` [${outputWidth}×${outputHeight}]`}}
            </span>
          </td>
          <td v-else></td>
        </tr>
        <tr :style="logBottomMarginStyle"></tr>
        </tbody>
        </table>
        <div style="height:1em"></div>
      </n-scrollbar>


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
  margin: -1em -1em 4px 0px;
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
    .stripe {
      background-color: #CCCCCC55;
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
    td:nth-of-type(n+1) {
      width: 1em;
      border-right: 1px dashed #CCC;
      border-bottom: 1px dashed #CCC;
    }
    td:last-of-type {
      border-right: 0px;
    }
    tr:nth-last-of-type(2) td {
      border-bottom: 0px;
    }
    .log-td {
      border-left: 1px dotted #CCC;
      &:first-of-type, &:nth-of-type(2) {
        text-align: right;
        font-family: v-mono;
      }
      &:first-of-type {
        border-left: none;
      }
      &:nth-of-type(4) {
        width: 100%;
      }
    }
    .log-extra {
      
    }
  }

  &.expand-log {
    /* change max-height by logMaxHeight */

    /*
    border: 1px dashed #BBB;
    border-width: 0px 1px 0px;
    */
    /*
    th {
      background-color: white;
    }
    */
  }
}

</style>