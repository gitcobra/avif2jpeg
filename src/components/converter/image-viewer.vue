<script setup lang="ts">
import { ImageRenderToolbarProps, NBadge, NButton, NInput, useDialog, useThemeVars } from 'naive-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getThumbnailedSize, getUnitSize } from './util';
import Thumbnail from './thumbnail.vue';
import { ArrowForward, ArrowBack, ArrowRedoOutline, ArrowUndoOutline, ChevronForward, ChevronBack, Close } from '@vicons/ionicons5';
import { title } from 'process';



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
  'close': []
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
const index = ref(Math.max(props.index, 0) + 1);
const width = ref(1);
const height = ref(1);
const src = ref('');

const orgwidth = ref(1);
const orgheight = ref(1);

const demandingImage = ref(false);
const thumbloaded = ref(false);
const thumbOrgloaded = ref(false);
const isPreviewingConvertedImg = computed<boolean>(() => nImageGroupRef?.value?.previewInstRef?.previewSrc === src.value);

const allowNext = computed<boolean>(() => index.value < props.length);
const allowPrev = computed<boolean>(() => index.value > 1);



// mounted
onMounted(() => {
  document.body.addEventListener('keydown', bindKeys);
  document.body.addEventListener('keydown', onEscKeyDown);

  if( props.url && props.index >= 0 ) {
    initializing.value = false;
    src.value = props.url;
    return;
  }
  emit('demand-image', index.value - 1);
});

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

// get demanded image src
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

    const select = (ev: any) => {ev.target.focus(); ev.target.select()};
    dialog.info({
      title: t('copiedDataURLDialogTitle'),
      content: () => h('div', [h('div', t('copiedDataURLMessage')), h(NInput, {onFocus: select, onClick: select, type:'textarea', value:durl, readonly:true, size:'small', style:{marginTop:'2em'}})]),
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
  <n-spin size="large" :show="initializing" class="body">
  <n-image-group
    ref="nImageGroupRef"
    show-toolbar-tooltip
    :render-toolbar="renderToolbar"
    @preview-next="restoreTransform"
  >
  <n-flex justify="center" align="center" vertical :style="{visibility: initializing ? 'hidden' : 'visible'}">
    <n-flex :wrap="false" align="center">
      <!-- left button -->
      <n-button @click="moveIndex(-1)" :disabled="!allowPrev" block style="max-width: 1em; height:10em;" :class="{pale: !allowPrev}" :title="$t('Prev')">
        <template #icon><n-icon size="30"><ChevronBack/></n-icon></template>
      </n-button>

      <n-flex vertical>
        <n-flex align="center" :wrap="false">
          <n-flex vertical align="center" style="overflow: hidden;">
            
            <!-- index -->
            <n-flex v-if="!isSingle" style="white-space: nowrap;" align="center" :wrap="false">
              <span style="font-size: smaller;">{{t('status.index')}}:</span>
              <span style="font-family: v-mono; font-size: smaller;">{{ index }} / {{ props.length }}</span>
            </n-flex>
            
            <n-flex align="center" justify="center" :wrap="false">
              <!-- ORIGINAL -->
              <n-flex align="center" justify="center" vertical>
                <a :href="originalUrl" @click.prevent="thumbOrgRef.openPreview();" :download="originalName" :title="originalName">
                <n-flex align="center" justify="center" :wrap="false" style="" class="original-thumb">

                  <Thumbnail
                    ref="thumbOrgRef"
                    :src="originalUrl"
                    :width="1"
                    :max-width="1"
                    :max-height="1"
                    :loading="demandingImage"
                    :file-name="originalName"
                    :allow-next="index < props.length"
                    :allow-prev="index > 1"
                    @load="onOrgThumbnailLoad"
                    @next="moveIndex(1)"
                    @prev="moveIndex(-1)"
                    :hidden="true"
                  />

                  <n-space vertical align="center">                    
                    <span style="font-weight: bold; color:gray;">{{ t('status.Original') }}</span>

                    <!-- image size -->
                    <n-space justify="center" style="font-size:smaller; white-space:nowrap; font-family:v-mono; width:10em;">
                      {{ String(orgwidth).padStart(5, '&nbsp;') }} × {{ String(orgheight).padStart(5, '&nbsp;') }}
                    </n-space>

                    <!-- image size -->
                    <n-space justify="center">
                      {{ getUnitSize(props.originalSize, 0) }}
                    </n-space>

                  </n-space>
                </n-flex>
                </a>
              </n-flex>


              <n-flex style="margin:1em;" class="original-thumb">
                <n-icon size="20" color="silver"><ArrowForward/></n-icon>
              </n-flex>
              
              <!-- CONVERTED -->
              <a :href="src" @click.prevent="thumbConvRef.openPreview();" :download="props.name" :title="props.name">
              <n-flex vertical align="center" justify="center">
                <n-flex justify="center" align="center" :size="0">
                  <span style="font-weight: bold; color:gray;">{{t('status.Converted')}}</span>
                </n-flex>
                
                <!-- image dimension -->
                <n-flex vertical align="center" justify="center" :size="0">
                  <n-flex justify="center" style="font-size:smaller; white-space:nowrap; font-family:v-mono; width:10em;">
                    <span :style="props.variousInfo?.shrinked ? {color:'blue'} : {}">
                    {{ String(width).padStart(5, '&nbsp;') }} × {{ String(height).padStart(5, '&nbsp;') }}
                    </span>
                  </n-flex>
                  <!--
                  <n-flex style="color:gray; font-size:xx-small;">
                    {{ props.variousInfo?.shrinked ? '('+$t('status.Shrinked')+')' : '-'}}
                  </n-flex>
                  -->
                </n-flex>
                

                <!-- image size -->
                <n-flex justify="center">
                  {{ getUnitSize(props.size, 0) }}
                </n-flex>
              </n-flex>
              </a>
            </n-flex>

            <!-- file name -->
            <n-flex ref="fileNameContainer" align="center" class="pathbox" :title="props.name">
              <n-scrollbar :x-scrollable="true" trigger="hover" style="font-size:smaller; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;">
                {{props.name}}
              </n-scrollbar>
            </n-flex>

          </n-flex>

          <n-flex vertical>
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
            <n-flex justify="center" :wrap="true">
              
              <!-- save blobURL -->
              <n-popover v-if="props.url" display-directive="show" trigger="hover" :duration="0" :delay="0">
                <template #trigger>
                <a :href="props.url" ref="saveImg" target="_blank" :download="props.name">
                  <n-button round size="tiny">{{$t('save')}}</n-button>
                </a>
                </template>
                {{$t('save')}}
              </n-popover>
              
              <!-- copy data url -->
              <n-popover v-if="props.url" display-directive="show" trigger="hover" :duration="0" :delay="0">
                <template #trigger>
                <n-button @click="copyDataURL(props.url)" round size="tiny">DataURL</n-button>
                </template>
                {{$t('convertedImageDataUrlTooltip')}}
              </n-popover>
            </n-flex>
          </n-flex>

        </n-flex>

        <!-- slider for index -->
        <n-flex v-if="!isSingle" align="center" justify="center" style="padding: 0px 1em;">
          <n-slider v-model:value="index" :tooltip="false" :step="1" :min="1" :max="props.length"/>
        </n-flex>
      </n-flex> 

      <!-- right button -->
      <n-button @click="moveIndex(1)" :disabled="!allowNext" block style="max-width: 1em; height:9em;" :class="{pale: !allowNext}" :title="$t('Next')">
        <template #icon><n-icon size="30"><ChevronForward/></n-icon></template>
      </n-button>
    </n-flex>
  

  </n-flex>

  <!-- close button -->
  <n-button @click="emit('close');" circle size="tiny" color="silver" style="position: absolute; right:-16px; top:-8px; opacity: 0.7;" :title="$t('close')">
    <template #icon><n-icon size="12"><Close/></n-icon></template>
  </n-button>

  </n-image-group>
  </n-spin>
</template>

<style lang="scss" scoped>
a {
  color: black;
}
.body {
  font-size: small;
}
.pathbox {
  max-width: 250px;
  font-size: smaller; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;
}
@media screen and (max-width: 570px) {
	.original-thumb * {
    display: none;
  }
  .pathbox {
    max-width: 100px;
  }
}

.pale {
  opacity: 0.2;
}
</style>