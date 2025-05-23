<script setup lang="ts">
import { ImageRenderToolbarProps, NBadge, NButton, NInput, useDialog, useThemeVars } from 'naive-ui';
import { ref, render } from 'vue';
import { useI18n } from 'vue-i18n';
import { getThumbnailedSize, getUnitSize } from '@/components/util';
import Thumbnail from './thumbnail.vue';
import { ArrowForward, ArrowBack, ArrowRedoOutline, ArrowUndoOutline, ChevronForward, ChevronBack, Close } from '@vicons/ionicons5';
import { title } from 'process';
import { RefSymbol } from '@vue/reactivity';
import { GlobalValsKey } from '@/Avif2Jpeg.vue';


// injections
const INJ = inject(GlobalValsKey);

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
  'delete-image': [index: number]
  'close': []
}>();

// methods
defineExpose({
  download,
  cleanup,
  openPreview,
  isPreviewing() {
    return isPreviewing.value;
  },
  changeIndex(i: number) {
    index.value = i;
  },
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
const convertedSrc = ref('');
const originalSrc = ref('');

const orgwidth = ref(1);
const orgheight = ref(1);

const demandingImage = ref(false);
const thumbloaded = ref(false);
const thumbOrgloaded = ref(false);
const isPreviewing = computed<boolean>(() => nImageGroupRef.value?.previewInstRef?.displayed);
const isPreviewingConvertedImg = computed<boolean>(() => nImageGroupRef?.value?.previewInstRef?.previewSrc === convertedSrc.value);

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
  if( index.value < 1 || index.value > props.length || val === prev )
    return;
  clearTimeout(timeoutid);
  
  if( val > prev )
    viewerTransitionName.value = 'viewer-item-next';
  else
    viewerTransitionName.value = 'viewer-item-prev';
  
  //console.log(viewerTransitionName.value);

  timeoutid = setTimeout(() => {
    if( props.index === index.value - 1 )
      return;

    viewTransKey.value = initializing.value ? viewTransKey.value : ~viewTransKey.value;
    //convertedSrc.value = undefined;
    //originalSrc.value = undefined;
    
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
  // HACK: these properties are not documented in naive-ui manual.
  // manually set preview src.
  try {
    if( nImageGroupRef.value?.previewInstRef?.displayed ) {
      if( isPreviewingConvertedImg.value )
        nImageGroupRef.value.previewInstRef.setPreviewSrc(newsrc);
      else
        nImageGroupRef.value.previewInstRef.setPreviewSrc(props.originalUrl);
      
      // reset rotate value
      try {
        // HACK: to reset "rotate" variable inside ImagePreview
        const disp = nImageGroupRef.value.previewInstRef.displayed;
        nImageGroupRef.value.previewInstRef.handleAfterLeave();
        nImageGroupRef.value.previewInstRef.displayed = disp;
      } catch(e) {
        console.error(e);
      }
    }
  } catch(e) {
  }

  // update src
  convertedSrc.value = newsrc;
  originalSrc.value = props.originalUrl;
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
  if( !INJ.IS_SP )
    return;
  
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
    if( adx < ady || adx < 30 )
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
  switch( ev.code ) {
    case 'ArrowRight':
      moveIndex(1);
      break;
    /*
    case 'PageDown':
      moveIndex(props.length / 10 |0);
      break;
    */
    
    case 'ArrowLeft':
      moveIndex(-1);
      break;
    /*
    case 'PageUp':
      moveIndex(- props.length / 10 |0);
      break;
    */
    
    case 'Home':
      index.value = 1;
      break;
    case 'End':
      index.value = props.length;
      break;
    
    case 'Space':
    case 'Enter':
    case 'NumpadEnter':
      if( !isPreviewing.value ) {
        return;
      }
      switchImage();
      break;
    
    case 'ArrowUp':
    case 'ArrowDown':
      //ev.preventDefault();
    default:
      return;
  }
  
  ev.stopPropagation();
  ev.preventDefault();
  //ev.stopImmediatePropagation();
  //if( nImageGroupRef.value?.previewInstRef?.displayed )
  //  ev.preventDefault();
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
/*
function onClickDelete() {
  alert("del:"+index.value);
  emit('delete-image', index.value - 1);
}
*/

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

    //const select = (ev: any) => {ev.target.focus(); ev.target.select()};
    dialog.info({
      title: t('copiedDataURLDialogTitle'),
      content: () => h('div', [
        h('div', t('copiedDataURLMessage')),
        //h(NInput, {onFocus: select, onClick: select, type:'textarea', value:durl, readonly:true, size:'small', style:{marginTop:'2em', fontSize:'x-small'}})
        /*
        h('p',
          {style:{padding: '1em'}},
          h('a', {onClick(ev){ openImage(durl); ev.stopPropagation(); }, href:durl, style:{}}, 'URL'),
        ),
        */
      ]),
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
  if( val > 0 ) {
    index.value = Math.min(props.length, index.value + val) |0;
  }
  else if( val < 0 ) {
    index.value = Math.max(1, index.value + val) |0;
  }
}

function openImage(url: string) {
  window.open(url, '_blank').document.write(`<img src="${url}">`);
}



/*
HACK: switch between Original image and Converted image for preview
*/
let preservedTransform = '';
const switchImage = () => {
  // preserve transform
  preservedTransform = window.getComputedStyle(nImageGroupRef?.value?.previewInstRef?.previewRef)?.transform;
  
  const prev = isPreviewingConvertedImg.value;
  nImageGroupRef?.value?.next();
  nextTick(() => {
    if( isPreviewingConvertedImg.value === prev )
      nImageGroupRef?.value?.next();
  });
};
// HACK: Image Preview resets its own CSS transform each time it loads an image, so restore them manually
function restoreTransform() {
  try {
    nextTick(() => nImageGroupRef.value.previewInstRef.previewRef.style.transform = preservedTransform);
  } catch(e) {}
}

function renderToolbar({ nodes }: ImageRenderToolbarProps) {
  
  // add button to switch between original and converted
  const switchOrgConv = h(NBadge, {
    color:isPreviewingConvertedImg.value ? 'green' : 'gray',
    offset:[-20, -12],
    value: (isPreviewingConvertedImg.value ? t('status.Converted') : t('status.Original')), // + ' ' + index.value,
  }, () => h(NButton, {
    round:true,
    onClick(){ switchImage() },
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

  renderPathBox();

  return [switchOrgConv, ...Object.values(nodes)];
}

// create a pathbox in the top-left
const WRAPPER_ID = '#pathbox-' + String(Math.random()).substring(2);
let prevwrapper;
function renderPathBox() {
  // HACK:
  // directly render path box in the ImagePreview wrapper
  try {
    prevwrapper = nImageGroupRef.value?.previewInstRef?.previewWrapperRef?.parentNode;
    if( !prevwrapper || prevwrapper.querySelector(WRAPPER_ID) ) {
      return;
    }

    let pbox = h('div', {
      id: WRAPPER_ID,
      onMousedown:(ev) => {ev.stopPropagation()},
      //onVnodeBeforeUnmount: () => console.log('pathbox unmounted'),
      className: '__preview-injected-pathbox' + (isPreviewingConvertedImg.value ? ' converted' : ''),
    }, [
      // index
      h('div', `${String(index.value).padStart(String(props.length).length,'0')}/${String(props.length).padStart(String(props.length).length,'0')}`),
      // size
      h('div', getUnitSize(isPreviewingConvertedImg.value ? props.size : props.originalSize, 0)),
      // path
      h('div', /*{onVnodeBeforeUnmount(){console.log('childumounted')}},*/ isPreviewingConvertedImg.value ? props.name : props.originalName),
    ]);


    render(pbox, prevwrapper);
    pbox = null;
  } catch(e) {
    console.error(e);
  }
}
// unmount pathbox
onBeforeUnmount(() => {
  if( !prevwrapper )
    return;
  
  render(null, prevwrapper);
  prevwrapper = null;
});



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
  <n-flex justify="center" align="stretch" vertical :style="{visibility: initializing ? 'hidden' : 'visible'}" class="body" ref="body"  style="overflow:visible;">
  <n-image-group
    ref="nImageGroupRef"
    show-toolbar-tooltip
    :render-toolbar="renderToolbar"
    @preview-next="restoreTransform"
  >
  

    <n-flex :wrap="false" align="center" justify="space-between" style="overflow:visible;">
      <!-- left button -->
      <n-button @click="moveIndex(-1)" :bordered="false" :disabled="!allowPrev" :class="{'thumb-arrow':true, pale: !allowPrev}" :title="$t('Prev')">
        <template #icon><n-icon size="30"><ChevronBack/></n-icon></template>
      </n-button>

      <n-flex justify="center" ref="viewerItemContainer" class="viewer-item-container" style="width:100%;">
        <transition :name="viewerTransitionName">
        
        <n-flex vertical :key="viewTransKey">
          <n-flex align="center" :wrap="false">
            
            <!-- left column (org => conv) -->
            <n-flex vertical>
              <!--
              <n-flex justify="end">
                <n-button @click="onClickDelete" size="tiny" color="red" ghost>Delete</n-button>
              </n-flex>
              -->

              <n-flex align="center" justify="center" :wrap="false">
                <!-- ORIGINAL -->
                <n-flex align="center" justify="center" vertical class="original-thumb">
                  <a :href="originalUrl" @click.prevent="thumbOrgRef.openPreview();" :download="originalName" :title="originalName" class="imglink">
                  <n-flex align="center" justify="center" :wrap="false">

                    <Thumbnail
                      :ref="(el: any) => {if( el?.active ) thumbOrgRef = el}"
                      :src="originalSrc"
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
                      <n-flex justify="center" class="img-size" :wrap="false" :size="2">
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


                <n-flex vertical align="center" class="original-thumb">
                  <n-icon size="20" color="silver" :component="ArrowForward"/>
                </n-flex>
                
                <!-- CONVERTED -->
                <a :href="convertedSrc" @click.prevent="openPreview()" :download="props.name" :title="props.name" class="imglink">
                <n-flex vertical align="center" justify="center">
                  <n-flex class="imglink-label">{{t('status.Converted')}}</n-flex>
                  
                  <!-- image dimension -->
                  <n-flex vertical align="center" justify="center" :size="0">
                    <n-flex justify="center">
                      <n-flex :wrap="false" :style="props.variousInfo?.shrinked ? {color:'blue'} : {}" class="img-size" :size="2">
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
              <n-flex ref="fileNameContainer" justify="center" align="center" class="pathbox" :title="props.name" style="overflow: hidden;">
                <n-scrollbar :x-scrollable="true" trigger="hover" style="text-align: center; font-size:smaller; overflow:hidden; white-space:nowrap; text-overflow: ellipsis;">
                  {{ !thumbloaded ? '?' : props.name }}
                </n-scrollbar>
              </n-flex>

            </n-flex>

            <!-- right column (thumb) -->
            <n-flex vertical style="overflow: visible;">
  
              <Thumbnail
                :ref="(el: any) => {if( el?.active ) thumbConvRef = el}"
                :src="convertedSrc"
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
              <n-flex justify="center" align="center" :wrap="false">
                
                <!-- save blobURL -->
                <n-popover display-directive="show" trigger="hover" :duration="0" :delay="0">
                  <template #trigger>
                  <a :href="props.url" ref="saveImg" target="_blank" :download="props.name" style="line-height:1em;">
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
      <n-button :bordered="false" @click="moveIndex(1)" :disabled="!allowNext" :class="{'thumb-arrow':true, next:true, pale: !allowNext}" :title="$t('Next')">
        <template #icon><n-icon size="30"><ChevronForward/></n-icon></template>
      </n-button>
    </n-flex>

        
    <n-flex v-if="!isSingle" justify="center" align="center" :wrap="false" :size="4">
      <!-- slider for index -->
      <n-slider v-model:value="index" :tooltip="false" :step="1" :min="1" :max="props.length" :keyboard="false" class="index-slider"/>
      
      <!-- index -->
      <n-flex class="index" align="center" justify="center" :wrap="false" :size="3">
        <n-flex>{{t('status.index')}}:</n-flex>
        <n-flex justify="end" align="center" class="counter">{{ index }}</n-flex>
        <n-flex>/</n-flex>
        <n-flex justify="start" align="center" class="counter">{{ props.length }}</n-flex>
      </n-flex>
    </n-flex>
  
    <!-- close button -->
    <!--
    <n-button @click="emit('close');" circle size="tiny" color="silver" class="close-button" :title="$t('close')">
      <template #icon><n-icon size="12"><Close/></n-icon></template>
    </n-button>
    -->

  </n-image-group>
  </n-flex>

</template>

<style lang="scss" scoped>
.body {
  width: 100%;
  font-size: 0.8em;
  
  position: relative;
  margin-bottom: 3px;

  overflow: hidden;
  .n-flex {
    overflow: hidden;
  }
}

a {
  color: black;
}
.pathbox {
  flex-grow: 0;
  font-size: 0.9em;
  overflow:hidden;
  white-space:nowrap;
  text-overflow: ellipsis;
}

.thumb-arrow {
  min-width: 10%;
  color: gray;
  height:9em;
  z-index: 999;
  &:hover {
    border: 1px solid;
  }
}

.imglink {
  font-size: 0.9rem;
  &:hover, &:hover .imglink-label {
    color: blue;
  }
  .imglink-label {
    font-weight: bold;
    color:gray;
  }
}
/*
.close-button {
  z-index: 999;
  position: absolute;
  right:-16px; top:-26px;
  opacity: 0.7;
}
*/

.index-slider {
}
.index {
  white-space: nowrap;
  font-size: 0.8rem;
  min-width: 10em;
  .counter {
    font-family: v-mono;
    min-width:2.5em;
  }
}

.img-size {
  font-size: 0.9rem;
  white-space:nowrap;
  font-family:v-mono;
  .left-num {
    min-width: 3rem;
    text-align: right;
  }
  .right-num {
    min-width: 3rem;
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
  transform: translateX(800px);
}
.viewer-item-next-leave-to,
.viewer-item-prev-enter-from {
  opacity: 0;
  transform: translateX(-800px);
}

.viewer-item-next-leave-active,
.viewer-item-prev-leave-active {
  position: absolute;
}
</style>

<style lang="scss">

.__preview-injected-pathbox {
  font-size: 0.8rem;
  z-index: 999999999999;
  position: fixed;
  display: flex;
  left: 0px;
  bottom: 0px;
  color: white;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0px 4px;
  background-color: #00000088;
  font-family: v-mono;
  padding: 1px;

  &.converted {
    background-color: #115511aa;
  }

  > * {
    margin-right: 0.2em;
  }
  > :nth-child(2) {
    min-width: 5em;
    text-align: center;
  }
  > .path {
    font-family: v-sans;
  }
}

</style>