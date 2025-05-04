<script lang="ts">
export type ConverterResult = {
    exception?: Error;
    callbackToGenerateFailedZips: (any?) => any;
    callbackToClearConverter: (any?) => any;
    //demandImage: (index: number) => any | null;
};
</script>


<script setup lang="ts">
import { NButton, type NotificationType } from 'naive-ui';
import { convertTargetFilesInMultithread, demandImage as demandImageMulti, deleteImage } from './converter.multi';
import { convertImagesInSingleThread, getAsPromise, demandImage as demandImageSingle } from './converter.single';
import { DocumentOutline } from '@vicons/ionicons5';

// sub components
import ConversionStatus from './status/status.vue';
import SwitchLanguage from '../header/switch-lang.vue';
import { GlobalValsKey } from '@/Avif2Jpeg.vue';
import { UserSettings, MaxThreads } from '@/user-settings';
export type ConversionStatusType = InstanceType<typeof ConversionStatus>['$props']['status'];

import type { FileWithId } from '../file-selector.vue';
import { VNode } from 'vue';

// common
const INJ = inject(GlobalValsKey);
const { t } = useI18n();
const dialog = useDialog();
const message = useMessage();
//const notification = useNotification();



// constants


const ELAPSED_SECONDS_TO_CONFIRM_BEFORE_CLOSING = 10;
const CoreCount = navigator.hardwareConcurrency;
const OffscreenCanvas_Available = typeof OffscreenCanvas === 'function';
const STATUS_UPDATE_INTERVAL = 100;
const THREADS_MAX_LIMIT = 16;


// properties

const props = defineProps<{
  input?: FileWithId[]
  format: string
  quality: number
  retainExtension: boolean
  maxZipSizeMB: number

  threads?: number
}>();

const showNote = defineModel<boolean>('showNote');


// emits

const emit = defineEmits<{
  start: []
  end: []
  //'multi-thread-count': [number]
}>();





// reactive values

// significant flags
const processing = ref(false);
const canceled = ref(false);
const processCompleted = ref(false);

// component display flags
const conversionModalActive = ref(false);
const dispConvStatusComponent = ref(false); // conversion status

// informations
const processingMessage = ref<() => any>(() => 'initializing');
const processingType = ref<NotificationType>('info');

// an object for ConversionStatus["status"] property
const ConvStats: ConversionStatusType = reactive( initConvStatPropObj() );

const stat = useTemplateRef('stat');
const convStatKeyToRefresh = ref(0);


// normal variables

let disableMultiThreading = false;

// clean up workes
let callbackToClearConverter = () => {};
//
let demandImage: (index: number) => any | null;

// conversion statuses
let elapsedTimeForConversion = 0;
let allZipsClicked = false;




// watchers

watch(() => props.input!, (val: FileWithId[]) => {
  if( val?.length ) {
    startConvert(val);
  }
});

// hide browser's scrollbar while the processing modal is active
watch(conversionModalActive, (val) => {
  document.body.style.overflowY = val ? 'hidden' : 'auto';
});




// on mounted

onMounted(async () => {
  await checkAvifSupport();
  checkAvailableFeatures();
});








// event handlers

// NOTE:
// n-modal's "on-close" event fires only when pushing the close-buttons provided by the component
async function onBeforeProcessingDialogClose() {
  let close = true;
  if( elapsedTimeForConversion > ELAPSED_SECONDS_TO_CONFIRM_BEFORE_CLOSING * 1000 ) {
    if( !allZipsClicked && ConvStats.success > 0 ) {
      // open up confirmation dialog when unsaved data exist
      close = false;
      await new Promise<void>(resolve => {
        dialog.warning({
          title: t('confirmCloseDialogTitle'),
          autoFocus: true,
          maskClosable: false,
          positiveText: t('close'),
          negativeText: t('back'),
          onPositiveClick: () => close = true,
          onAfterLeave: resolve,

          content: t('confirmCloseDialog'),
        });
      });
    }   
  }

  if( !close ) {
    return false;
  }

  //stat.value.cleanup();
  //notification.destroyAll();
  message.destroyAll();
  conversionModalActive.value = false;
  showNote.value = false;
}

function onDemandImage(index: number) {
  //ConvStats.demandImage(index);
  demandImage?.(index);
  console.log(index, "demanded")
}
function onDeleteImage(index: number) {
  deleteImage?.(index);
  console.log(index, "delete");
}

function onESCPress() {
  if( !canceled.value && processing.value ) {
    canceled.value = true;
  }
  else {
    onBeforeProcessingDialogClose();
  }
}

function convertAgain() {
  startConvert(props.input!);
}

let onDemandZipErrorsFromStatus = ref(() => {});






// main functions

// clear ConversionStatus.status property object
function initConvStatPropObj(obj?: ConversionStatusType): ConversionStatusType {
  const initBaseObj: ConversionStatusType = {
    logs: [],
    ziplogs: [],
    
    startedCount: 0,
    converted: 0,
    success: 0,
    failure: 0,
    retried: 0,
    done: 0,
    length: 0,
    zippedTotalCount: 0,
    zippingErrorCount: 0,
    zippedTotalSize: 0,
    
    processing: false,
    zips: [],
    inputTotalSize: 0,
    outputTotalSize: 0,
    thumbnail: null,
    
    baseZipName: 'testzipname',
    type: 'image/any',
    
    startedTime: Date.now(),

    convertedImageDataUrl: '',
    convertedImageName: '',
    convertedImageUrl: '',
    convertedImageOrgUrl: '',
    convertedImageIndex: -1,
    convertedImageShrinked: false,
    
    zipSize: props.maxZipSizeMB,
    shrink: UserSettings.multithread && UserSettings.shrinkImage ? [UserSettings.maxWidth, UserSettings.maxHeight] : undefined,
    unconvertedListText: '',

    failedZipDone: false,
    failedZips: [],
    unconvertedFileCount: 0,
    unconvertedTotalSize: 0,
    failedFileZippedCount: 0,
    failedToCreateFailedZip: false,
  };
  return Object.assign(obj || {}, initBaseObj);
}

function cleanUpProcessedData() {
  dispConvStatusComponent.value = false;

  URL.revokeObjectURL(ConvStats.convertedImageUrl!);
  URL.revokeObjectURL(ConvStats.convertedImageOrgUrl!);
  
  for( const item of ConvStats.zips ) {
    URL.revokeObjectURL(item.url);
  }
  ConvStats.zips.length = 0;

  for( const item of ConvStats.failedZips ) {
    URL.revokeObjectURL(item.url);
  }
  ConvStats.failedZips.length = 0;


  initConvStatPropObj(ConvStats);
  callbackToClearConverter();
  callbackToClearConverter = () => {};
  demandImage = null;

  allZipsClicked = false;
  processCompleted.value = false;
  canceled.value = false;
}


async function startConvert(input: FileWithId[]) {
  // conversion process is already in progress
  if( processing.value ) {
    dialog.error({
      title: 'Busy',
      positiveText: 'OK',
      content: t('interfered'),
    });
    return;
  }

  // refresh ConversionStatus if it already exists
  if( conversionModalActive.value ) {
    convStatKeyToRefresh.value ^= 1;
  }

  let fileList = input.concat();//[...input];//assignIdToFiles(input);

  // initialize before starting conversion
  initConvStatPropObj(ConvStats);
  cleanUpProcessedData();

  // show child components
  conversionModalActive.value = true;
  dispConvStatusComponent.value = true;

  // set flag processing
  processing.value = true;
  ConvStats.processing = true;

  // set dialog condition
  processingType.value = 'info';
  processingMessage.value = () => t('processing');

  
  // prepare for converter
  const completedFileIdSet = new Set<number>();
  const format = props.format;
  const quality = props.quality;
  const outputExt = [...format.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/, 'jpg');
  const baseZipName = makeCurrentOutputName(format, quality, fileList[0].webkitRelativePath);

  // set initial Status properties
  ConvStats.length = fileList.length;
  ConvStats.baseZipName = baseZipName;
  ConvStats.type = format.replace(/image\//, '').toUpperCase() + ( /jpe?g|webp/i.test(format) ? ' (' + quality + ')' : '');
  ConvStats.threads = disableMultiThreading ? 0 : props.threads;
  
  
  
  
  // start converting 
  const startedTime = Date.now();
  emit('start');
  
  let callbackToGenerateFailedZips;
  let exception: Error | undefined;
  let result: ConverterResult;
  // multi-threading
  if( !disableMultiThreading && props.threads! >= 2 ) {
    demandImage = demandImageMulti;
    //deleteImage = deleteImage;
    result = await convertTargetFilesInMultithread({files:fileList, completedFileIdSet, ConvStats, canceled, props, imageType:format, quality, outputExt, format, message});
  }
  // single-threading
  else {
    demandImage = demandImageSingle;
    result = await convertImagesInSingleThread(fileList, completedFileIdSet, props, canceled, ConvStats);
  }
  ({exception, callbackToGenerateFailedZips, callbackToClearConverter} = result);
  
  // terminate the application when recieved an exception 
  if( exception ) {
    let message: string;
    switch( exception.message ) {
      case 'worker-load-error':
        message = t('errMsgWorkerLoadError');
        break;
      default:
        message = 'unexpected error';
    }
    
    dialog.error({
      title: 'Error',
      
      autoFocus: true,
      maskClosable: false,
      closable: false,

      content: () => h('div', [
        h('p', message),
        h(NButton, {onClick() {location.reload()}}, t('Reload')),
      ]),
    });
  }
  

  
  // end converting
  
  // update condition by the result
  if( ConvStats.success === ConvStats.length ) {
    processingType.value = 'success';
    processingMessage.value = () => t('completed');
  }
  else {
    processingType.value = 'error';
    processingMessage.value = () => canceled.value? t('aborted') : t('incomplete');
  }
  
  // when error files exist
  if( completedFileIdSet.size !== fileList.length ) {
    const failedFileList = processFailedFiles( input, completedFileIdSet );
    
    onDemandZipErrorsFromStatus.value = () => {
      if( !failedFileList || !failedFileList.length )
        return;
      
      callbackToGenerateFailedZips(failedFileList);
    };
  }

  // set processing flags off
  processing.value = false;
  ConvStats.processing = false;
  processCompleted.value = true;
  fileList.length = 0;
  //input.length = 0;

  elapsedTimeForConversion = Date.now() - startedTime;
  emit('end');
}







function processFailedFiles( list: FileWithId[], completedFileIdSet: Set<number> ) {
  const errorList: FileWithId[] = [];
  const errorText:string[] = [];
  let size = 0;
  for( const file of list ) {
    if( !completedFileIdSet.has(file._id) ) {
      errorList.push(file);
      errorText.push(file.webkitRelativePath || (file as any).relativePath || file.name);
      size += file.size;
    }
  }

  if( errorText.length ) {
    ConvStats.unconvertedListText = errorText.join('\n');
    ConvStats.unconvertedFileCount = errorList.length;
    ConvStats.unconvertedTotalSize = size;
  }

  return errorList;
}



// general functions



function makeCurrentOutputName(format: string, quality: number, firstFilePath?: string) {
  const d = new Date();
  
  format = format.replace(/^image\//, '').toLowerCase();

  const baseName = UserSettings.useFolderNameForZip && String(firstFilePath).match(/^\/?([^/]+)\//)?.[1] || 'avif2jpg';
  
  const timestump = `
    ${ d.getFullYear().toString().substring(2) }
    ${ String((d.getMonth()+1) * 100 + d.getDate()).padStart(4, '0') }
    ${ String(d.getHours()*10000 + d.getMinutes()*100 + d.getSeconds()).padStart(6, '0') }
    -
    ${ format + (/jpe?g|webp/i.test(format) ? quality : '') }
  `.replace(/\s/g, '');

  const currentOutputFileName = `${baseName}-${timestump}`.replace(/\s+/g, ' ');

  return currentOutputFileName;
}

async function checkAvifSupport() {
  const TestAVIFData = 'data:image/avif;base64,AAAAHGZ0eXBtaWYxAAAAAG1pZjFhdmlmbWlhZgAAAPJtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAABEAAAQABAAAAAAEWAAEAAAAgAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUltYWdlAAAAAHFpcHJwAAAAUmlwY28AAAAUaXNwZQAAAAAAAAAIAAAACAAAABBwYXNwAAAAAQAAAAEAAAAWYXYxQ4EgAAAKCDgIv2kBDQAgAAAAEHBpeGkAAAAAAwgICAAAABdpcG1hAAAAAAAAAAEAAQQBAoOEAAAAKG1kYXQKCDgIv2kBDQAgMhQWQAAASAAADAZuZXHwA9LzjNWygA==';
  const img = document.createElement('img');
  const prom = getAsPromise(img).then(() => true, () => false);
  img.src = TestAVIFData;

  if( !await prom ) {
    dialog.warning({
      title: "Unsupported",
      positiveText: "OK",
      maskClosable: false,
      content: t('avifUnsupported'),
    });
  }
}

function checkAvailableFeatures() {
  if( !OffscreenCanvas_Available || CoreCount < 2 || !Promise.any ) {
    disableMultiThreading = true;
  }
  
  //emit('multi-thread-count', disableMultiThreading ? 0 : Math.min(CoreCount, THREADS_MAX_LIMIT));
  //MaxThreads.value = disableMultiThreading ? 0 : Math.min(CoreCount, THREADS_MAX_LIMIT);
  if( disableMultiThreading )
    MaxThreads.value = 0;
}



</script>





<template>
  <!-- re-convert button -->
  <n-flex v-if="!processing && props.input?.length" justify="center" align="center" style="margin-top:0.4em">
    <n-tooltip trigger="hover" placement="top" :keep-alive-on-hover="false" :duration="0" :delay="50">
      <template #trigger>
        <n-badge :value="input?.length || 0" :offset="[-12, -5]" color="#99999966">
          <n-button @click="convertAgain" round size="medium">
            <template #icon>
              <n-icon size="1.2em" color="#CCCCCC"><DocumentOutline /></n-icon>
            </template>
            {{t('convertAgain')}}
          </n-button>
        </n-badge>
      </template>
      <div v-html="t('reconvertTip', props.input?.length)"></div>
    </n-tooltip>
  </n-flex>

  <!-- message -->
  <!--
  <n-drawer :show="conversionModalActive || showNote" placement="right" :z-index="0" mask-closable :on-mask-click="e => showNote=false">
    <n-drawer-content title="Note">
      <p>
        {{ $t('annotationOutOfMemory') }}
      </p>
      <p>
      <img width="200" src="/outofmemory.png">
      </p>
    </n-drawer-content>
  </n-drawer>
  -->

  <!-- open the modal dialog during the conversion -->
  <n-modal
    ref="processingModal"
    display-directive="show"
    v-model:show="conversionModalActive"
    :closable="processCompleted"
    :close-on-esc="false"
    preset="dialog"
    
    @click="message.destroyAll();"
    @mask-click="message.destroyAll();"
    @close="onBeforeProcessingDialogClose"
    @esc="onESCPress"
    :title="processingMessage"
    :type="processingType"
    :mask-closable="false"
    @after-leave="cleanUpProcessedData"
    @before-leave="stat.cleanup();"

    class="processing-dialog"
  >
    <template #default>
      <n-flex vertical  style="flex-grow: 1;">
        <!-- conversion status -->
        <ConversionStatus
          ref="stat"
          v-if="dispConvStatusComponent"
          :key="convStatKeyToRefresh"
          :processing="processing"
          :status="ConvStats"
          :interval="STATUS_UPDATE_INTERVAL"
          @all-zips-clicked="allZipsClicked = true"
          @demand-zip-errors="onDemandZipErrorsFromStatus"
          @demand-image="onDemandImage"
          @delete-image="onDeleteImage"
        />

        <!-- control buttons -->
        <n-flex justify="end" align="center" :wrap="false">
          
          <n-flex justify="start" align="center">
            <slot name="lang-switch"></slot>
          </n-flex>
          
          <!-- cancel button -->
          <n-button v-if="processing" :disabled="canceled" ref="cancelbutton" round size="large" @click="canceled = true">
            <!-- spinner waiting for complete -->
            <n-spin :show="canceled && !processCompleted" size="small">{{t('cancel')}}</n-spin>
          </n-button>
          <!-- close button -->
          <n-button v-else-if="processCompleted" @click="onBeforeProcessingDialogClose" round size="large" style="font-size: small; margin-top:1em;">{{t('close')}}</n-button>
        </n-flex>

      </n-flex>
    </template>
  </n-modal>

</template>

<style lang="scss">
.processing-dialog {
  min-width: 640px;
}

@media screen and (max-width: 580px) {
  .processing-dialog {
    min-width: 320px;
  }	
}
</style>