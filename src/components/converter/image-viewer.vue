<script setup lang="ts">
import { ImageRenderToolbarProps, NBadge, NButton, NInput, useDialog, useThemeVars } from 'naive-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getThumbnailedSize, getUnitSize } from './util';
import Thumbnail from './thumbnail.vue';
import { ArrowForward, ArrowBack, Reload, ArrowRedoOutline, ArrowUndoOutline } from '@vicons/ionicons5';



// props

const props = defineProps<{
  url: string
  originalUrl: string
  name: string
  originalName: string
  size: number
  originalSize: number
  length: number
  index?: number
  isSingle: boolean
  variousInfo?: {
    shrinked?: boolean
  }
}>();


// emits
const emit = defineEmits<{
  'demand-image': [index: number]
}>();

// methods
defineExpose({download});

// ref
const thumbConvRef = ref<InstanceType<typeof Thumbnail>>();
const thumbOrgRef = ref<InstanceType<typeof Thumbnail>>();
const nImageGroupRef = ref();

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

const orgwidth = ref(1);
const orgheight = ref(1);

const demandingImage = ref(false);
const thumbloaded = ref(false);
const thumbOrgloaded = ref(false);
const isPreviewingConvertedImg = computed<boolean>(() => nImageGroupRef?.value?.previewInstRef?.previewSrc === src.value);

const allowNext = computed<boolean>(() => index.value < props.length);
const allowPrev = computed<boolean>(() => index.value > 1);


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
    thumbOrgloaded.value = false;
  }, 100);
});

watch(() => props.index, () => {
  let newsrc = '';
  // initializing
  if( props.index === 0 && initializing.value ) {
    initializing.value = false;
    index.value = 1;
    newsrc = props.url;
  }
  // demanded index
  else if( props.index === index.value - 1 ) {
    demandingImage.value = false;
    newsrc = props.url;
  }

  if( newsrc ) {
    // change previewed image
    // HACK: *these properties are not documented in naive-ui manual.
    // manually set preview src because preview-src attribute doesn't seem to work.
    try {
      if( nImageGroupRef.value?.previewInstRef?.displayed ) {
        if( isPreviewingConvertedImg.value )
          nImageGroupRef.value.previewInstRef.setPreviewSrc(newsrc);
        else
          nImageGroupRef.value.previewInstRef.setPreviewSrc(props.originalUrl);
      }
    } catch(e) {
    }

    // update src
    src.value = newsrc;
  }
}, {immediate:true});

let prevUrl = '';
let prevOrgUrl = '';
watch(() => props.url, () => {
  if( props.url !== prevUrl ) {
    const purl = prevUrl;
    const porgurl = prevOrgUrl;
    setTimeout(() => {
      URL.revokeObjectURL(purl);
      URL.revokeObjectURL(porgurl);
    }, 1000);
    prevUrl = props.url;
    prevOrgUrl = props.originalUrl;
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
    //return;
  }
  emit('demand-image', 0);

  document.body.addEventListener('keydown', bindKeys);
  document.body.addEventListener('keydown', onEscKeyDown);
});

onBeforeMount(() => {
  document.body.removeEventListener('keydown', bindKeys);
  document.body.removeEventListener('keydown', onEscKeyDown);
});





// general functions
function onEscKeyDown(ev: KeyboardEvent) {
  if( ev.key !== 'Escape' )
    return;
  
  // HACK: prevent the modal from being closed along with the previewed image when the ESC key is pressed
  try {
    if( nImageGroupRef.value?.previewInstRef?.displayed ) {
      ev.stopPropagation();
      // manually close the preview
      nImageGroupRef.value?.previewInstRef?.toggleShow(false);
    }
  } catch(e) {
  }
}

function bindKeys(ev: KeyboardEvent) {
  switch( ev.key ) {
    case 'ArrowRight':
    case 'PageDown':
      moveIndex(1);
      break;
    case 'ArrowLeft':
    case 'PageUp':
      moveIndex(-1);
      break;
    case 'ArrowUp':
    case 'Home':
      index.value = 1;
      break;
    case 'ArrowDown':
    case 'End':
      index.value = props.length;
      break;
    case ' ':
    case 'Enter':
      switchImage();
      break;
    default:
      return;
  }

  ev.stopPropagation();
  //ev.stopImmediatePropagation();
  if( nImageGroupRef.value?.previewInstRef?.displayed )
    ev.preventDefault();
}

function onThumbnailLoad({width: tw, height: th}) {
  width.value = tw;
  height.value = th;
  thumbloaded.value = true;
  //size.value = tsize;
}
function onOrgThumbnailLoad({width: tw, height: th}) {
  orgwidth.value = tw;
  orgheight.value = th;
  thumbOrgloaded.value = true;
  //size.value = tsize;
}

function download() {
  if( isPreviewingConvertedImg.value )
    thumbConvRef.value.download();
  else
    thumbOrgRef.value.download();
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

function moveIndex(val: number) {
  if( val > 0 && index.value < props.length ) index.value++;
  if( val < 0 && index.value > 1 ) index.value--;
}

function openImage(url: string) {
  window.open(url, '_blank').document.write(`<img src="${url}">`);
}



/*
HACK: switch between Original image and Converted image for preview
*/
let reservedTransform = '';
const switchImage = () => {
  // preserve transform
  reservedTransform = window.getComputedStyle(nImageGroupRef?.value?.previewInstRef?.previewRef)?.transform;
  
  const prev = isPreviewingConvertedImg.value;
  nImageGroupRef?.value?.previewInstRef?.handleSwitchNext?.();
  nextTick(() => {
    if( isPreviewingConvertedImg.value === prev )
      nImageGroupRef?.value?.previewInstRef?.handleSwitchNext?.();
  });
};
// HACK: Image Preview resets its own CSS transform each time it loads an image, so restore them manually
function restoreTransform() {
  try {
    nextTick(() => nImageGroupRef.value.previewInstRef.previewRef.style.transform = reservedTransform);
  } catch(e) {}
}

function renderToolbar({ nodes }: ImageRenderToolbarProps) {
  
  // add button to switch between original and converted
  const switchOrgConv = h(NBadge, {
    color:isPreviewingConvertedImg.value ? 'green' : 'gray',
    offset:[-20, -12],
    value: (isPreviewingConvertedImg.value ? t('status.Converted') : t('status.Original')) + ' ' + index.value,
  }, () => h(NButton, {
    round:true, onClick(){ switchImage() },
    textColor:'white',
    size:'small',
    style: { marginLeft: '4px' },
  }, {icon: () => h(isPreviewingConvertedImg.value ? ArrowRedoOutline : ArrowUndoOutline)}));
  
  // add increasing and decreasing index buttons
  nodes.next = h(NButton, {onClick(){moveIndex(1); }, disabled:!allowNext.value, circle:true, textColor:'white', size:'tiny', style: { marginLeft: '4px' }}, {icon: () => h(ArrowForward)});
  nodes.prev = h(NButton, {onClick(){moveIndex(-1); }, disabled:!allowPrev.value, circle:true, textColor:'white', size:'tiny', style: { marginLeft: '4px' }}, {icon: () => h(ArrowBack)});
  
  // NOTE: need to edit download button because the default download button opens the blob url in a new tab instead of downloading.
  // HACK: could not find a proper way to edit the download button
  try {
  const dlchilds = (nodes.download.children as any);
  dlchilds.default = () => t('save');
  const icon = dlchilds.trigger();
  icon.props.onClick = download;
  dlchilds.trigger = () => icon;//() => h(NIcon, {component:DownloadOutline, onClick(){download()}, circle:true, textColor:'white', size:'small', style: { marginLeft: '12px' }});
  } catch(e) {}

  return [switchOrgConv, ...Object.values(nodes)];
}


</script>

<template>
  <n-spin size="large" :show="initializing">
  <n-flex justify="center" align="center" vertical :style="{visibility: initializing ? 'hidden' : 'visible'}">
    <n-flex align="center" :wrap="false">
      

      
      <!-- output image -->
      <n-image-group
        ref="nImageGroupRef"
        show-toolbar-tooltip
        :render-toolbar="renderToolbar"
        @preview-next="restoreTransform"
      >
      <n-flex align="center" justify="center" :wrap="false">
        
        <!-- ORIGINAL -->
        <n-flex align="center" justify="center" vertical>
          <n-flex align="center" justify="center" :wrap="false" style="font-size:smaller;" class="original-thumb">

            <Thumbnail
              ref="thumbOrgRef"
              :src="originalUrl"
              :width="100"
              :max-width="100"
              :max-height="80"
              :loading="demandingImage"
              :file-name="originalName"
              :allow-next="index < props.length"
              :allow-prev="index > 1"
              @load="onOrgThumbnailLoad"
              @next="moveIndex(1)"
              @prev="moveIndex(-1)"
            />

            <n-space vertical align="center">
              <span style="font-weight: bold; color:gray;">{{ t('status.Original') }}</span>

              <!-- image size -->
              <n-space justify="center" style="white-space:nowrap; font-family:v-mono;">
                {{ String(orgwidth).padStart(4, '&nbsp;') }} × {{ String(orgheight).padStart(4, '&nbsp;') }}
              </n-space>

              <!-- image size -->
              <n-space justify="center">
                {{ getUnitSize(props.originalSize, 0) }}
              </n-space>

            </n-space>
          </n-flex>
        </n-flex>


        <n-flex style="margin:1em;" class="original-thumb">
          <n-icon size="48" color="silver"><ArrowForward/></n-icon>
        </n-flex>
        
        <!-- CONVERTED -->
        <n-flex vertical align="center" justify="center">
          <n-flex align="center" justify="center" :wrap="false">
            <Thumbnail
              ref="thumbConvRef"
              :src="src"
              :width="140"
              :max-width="140"
              :max-height="100"
              :loading="demandingImage"
              :file-name="props.name"
              :allow-next="index < props.length"
              :allow-prev="index > 1"
              @load="onThumbnailLoad"
              @next="moveIndex(1)"
              @prev="moveIndex(-1)"
            />

            <n-flex vertical align="center">
              <n-flex justify="center" align="center" :size="0">
                <span style="font-weight: bold; color:gray;">{{t('status.Converted')}}</span>
              </n-flex>
              <n-flex justify="center" :wrap="true">
                
                <!-- save blobURL -->
                <n-popover v-if="props.url" display-directive="show" trigger="hover" :duration="0" :delay="0">
                  <template #trigger>
                  <a :href="props.url" ref="saveImg" target="_blank" :download="props.name"><n-button round size="tiny">{{$t('save')}}</n-button></a>
                  </template>
                  {{$t('save')}}
                </n-popover>
                
                <!-- open blobURL -->
                <!--
                <n-popover v-if="props.url" display-directive="show" trigger="hover" :duration="0" :delay="0">
                  <template #trigger>
                  <a :href="props.url" target="_blank" @click.prevent="thumbref.openPreview();">
                    <n-button round size="tiny">{{$t('open')}}</n-button>
                  </a>
                  </template>
                  {{$t('convertedImageUrlTooltip')}}
                </n-popover>
                -->
                
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
              
              <!-- image dimension -->
              <n-flex vertical align="center" justify="center" :size="0">
                <n-flex justify="center" style="white-space:nowrap; font-family:v-mono;">
                  <span :style="props.variousInfo?.shrinked ? {color:'blue'} : {}">
                  {{ String(width).padStart(4, ' ') }} × {{ String(height).padStart(4, ' ') }}
                  </span>
                </n-flex>
                <n-flex style="color:gray; font-size:xx-small;">
                  {{ props.variousInfo?.shrinked ? '('+$t('status.Shrinked')+')' : '-'}}
                </n-flex>
              </n-flex>
              

              <!-- image size -->
              <n-flex justify="center">
                {{ getUnitSize(props.size, 0) }}
              </n-flex>
            </n-flex>
          </n-flex>


        </n-flex>
      </n-flex>
      </n-image-group>

    </n-flex>
    

    <!-- file name -->
    <n-flex ref="fileNameContainer" justify="center" style="max-width:320px;" :title="props.name">
      <n-scrollbar :x-scrollable="true" trigger="hover" style="font-size:smaller; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;">{{props.name}}</n-scrollbar>
    </n-flex>

    <!-- index -->
    <n-flex v-if="!isSingle" style="font-family: v-mono;" align="center">
      <!-- <n-input-number v-model:value="index" :autofocus="false" step="1" min="1" :max="props.length" button-placement="both" size="small" style="width:8em;" /> / {{ props.length }} -->
      <span style="font-size:0.8em;">{{t('status.index')}}:</span> {{ index }} / {{ props.length }}
    </n-flex>

    <!-- slider for index -->
    <n-flex v-if="!isSingle" align="center" justify="center">
      <n-button @click="moveIndex(-1)" :disabled="!allowPrev" :circle="true" size="large"><template #icon><n-icon><ArrowBack/></n-icon></template></n-button>
      <n-slider v-model:value="index" :tooltip="false" :step="1" :min="1" :max="props.length" style="width:180px;" />
      <n-button @click="moveIndex(1)" :disabled="!allowNext" :circle="true" size="large"><template #icon><n-icon><ArrowForward/></n-icon></template></n-button>
    </n-flex>

  </n-flex>
  </n-spin>
</template>

<style lang="scss" scoped>
@media screen and (max-width: 570px) {
	.original-thumb * {
    display: none;
  }
}
</style>