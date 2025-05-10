<script setup lang="ts">
import { NTooltip } from 'naive-ui';
import { getThumbnailedSize } from '@/components/util';
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

// refs
const nImageRef = ref();
const testref = ref<any>();

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


const BLANK_IMG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
onBeforeUnmount(() => {
  //console.log('thmub unmounted', imgsrc.value)
  //nImageRef.value?.imageGroupHandle?.setPreviewSrc(BLANK_IMG);
  //nImageRef.value?.imageGroupHandle?.setThumbnailEl(null);

  nImageRef.value?.previewInstRef?.setPreviewSrc(BLANK_IMG);
  //nImageRef.value?.previewInstRef?.setThumbnailEl(null);
  
  // NOTE: *still needs prev image while sliding animation in image-viewer.vue
  //(nImageRef.value?.imageRef || {}).src = BLANK_IMG;

  URL.revokeObjectURL((nImageRef.value?.imageRef || {}).src);
  nImageRef.value = null;
})


/*
onDeactivated()
https://vuejs.org/api/composition-api-lifecycle.html#ondeactivated
​Registers a callback to be called after the component instance is removed from the DOM as part of a tree cached by <KeepAlive>.
*/
const active = ref(true);
onDeactivated(() => {
  //console.log("DEACTIVATED!", props.fileName);
  active.value = false
});
onActivated(() => {
  //console.log("ACTIVATED!", props.fileName);
  active.value = true;
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
watch(() => props.src, (val, prev) => {
  if( !active.value )
    return;
  changeSrc(val);
}, {immediate:true});


// members
defineExpose({
  download,
  openPreview,
  active,
});







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
  //await new Promise(r => setTimeout(r, 150));
  imgsrc.value = src;
  console.log('changeSrc:', imgsrc.value);
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
      <n-flex justify="center" align="center" :style="spincss" style="line-height:0px;">
      <a :href="imgsrc" @click.left.prevent="" target="_blank" :download="props.fileName" :title="props.fileName">
        <Transition mode="in-out">
        <n-image
          ref="nImageRef"
          show-toolbar-tooltip
          @load="imgload"
          @error="imgerror"
          :src="imgsrc"
          v-show="disp"
          :width="twidth" :height="theight"
          style="border:1px solid silver;"
        />
        </Transition>
      </a>
      <n-empty v-if="imgloading || props.loading" />
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