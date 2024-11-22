<script setup lang="ts">
import { NButton, type ImageRenderToolbarProps } from 'naive-ui';
import { getThumbnailedSize } from './util';
import { RefSymbol } from '@vue/reactivity';


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
}>();

// methods
defineExpose({download});


// refs


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
});



// mounted
onMounted(() => {
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
  await new Promise(r => setTimeout(r, 150));
  imgsrc.value = src;
}

function renderToolbar({ nodes }: ImageRenderToolbarProps) {
  delete nodes.next;
  delete nodes.prev;
  nodes.download = h(NButton, {onClick: download, round:true, textColor:'white', size:'small', style: { marginLeft: '12px' }}, [t('Download')])
  return Object.values(nodes);
}

const outputImageLink = ref<HTMLAnchorElement>();
function download() {
  const a = document.createElement('a');
  a.href = imgsrc.value;
  a.download = props.fileName;
  a.click();
}


</script>

<template>
<n-spin :show="imgloading || props.loading">
  <n-flex justify="center" align="center" :style="spincss">
    <a ref="outputImageLink" :href="imgsrc" @click.left.prevent="" target="_blank" :download="props.fileName" :title="props.fileName" style="line-height:0px;">
      <Transition mode="in-out">
      <n-image
        show-toolbar-tooltip
        :render-toolbar="renderToolbar"
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