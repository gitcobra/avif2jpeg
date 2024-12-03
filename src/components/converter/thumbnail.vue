<script setup lang="ts">
import { NButton, NIcon, NTooltip, type ImageRenderToolbarProps } from 'naive-ui';
import { getThumbnailedSize } from './util';
import { RefSymbol } from '@vue/reactivity';
import { ArrowBack, ArrowForward, DownloadOutline } from '@vicons/ionicons5';

const { t } = useI18n();

// props
const props = withDefaults(defineProps<{
  src?: string
  width?: number
  height?: number
  maxWidth?: number
  maxHeight?: number
  expand?: boolean
  loading?: boolean
  fileName?: string
  allowNext: boolean
  allowPrev: boolean
}>(), {
  maxWidth: 100,
  maxHeight: 100,
  expand: false,
});

// emits
const emit = defineEmits<{
  'load': [{src: string, width:number, height: number}];
  'error': [src: string];
  'next': []
  'prev': []
}>();

// methods
defineExpose({
  download,
  openPreview,
});

// refs
const nImageRef = ref();

// reactives
const imgloading = ref(true);
const imgsrc = ref('');
const twidth = ref(100);
const theight = ref(100);
const disp = ref(false);

const spincss = reactive({
  width: 100 + 'px',
  height: 100+ 'px',
  minWidth: 50+ 'px',
  minHeight: 50+ 'px',
});

// watchers
watch(props, (value, old) => {
  spincss.width = (props.width || 100) + 'px';
  spincss.height = (props.height || 100) + 'px';
  /*
  spincss.maxWidth = props.maxWidth || 100;
  spincss.maxHeight = props.maxHeight || 100;
  */
});
watch(() => props.src, () => {
  changeSrc(props.src);
}, {immediate:true});


/*
// mounted
onMounted(() => {
  document.body.addEventListener('keydown', onEscKeyDown);
});
onUnmounted(() => {
  document.body.removeEventListener('keydown', onEscKeyDown);
});
*/


// set onload event for the image
async function imgload(ev) {
  const elm = ev.target;
  const width = elm.naturalWidth;
  const height = elm.naturalHeight;
  
  const {width: tw, height:th} = getThumbnailedSize({width, height}, {width:props.maxWidth || 100, height:props.maxHeight || 100}, props.expand);
  twidth.value = tw;
  theight.value = th;
  emit('load', {src:elm.src, width, height});
  imgloading.value = false;
  await new Promise(r => setTimeout(r, 100));
  if( imgloading.value )
    return;
  disp.value = true;
}
function imgerror(ev) {
  const elm = ev.target;
  emit('error', elm.src);
}

async function changeSrc(src: string) {
  imgloading.value = true;
  disp.value = false;
  await new Promise(r => setTimeout(r, 150));
  imgsrc.value = src;
  
  // change previewed image
  // HACK: *these properties are not documented in naive-ui manual.
  // manually set preview src because preview-src attribute doesn't seem to work.
  /*
  try {
    if( nImageRef.value?.previewInstRef?.displayed ) {
      nImageRef.value.previewInstRef.setPreviewSrc(src);
    }
  } catch(e) {
  }
  */
}

/*
function renderToolbar({ nodes }: ImageRenderToolbarProps) {
  // add next and prev buttons manually
  nodes.next = h(NButton, {onClick(){emit('next'); }, disabled:!props.allowNext, circle:true, textColor:'white', size:'tiny', style: { marginLeft: '4px' }}, {icon: () => h(ArrowForward)});
  nodes.prev = h(NButton, {onClick(){emit('prev'); }, disabled:!props.allowPrev, circle:true, textColor:'white', size:'tiny', style: { marginLeft: '4px' }}, {icon: () => h(ArrowBack)});
  
  // NOTE: need to edit download button because the default download button opens the blob url in a new tab instead of downloading.
  // HACK: could not find a proper way to edit the download button (NTooltip didn't work)
  //nodes.download = h(NTooltip, {onClick(){download()}, round:true, textColor:'white', size:'small', style: { marginLeft: '12px' }}, {default: () => t('Download'), trigger: () => h(NButton, {onClick(){download()}, circle:true, textColor:'white', size:'small'}, {icon: () => h(DownloadOutline)})});
  try {
  const dlchilds = (nodes.download.children as any);
  dlchilds.default = () => t('save');
  const icon = dlchilds.trigger();
  icon.props.onClick = download;
  dlchilds.trigger = () => icon;//() => h(NIcon, {component:DownloadOutline, onClick(){download()}, circle:true, textColor:'white', size:'small', style: { marginLeft: '12px' }});
  } catch(e) {}

  return Object.values(nodes);
}
*/

function download() {
  const a = document.createElement('a');
  a.href = imgsrc.value;
  a.download = props.fileName;
  a.click();
}

/*
function onEscKeyDown(ev: KeyboardEvent) {
  if( ev.code !== 'Escape' )
    return;
  
  // HACK: prevent the modal from being closed along with the previewed image when the ESC key is pressed
  try {
    if( nImageRef.value?.previewInstRef?.displayed ) {
      ev.stopPropagation();
      // manually close the preview
      nImageRef.value?.previewInstRef?.toggleShow(false);
    }
  } catch(e) {
  }
}
*/

function openPreview() {
  // HACK
  try {
    nImageRef.value?.previewInstRef?.setPreviewSrc(props.src);
    nImageRef.value?.previewInstRef?.toggleShow(true);
  } catch(e) {
  }
}


</script>

<template>
<n-spin :show="imgloading || props.loading">
  <n-flex justify="center" align="center" :style="spincss">
    <a :href="imgsrc" @click.left.prevent="" target="_blank" :download="props.fileName" :title="props.fileName" style="line-height:0px;">
      <Transition mode="in-out">
      <n-image
        ref="nImageRef"
        show-toolbar-tooltip
        _:render-toolbar="renderToolbar"
        @load="imgload"
        @error="imgerror"
        :src="imgsrc"
        v-show="disp"
        :width="twidth" :height="theight"
        style="border:1px solid silver"
      />
      </Transition>
    </a>
  </n-flex>
</n-spin>
</template>


<style lang="scss" scoped>

.v-enter-active,
.v-leave-active {
  transition: all .2s ease;
}
.v-enter-from, .v-leave-to {
  opacity: 0;
}
</style>