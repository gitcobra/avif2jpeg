<script setup lang="ts">
import { NTooltip } from 'naive-ui';
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
  hidden?: boolean
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
const twidth = ref(props.width || 100);
const theight = ref(props.height || 100);
const disp = ref(false);

const spincss = reactive({
  width: twidth.value + 'px',
  height: theight.value + 'px',
  minWidth: 50 + 'px',
  minHeight: 50 + 'px',
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
  
}

function download() {
  const a = document.createElement('a');
  a.href = imgsrc.value;
  a.download = props.fileName;
  a.click();
}

function openPreview() {
  nImageRef.value?.click();
  /*
  // HACK:
  try {
    nImageRef.value?.previewInstRef?.setPreviewSrc(props.src);
    nImageRef.value?.previewInstRef?.toggleShow(true);
  } catch(e) {
  }
  */
}


</script>

<template>
  <div v-show="!hidden">
  <n-tooltip>
    <template #trigger>
    <n-spin :show="imgloading || props.loading">
      <n-flex justify="center" align="center" :style="spincss">
      <a :href="imgsrc" @click.left.prevent="" target="_blank" :download="props.fileName" :title="props.fileName" style="line-height:0px;">
        <Transition mode="in-out">
        <n-image
          ref="nImageRef"
          show-toolbar-tooltip
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
    {{ props.fileName }}
  </n-tooltip>
  </div>

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