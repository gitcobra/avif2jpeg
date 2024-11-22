<script setup lang="ts">
import { NInput, useDialog, useThemeVars } from 'naive-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getThumbnailedSize, getUnitSize } from './util';
import Thumbnail from './thumbnail.vue';



// props

const props = defineProps<{
  url: string
  dataUrl: string
  name: string
  size: number
  length: number
  index: number
  isSingle: boolean
}>();


// emits
const emit = defineEmits<{
  'demand-image': [index: number]
}>();

// methods
defineExpose({download});

// ref
const thumbref = ref<InstanceType<typeof Thumbnail>>();

// common components

const dialog = useDialog();
const { t } = useI18n();
const c = useThemeVars();


// reactive values
const initializing = ref(true);
const index = ref(1);
const width = ref(1);
const height = ref(1);
const size = ref(0);
const src = ref('');
const demandingImage = ref(false);
let thumbloaded = ref(false);


// watchers
let timeoutid: any = -1;
watch(index, () => {
  if( index.value < 1 || index.value > props.length )
    return;
  clearTimeout(timeoutid);
  timeoutid = setTimeout(() => {
    if( props.index === index.value - 1 )
      return;
    emit('demand-image', index.value - 1);
    demandingImage.value = true;
    thumbloaded.value = false;
  }, 100);
});

watch(() => props.index, () => {
  if( props.index === 0 && initializing.value ) {
    initializing.value = false;
    index.value = 1;
    src.value = props.url;
    return;
  }
  if( props.index === index.value - 1 ) {
    demandingImage.value = false;
    src.value = props.url;
  }
});

let prevUrl = '';
watch(() => props.url, () => {
  if( props.url !== prevUrl ) {
    const purl = prevUrl;
    setTimeout(() => URL.revokeObjectURL(purl), 1000);
    prevUrl = props.url;
  }
  if( props.isSingle ) {
    initializing.value = false;
    src.value = props.url;
  }
});


// mounted
onMounted(() => {
  if( props.isSingle ) {
    //initializing.value = false;
    return;
  }
  emit('demand-image', 0);
});





// general functions
function onThumbnailLoad({width: tw, height: th}) {
  width.value = tw;
  height.value = th;
  thumbloaded.value = true;
  //size.value = tsize;
}

function download() {
  thumbref.value.download();
}

async function copyDataURL(url: string) {
  try {
    const durl = await fetch(url).then((res) => res.blob()).then((blob) => {
      return new Promise(resolve => {
        const reader = new FileReader;
        reader.onload = resolve;
        reader.readAsDataURL(blob);
      });
    }).then((ev:any) => ev.target.result);
    
    navigator.clipboard.writeText(durl);

    dialog.info({
      title: t('copiedDataURLDialogTitle'),
      content: () => h('div', [h('div', t('copiedDataURLMessage')), /*h(NInput, {type:'textarea', value:durl, readonly:true, size:'small'})*/]),
      positiveText: 'OK',
    });
  } catch(e) {
    console.error(e);
    dialog.error({
      title: 'failed to copy Data URL',
      content: 'could not copy Data URL',
      positiveText: 'OK',
    });
  }
}

function openImage(url: string) {
  window.open(url, '_blank').document.write(`<img src="${url}">`);
}
</script>

<template>
  <n-spin size="large" :show="initializing">
  <n-flex justify="center" align="center" vertical :style="{visibility: initializing ? 'hidden' : 'visible'}">
    <n-flex align="center" :wrap="false">
      <!-- output image -->
      <n-flex align="center" justify="center" vertical>
        <n-spin size="small" :show="false" :_show="demandingImage || !thumbloaded">
        <!-- <a ref="outputImageLink" :href="props.url" target="_blank" :download="props.name" :title="props.name" style="line-height:0px;"> -->
          <Thumbnail
            ref="thumbref"
            :src="src"
            :width="180"
            :max-width="160"
            :max-height="100"
            :loading="demandingImage"
            :file-name="props.name"
            @load="onThumbnailLoad"
            @next="index++"
          />
        <!-- </a> -->
        </n-spin>
      </n-flex>
      
      <n-flex vertical>
        <n-flex justify="center" :wrap="false">
          <!-- open blobURL -->
          <n-popover v-if="props.url" display-directive="show" trigger="hover" :duration="0" :delay="0">
            <template #trigger>
            <a :href="props.url" target="_blank"><n-button round size="tiny">{{$t('open')}}</n-button></a>
            </template>
            {{$t('convertedImageUrlTooltip')}}
          </n-popover>

          <!-- save blobURL -->
          <n-popover v-if="props.url && !isSingle" display-directive="show" trigger="hover" :duration="0" :delay="0">
            <template #trigger>
            <a :href="props.url" ref="saveImg" target="_blank" :download="props.name"><n-button round size="tiny">{{$t('save')}}</n-button></a>
            </template>
            {{$t('save')}}
          </n-popover>
          
          <!-- copy data url -->
          <n-popover v-if="props.url" display-directive="show" trigger="hover" :duration="0" :delay="0">
            <template #trigger>
            <a :href="props.url" target="_self">
              <n-button @click.left.prevent.stop="copyDataURL(props.url)" round size="tiny">DataURL</n-button>
            </a>
            </template>
            {{$t('convertedImageDataUrlTooltip')}}
          </n-popover>
        </n-flex>
        
        <!-- image size -->
        <n-flex justify="center">
          {{ width }} × {{ height }}
        </n-flex>

        <!-- image size -->
        <n-flex justify="center">
          {{ getUnitSize(props.size, 0) }}
        </n-flex>

      </n-flex>

    </n-flex>

    <!-- slider for index -->
    <n-flex v-if="!isSingle" align="center" justify="center">
      <n-slider v-model:value="index" :tooltip="false" :step="1" :min="1" :max="props.length" style="width:180px;" />

      <!-- index -->
      <n-flex style="font-family: v-mono;" align="center">
        <n-input-number v-model:value="index" step="1" min="1" :max="props.length" button-placement="both" size="small" style="width:8em;" /> / {{ props.length }}
      </n-flex>
    </n-flex>

    <!-- file name -->
    <n-flex ref="fileNameContainer" justify="center" style="max-width:320px;" :title="props.name">
      <n-scrollbar :x-scrollable="true" trigger="hover" style="font-size:smaller; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;">{{props.name}}</n-scrollbar>
    </n-flex>

  </n-flex>
  </n-spin>
</template>

