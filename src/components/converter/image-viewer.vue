<script setup lang="ts">
import { ImageRenderToolbarProps, NBadge, NButton, NInput, useDialog, useThemeVars } from 'naive-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getThumbnailedSize, getUnitSize } from './util';
import Thumbnail from './thumbnail.vue';
import { ArrowForward, ArrowBack, ArrowRedoOutline, ArrowUndoOutline, ChevronForward, ChevronBack, Close } from '@vicons/ionicons5';
import { title } from 'process';
import { RefSymbol } from '@vue/reactivity';



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
defineExpose({
  download,
  cleanup,
});



// common components

const dialog = useDialog();
const { t } = useI18n();
const c = useThemeVars();


// ref
/*
Accessing the Refs
https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs
To obtain the reference with Composition API, we can use the useTemplateRef() helper
*/
const thumbConvRef = ref();
const thumbOrgRef = ref();
const nImageGroupRef = ref();
const viewerItemContainer = useTemplateRef('viewerItemContainer');;

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

const viewerTransitionName = ref<'viewer-item-init' | 'viewer-item-next' | 'viewer-item-prev'>('viewer-item-init');
const viewTransKey = ref(0);
const viewerItemVisibility = ref(true);
const vItemContainerStyle = ref({width: 'auto', height: 'auto'});

const unmounted = ref(false);


// mounted
onMounted(() => {
  document.body.addEventListener('keydown', bindKeys);
  document.body.addEventListener('keydown', onEscKeyDown);

  /*
  if( props.url && props.index >= 0 ) {
    initializing.value = false;
    src.value = props.url;
    return;
  }
  */
  demandImage(index.value - 1);
  
  setTouchEvents();
});

onBeforeUnmount(() => {
  clearTimeout(timeoutid);
  document.body.removeEventListener('keydown', bindKeys);
  document.body.removeEventListener('keydown', onEscKeyDown);
  unmounted.value = true;
});
onUnmounted(() => {
  URL.revokeObjectURL(props.url);
  URL.revokeObjectURL(props.originalUrl);
});


// watchers
let timeoutid: any = -1;
watch(index, (val, prev) => {
  if( index.value < 1 || index.value > props.length )
    return;
  clearTimeout(timeoutid);
  
  if( val > prev )
    viewerTransitionName.value = 'viewer-item-next';
  else
    viewerTransitionName.value = 'viewer-item-prev';
  
  console.log(viewerTransitionName.value);
  viewTransKey.value = initializing.value ? viewTransKey.value : ~viewTransKey.value;

  timeoutid = setTimeout(() => {
    if( props.index === index.value - 1 )
      return;
    
    /*
    const { clientWidth: w, clientHeight: h } = viewerItemContainer.value.$el;
    vItemContainerStyle.value = { width: w + 'px', height: h + 'px' };
    nextTick(() => viewerItemVisibility.value = false);
    */
    
    viewerItemVisibility.value = false
    demandImage(index.value - 1);
  }, 50);
});

let prevUrl = '';
let prevOrgUrl = '';
// get demanded image src
//watch(() => props.index, () => {
watch(() => props.url, () => {
  let newsrc = '';
  // initializing
  if( props.index === 0 && initializing.value ) {
    initializing.value = false;
    index.value = 1;
    newsrc = props.url;
  }
  // demanded index
  else if( props.index === index.value - 1 ) {
    initializing.value = false;
    demandingImage.value = false;
    newsrc = props.url;
  }
  // dipose when it is not demanded image
  else {
    URL.revokeObjectURL(props.url);
    URL.revokeObjectURL(props.originalUrl);
  }

    const purl = prevUrl;
    const porgurl = prevOrgUrl;
    //setTimeout(() => {
      URL.revokeObjectURL(purl);
      URL.revokeObjectURL(porgurl);
    //}, 0);
    prevUrl = props.url;
    prevOrgUrl = props.originalUrl;

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












// general functions

function demandImage(index: number) {
  demandingImage.value = true;
  thumbloaded.value = false;
  thumbOrgloaded.value = false;
  
  nextTick(() => emit('demand-image', index));
}

// set touch event listener
function setTouchEvents() {
  let el = viewerItemContainer.value.$el;
  let startX = 0, startY = 0;
  let endX = 0, endY = 0;
  let lastMoveTime = 0;
  
  const tstart = (ev) => {
    startX = ev.touches[0].pageX;
    startY = ev.touches[0].pageY;
    lastMoveTime = Date.now();
  };
  el.addEventListener('touchstart', tstart);

  const tmove = (ev) => {
    endX = ev.touches[0].pageX;
    endY = ev.touches[0].pageY;
    checkDelay();
  };
  window.addEventListener('touchmove', tmove);

  const tend = () => {
    checkDelay();
    const dx = endX - startX;
    const adx = Math.abs(dx);
    const dy = endY - startY;
    const ady = Math.abs(dy);
    if( adx < ady || adx < 20 )
      return;
    
    moveIndex(dx > 0 ? -1 : 1);
  };
  window.addEventListener('touchend', tend);

  // reset start position if touchmove doesn't fire for a certain time
  const checkDelay = () => {
    const now = Date.now();
    if( now - lastMoveTime > 500 ) {
      startX = endX;
      startY = endY;
    }
    lastMoveTime = now;
  };

  onBeforeUnmount(() => {
    el.removeEventListener('touchstart', tstart);
    window.removeEventListener('touchmove', tmove);
    window.removeEventListener('touchend', tend);
    el = null;
  });
}

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
    case 'ArrowDown':
      moveIndex(1);
      break;
    case 'ArrowLeft':
    case 'PageUp':
    case 'ArrowUp':
      moveIndex(-1);
      break;
    case 'Home':
      index.value = 1;
      break;
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
      content: () => h('div', [h('div', t('copiedDataURLMessage')), h(NInput, {onFocus: select, onClick: select, type:'textarea', value:durl, readonly:true, size:'small', style:{marginTop:'2em', fontSize:'x-small'}})]),
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
  if( val > 0 && index.value < props.length ) {
    index.value++;
  }
  else if( val < 0 && index.value > 1 ) {
    index.value--;
  }
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





function openPreview() {
  //thumbConvRef.value.test();
  
  thumbConvRef.value.openPreview();
}

//const body = useTemplateRef('body');
function cleanup() {
  //body.value.$el.innerHTML = '';
}

</script>

<template>
  <n-flex justify="center" align="center" vertical :style="{visibility: initializing ? 'hidden' : 'visible'}" class="body" ref="body">
  <n-image-group
    ref="nImageGroupRef"
    show-toolbar-tooltip
    :render-toolbar="renderToolbar"
    @preview-next="restoreTransform"
  >
  

    <n-flex :wrap="false" align="center" justify="center">
      <!-- left button -->
      <n-button @click="moveIndex(-1)" :disabled="!allowPrev" block :class="{'thumb-arrow':true, pale: !allowPrev}" :title="$t('Prev')">
        <template #icon><n-icon size="30"><ChevronBack/></n-icon></template>
      </n-button>

      <n-flex justify="center" ref="viewerItemContainer" class="viewer-item-container">
        <transition :name="viewerTransitionName">
        
        <n-flex vertical :key="viewTransKey" _v-show="viewerItemVisibility">
          <n-flex align="center" :wrap="false">
            <n-flex vertical align="center">
              
              <n-flex align="center" justify="center" :wrap="false">
                <!-- ORIGINAL -->
                <n-flex align="center" justify="center" vertical class="original-thumb">
                  <a :href="originalUrl" @click.prevent="thumbOrgRef.openPreview();" :download="originalName" :title="originalName" class="imglink">
                  <n-flex align="center" justify="center" :wrap="false">

                    <Thumbnail
                      :ref="(el: any) => {if( el?.active ) thumbOrgRef = el}"
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

                    <n-flex vertical align="center">                    
                      <n-flex class="imglink-label">{{ t('status.Original') }}</n-flex>

                      <!-- image dimension -->
                      <n-flex justify="center" class="img-size" :wrap="false">
                        <span class="left-num">{{ !thumbOrgloaded ? '?' : orgwidth }}</span>
                        ×
                        <span class="right-num">{{ !thumbOrgloaded ? '?' : orgheight }}</span>
                      </n-flex>

                      <!-- image size -->
                      <n-flex justify="center">
                        <n-flex v-once="viewerItemVisibility">
                        {{ !thumbOrgloaded ? '?' : getUnitSize(props.originalSize, 0) }}
                        </n-flex>
                      </n-flex>

                    </n-flex>
                  </n-flex>
                  </a>
                </n-flex>


                <n-flex style="margin:1em;" class="original-thumb">
                  <n-icon size="20" color="silver"><ArrowForward/></n-icon>
                </n-flex>
                
                <!-- CONVERTED -->
                <a :href="src" @click.prevent="openPreview()" :download="props.name" :title="props.name" class="imglink">
                <n-flex vertical align="center" justify="center">
                  <n-flex class="imglink-label">{{t('status.Converted')}}</n-flex>
                  
                  <!-- image dimension -->
                  <n-flex vertical align="center" justify="center" :size="0">
                    <n-flex justify="center">
                      <n-flex :wrap="false" :style="props.variousInfo?.shrinked ? {color:'blue'} : {}" class="img-size">
                      <span class="left-num">{{ !thumbloaded ? '?' : width }}</span>
                      ×
                      <span class="right-num">{{ !thumbloaded ? '?' : height }}</span>
                      </n-flex>
                    </n-flex>
                    <!--
                    <n-flex style="color:gray; font-size:xx-small;">
                      {{ props.variousInfo?.shrinked ? '('+$t('status.Shrinked')+')' : '-'}}
                    </n-flex>
                    -->
                  </n-flex>
                  

                  <!-- image size -->
                  <n-flex justify="center">
                    {{ !thumbloaded ? '?' : getUnitSize(props.size, 0) }}
                  </n-flex>
                </n-flex>
                </a>
              </n-flex>

              <!-- file name -->
              <n-flex ref="fileNameContainer" align="center" class="pathbox" :title="props.name">
                <n-scrollbar :x-scrollable="true" trigger="hover" style="font-size:smaller; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;">
                  {{ !thumbloaded ? '?' : props.name }}
                </n-scrollbar>
              </n-flex>

            </n-flex>
            <n-flex vertical>
              <Thumbnail
                :ref="(el: any) => {if( el?.active ) thumbConvRef = el}"
                :src="src"
                :width="142"
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
                <n-popover display-directive="show" trigger="hover" :duration="0" :delay="0">
                  <template #trigger>
                  <a :href="props.url" ref="saveImg" target="_blank" :download="props.name">
                    <n-button :disabled="!thumbloaded" round size="tiny">{{$t('save')}}</n-button>
                  </a>
                  </template>
                  {{$t('save')}}
                </n-popover>
                
                <!-- copy data url -->
                <n-popover display-directive="show" trigger="hover" :duration="0" :delay="0">
                  <template #trigger>
                    <n-button :disabled="!thumbloaded" @click="copyDataURL(props.url)" round size="tiny">DataURL</n-button>
                  </template>
                  {{$t('convertedImageDataUrlTooltip')}}
                </n-popover>
              </n-flex>
            </n-flex>

          </n-flex>
        
        </n-flex>

        
        </transition>
      </n-flex>

      <!-- right button -->
      <n-button @click="moveIndex(1)" :disabled="!allowNext" block :class="{'thumb-arrow':true, next:true, pale: !allowNext}" :title="$t('Next')">
        <template #icon><n-icon size="30"><ChevronForward/></n-icon></template>
      </n-button>
    </n-flex>

        
    <n-flex v-show="!isSingle" style="width:100%;" :wrap="false">
      <!-- slider for index -->
      <n-slider v-model:value="index" :tooltip="false" :step="1" :min="1" :max="props.length" @keydown.prevent.stop class="index-slider" />
      
      <!-- index -->
      <n-flex class="index" align="center" justify="center" :wrap="false" :size="3">
        <n-flex>{{t('status.index')}}:</n-flex>
        <n-flex justify="end" align="center" class="counter">{{ index }}</n-flex>
        <n-flex>/</n-flex>
        <n-flex justify="start" align="center" class="counter">{{ props.length }}</n-flex>
      </n-flex>
    </n-flex>
  
    <!-- close button -->
    <n-button @click="emit('close');" circle size="tiny" color="silver" class="close-button" :title="$t('close')">
      <template #icon><n-icon size="12"><Close/></n-icon></template>
    </n-button>

  </n-image-group>
  </n-flex>

</template>

<style lang="scss" scoped>
.body {
  font-size: small;
  
  position: relative;
}
a {
  color: black;
}
.pathbox {
  max-width: 250px;
  font-size: smaller; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;
}

.thumb-arrow {
  color: gray;
  max-width: 1.5em; height:9em;
  z-index: 999;
}

.imglink {
  &:hover, &:hover .imglink-label {
    color: blue;
  }
  .imglink-label {
    font-weight: bold;
    color:gray;
  }
}

.close-button {
  position: absolute;
  right:-16px; top:-26px;
  opacity: 0.7;
}

.index-slider {
  margin: 0px 0em 0px 1em;
}
.index {
  white-space: nowrap;
  font-family: v-mono;
  font-size: smaller;
  .counter {
    min-width:2.5em;
  }
}

.img-size {
  font-size:smaller;
  white-space:nowrap;
  font-family:v-mono;
  .left-num {
    min-width: 3.5em;
    text-align: right;
  }
  .right-num {
    min-width: 3.5em;
    text-align: left;
  }
}

.pale {
  opacity: 0.2;
}

.viewer-item-container {
  position: relative;
  overflow: hidden;
  margin: 0px;
  padding: 0px;
  /*
  width: 480px;
  height: 130px;
  */
}

@media screen and (max-width: 580px) {
	.original-thumb {
    &, & * {
      display: none;
    }
  }
  .pathbox {
    max-width: 150px;
  }
  .thumb-arrow {
    display: none;
  }
  .index-slider {
    margin: 0px 0px 3px;
  }
}

/* transitions */
.viewer-item-init-enter-from {
  opacity: 0;
}
.viewer-item-init-enter-active {
  transition: opacity 1.5s ease;
}

.viewer-item-next-leave-active,
.viewer-item-prev-leave-active {
  transition: all .3s linear;
}
.viewer-item-next-enter-active,
.viewer-item-prev-enter-active {
  transition: all .4s ease-out;
}

.viewer-item-next-enter-from,
.viewer-item-prev-leave-to {
  opacity: 0;
  transform: translateX(400px);
}
.viewer-item-next-leave-to,
.viewer-item-prev-enter-from {
  opacity: 0;
  transform: translateX(-400px);
}

.viewer-item-next-leave-active,
.viewer-item-prev-leave-active {
  position: absolute;
}


</style>