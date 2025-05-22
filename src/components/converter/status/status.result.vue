<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { NIcon, NSpin, useThemeVars } from 'naive-ui';
import { Archive, DocumentTextOutline, DownloadOutline, WarningOutline, ImageSharp, Warning } from '@vicons/ionicons5';
import { getUnitSize } from '@/components/util';

// common components
const dialog = useDialog();
const { t } = useI18n();
const c = useThemeVars();

// props
const props = defineProps<{
  processing: boolean
  listLength: number
  zippingFlag: boolean;
  
  converted: number
  success: number
  zippedTotalCount: number
  zippedTotalSize: number

  baseZipName: string;
  zips: { url:string, size:number, count:number }[]; // count: file count

  unconvertedListText: string
  unconvertedFileCount: number
  unconvertedTotalSize: number
  failedZips: { url:string, size:number, count:number }[]
  failedZipDone: boolean
  failedToCreateFailedZip: boolean
  failedFileZippedCount: number

  imgUrl: string;
  imgName: string;
  type: string;
}>();

// emits
const emit = defineEmits<{
  'all-zips-clicked': []
  'demand-zip-errors': []
}>();



// element refs
//const singleImageLink = ref();

// reactive value
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

const autoPopoverErrorButtonFlag = ref(undefined);


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
    label: `${t('status.zipFailedList')}` + (props.failedZipDone ? `(✔${t('status.done')})` : ``),
    icon: () =>  h(NSpin, {show: demandedFailedZips.value && !props.failedZipDone, size:'small'}, () => h(NIcon, () => h(Archive))),
    disabled: demandedFailedZips.value,
    onSelect(ev) {
      demandedFailedZips.value = true;
      emit('demand-zip-errors');
      return false;
    }
  }
]);





watch([() => props.zips.length, () => props.failedZips.length], () => {
  // update zip list
  {
    if( zipList.value.length > props.zips.length )
      zipList.value.length = 0;//s.zips.length;
    
    let size = 0;
    const singlar = props.zips.length === 1 && props.zippedTotalCount === props.listLength;
    for( let i = zipList.value.length; i < props.zips.length; i++ ) {
      const item = props.zips[i];
      const name = props.baseZipName + ( singlar ? '' : '-' + String(i + 1).padStart(2, '0') ) + '.zip';
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
    if( failedZipList.value.length > props.failedZips.length )
      failedZipList.value.length = 0;
    let size = 0;
    const singlar = props.failedZipDone && props.failedZips.length === 1;
    for( let i = failedZipList.value.length; i < props.failedZips.length; i++ ) {
      const item = props.failedZips[i];
      const name = props.baseZipName + '-error' + ( singlar ? '' : '-' + String(i + 1).padStart(2, '0') ) + '.zip';
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

async function onSaveButtonClick(ev: MouseEvent) {
  if( props.zippingFlag ) {
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
  /*
  else {
    //imageViewer.value.download();
    //singleImageLink.value?.click();
  }
  */
}







function createFailedFileLink(download = false) {
  const blob = new Blob([props.unconvertedListText], {type: 'text/plain;charset=utf8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  if( download )
    a.download = props.baseZipName + '-error.txt';
  a.click();
}

</script>












<template>
<n-collapse-item name="output" style="white-space:nowrap;" disabled>
  <template #header>
    <span style="color:black;" v-html="$t('status.Output')" />
  </template>

  <n-flex :wrap="false" vertical style="margin-top: -1.3em">
  <n-flex justify="center">
    
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
            :indicator-text-color="props.zippedTotalCount === listLength ? 'white' : 'green'"
            :processing="props.processing"
            :percentage="props.zippedTotalCount / listLength * 100 |0"
            style="width:300px; font-weight: bold; font-family: v-mono;"
          >
            <span style="margin:1px;">{{props.zippedTotalCount/listLength*100|0}}% {{$t('status.zippingProgress')}} ({{ props.zippedTotalCount }}/{{ props.converted }})</span>
          </n-progress>
        </template>
        {{$t('status.zippingProgress')}} ({{ props.zippedTotalCount / props.listLength*100|0 }}%)
      </n-popover>

      <!-- converted zips -->
      <transition-group name="zips" v-if="zipList.length >= 2 || props.processing" class="zip-buttons-parent" tag="div">
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

    </n-flex>


  </n-flex>







  <!-- result -->
  <Transition>
  <n-flex v-show="!props.processing" justify="center" align="center">

    <!-- save button -->
    <n-popover trigger="hover" :duration="0" :delay="0" placement="left" :style="{color:'white', backgroundColor:c.successColor}" :arrow-style="{backgroundColor:c.successColor}">
      <template #trigger>
        <Transition name="save">
        <span v-if="success > 0" style="position:relative;">
          <n-badge :value="zippingFlag ? props.zippedTotalCount.toLocaleString('en-us') : props.type.replace(/\(.+\)/, '')" :color="c.successColorHover" :offset="[-20,-3]">
            <n-button v-if="zippingFlag" size="medium" @click="onSaveButtonClick" :color="c.successColor" round>
              <a v-if="zipList.length" :href="zipList[0].url" :download="zipList[0].name" class="in-button-anchor" @click.prevent>
                <Zipicon/> × {{ zipList.length }}
                {{$t('status.saveAll')}}
              </a>
            </n-button>
            <a v-else :href="props.imgUrl" :download="props.imgName" class="in-button-anchor">
              <n-button size="medium" :color="c.successColor" round>
                <n-icon size="tiny" :component="ImageSharp"/>
                {{$t('save')}}
              </n-button>
            </a>
          </n-badge>
        </span>
        </Transition>
      </template>
      <template #default>
        <template v-if="props.listLength >= 2">
          <div>{{t('success')}}: {{zippedTotalCount.toLocaleString()}}</div>
          <div>{{t('status.totalSize')}}: {{getUnitSize(props.zippedTotalSize)}}</div>
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
      v-if="!props.processing && !(props.success === listLength)"
      :options="PopSelectErrorItems"
      @select="(k, opt) => PopSelectErrorItems.find(({key}) => k === key)?.onSelect()"
      :show-arrow="true"
      trigger="click"
      size="small"
      placement="bottom-start"
    >
      <n-popover :show="autoPopoverErrorButtonFlag" :duration="0" :delay="0" placement="right" :style="{color:'white', backgroundColor:c.errorColor}" :arrow-style="{backgroundColor:c.errorColor}">
        <template #trigger>
          <n-badge :value="props.unconvertedFileCount.toLocaleString()" :color="c.errorColorHover" :offset="[-0,-3]">
          <n-button size="small" :color="c.errorColor">
            <n-icon size="medium" style="vertical-align: middle;" :component="WarningOutline" />
          </n-button>
          </n-badge>
        </template>
        <div>
          <div>{{t('failed')}}: {{props.unconvertedFileCount.toLocaleString()}}</div>
          <div>{{t('status.totalSize')}}: {{getUnitSize(props.unconvertedTotalSize)}}</div>
        </div>
      </n-popover>
    </n-dropdown>
    
  </n-flex>
  </Transition>

  




  <!-- zipping progress for failed files -->
  <transition name="zipcontainer">
  <n-flex v-show="demandedFailedZips" vertical align="center">
    
    <n-popover placement="left">
      <template #trigger>
        <n-progress
          type="line"
          indicator-placement="inside"
          color="red"
          rail-color="rgba(255, 0, 0, 0.5)"
          :indicator-text-color="props.failedFileZippedCount === props.unconvertedFileCount ? 'white' : '#500'"
          :processing="demandedFailedZips && !props.failedZipDone && !props.failedToCreateFailedZip"
          :percentage="props.failedFileZippedCount / props.unconvertedFileCount * 100 |0"
          style="width:300px; font-weight: bold; font-family: v-mono;"
        >
          <span v-if="!props.failedToCreateFailedZip" style="margin:1px;">{{props.failedFileZippedCount/props.unconvertedFileCount*100|0}}% {{$t('status.zipped')}} ({{ props.failedFileZippedCount }}/{{ props.unconvertedFileCount }})</span>
          <div v-else :style="{color: c.errorColor}">{{ $t('status.failureZippingFailedFiles') }}</div>
        </n-progress>
      </template>
      {{$t('status.zippingProgress')}} ({{ props.failedFileZippedCount/props.unconvertedFileCount*100|0 }}%)
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
              <n-icon size="tiny" :component="Warning"/>ZIP{{item.number || ''}}
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
</template>




<style lang="scss" scoped>


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
