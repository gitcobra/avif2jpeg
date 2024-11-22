<script lang="ts">
/*
https://github.com/vuejs/core/issues/4644
defineProps() in <script setup> cannot reference locally declared variables because it will be hoisted outside of the setup() function.
If your component options require initialization in the module scope, use a separate normal <script> to export the options instead.
*/
export type FileWithId = File & {
  readonly _id: number
};
export type SingleImageDataType = {
  convertedImageBlob: Blob
  convertedImageWidth: number
  convertedImageHeight: number
  convertedImageName: string
};
</script>

<script setup lang="ts">
import { type NotificationType } from 'naive-ui';
import { convertTargetFilesInMultithread } from './converter.multi';
import { convertImagesInSingleThread, getAsPromise } from './converter.single';

// sub components
import ConversionStatus from './status.vue';
import { GlobalValsKey } from '@/Avif2Jpeg.vue';
export type ConversionStatusType = InstanceType<typeof ConversionStatus>['$props']['status'];


// common
const INJ = inject(GlobalValsKey);
const { t } = useI18n();
const dialog = useDialog();
const message = useMessage();
const notification = useNotification();



// constants


const ELAPSED_SECONDS_TO_CONFIRM_BEFORE_CLOSING = 10;
const CoreCount = navigator.hardwareConcurrency;
const OffscreenCanvas_Available = typeof OffscreenCanvas === 'function';
const STATUS_UPDATE_INTERVAL = 300;



// properties

const props = defineProps<{
  input?: File[]
  format: string
  quality: number
  retainExtension: boolean
  maxZipSizeMB: number

  threads?: number
}>();



// emits

const emit = defineEmits<{
  start: []
  end: []
  'multi-thread-count': [number]
}>();





// reactive values

// significant flags
const processing = ref(false);
const canceled = ref(false);
const processCompleted = ref(false);
const refreshStatKey = ref(0);

// component display flags
const conversionModalActive = ref(false);
const dispConvStatusComponent = ref(false); // conversion status

// informations
const processingMessage = ref('initializing');
const processingType = ref<NotificationType>('info');

// an object for ConversionStatus["status"] property
const ConvStats: ConversionStatusType = reactive( initConvStatPropObj() );




// normal variables

let disableMultiThreading = false;

// clean up workes
let callbackToClearConverter = () => {};

// conversion statuses
let elapsedTimeForConversion = 0;
let allZipsClicked = false;




// watchers

watch(() => props.input, (val: File[]) => {
  if( val?.length ) {
    startConvert(val);
  }
});



// on mounted

onMounted(async () => {
  await checkAvifSupport();
  checkAvailableFeatures();
});








// event handlers

// NOTE:
// n-modal's "on-close" event fires only when pushing the close-buttons provided by the component
function onBeforeProcessingDialogClose() {
  if( elapsedTimeForConversion > ELAPSED_SECONDS_TO_CONFIRM_BEFORE_CLOSING * 1000 ) {
    if( !allZipsClicked && ConvStats.success > 0 ) {
      // open up confirmation dialog when unsaved data exist
      dialog.warning({
        title: t('confirmCloseDialogTitle'),
        autoFocus: true,
        maskClosable: false,
        positiveText: t('close'),
        negativeText: t('back'),
        onPositiveClick() {
          conversionModalActive.value = false;
          notification.destroyAll();
          message.destroyAll();
        },
        onNegativeClick() {},
        content: t('confirmCloseDialog'),
      });

      return false;
    }   
  }

  notification.destroyAll();
  message.destroyAll();
  conversionModalActive.value = false;
}

function onDemandImage(index: number) {
  ConvStats.demandImage(index);
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
  startConvert(props.input);
}

let onDemandZipErrorsFromStatus = ref(() => {});






// main functions

// clear ConversionStatus.status property object
function initConvStatPropObj(obj?: ConversionStatusType): ConversionStatusType {
  const initBaseObj: ConversionStatusType = {
    logs: [],
    
    index: 0,
    converted: 0,
    success: 0,
    failure: 0,
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
    
    zipSize: props.maxZipSizeMB,
    unconvertedListText: '',

    failedZipDone: false,
    failedZips: [],
    unconvertedFileCount: 0,
    unconvertedTotalSize: 0,
    failedFileZippedCount: 0,
    failedToCreateFailedZip: false,

    demandImage: () => {}
  };
  return Object.assign(obj || {}, initBaseObj);
}

function cleanUpProcessedData() {
  dispConvStatusComponent.value = false;

  URL.revokeObjectURL(ConvStats.convertedImageUrl);
  
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

  allZipsClicked = false;
  processCompleted.value = false;
  canceled.value = false;
}


async function startConvert(input: File[]) {
  // conversion process is already in progress
  if( processing.value ) {
    dialog.error({
      title: 'Busy',
      positiveText: 'OK',
      content: t('interfered'),
    });
    return;
  }

  let fileList = assignIdToFiles(input);

  // initialize before starting conversion
  initConvStatPropObj(ConvStats);
  cleanUpProcessedData();
  
  const SingleImageData = {
    convertedImageBlob: null as Blob,
    convertedImageWidth: 0,
    convertedImageHeight: 0,
    convertedImageName: '',
  };

  // refresh StatusComponent
  refreshStatKey.value++;

  // show child components
  conversionModalActive.value = true;
  dispConvStatusComponent.value = true;

  // set flag processing
  processing.value = true;
  ConvStats.processing = true;

  // set dialog condition
  processingType.value = 'info';
  processingMessage.value = t('processing');

  
  // prepare for converter
  const completedFileIdSet = new Set<number>();
  const format = props.format;
  const quality = props.quality;
  const outputExt = [...format.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/, 'jpg');
  const baseZipName = makeCurrentOutputName(format, quality);

  // set initial Status properties
  ConvStats.length = fileList.length;
  ConvStats.baseZipName = baseZipName;
  ConvStats.type = format.replace(/image\//, '').toUpperCase() + ( /jpe?g|webp/i.test(format) ? ' (' + quality + ')' : '');
  ConvStats.threads = disableMultiThreading ? 0 : props.threads;
  
  
  
  
  // start converting 
  
  const startedTime = Date.now();
  emit('start');
  
  const list = fileList.concat();
  let callbackToGenerateFailedZips;
  ({ callbackToGenerateFailedZips, callbackToClearConverter } =
    ( !disableMultiThreading && props.threads >= 2 ) ?
      // multi-threading
      await convertTargetFilesInMultithread(ConvStats, canceled, props, SingleImageData, message, notification, list, completedFileIdSet, format, quality, outputExt, format)
      :
      // single-threading
      await convertImagesInSingleThread(list, completedFileIdSet, SingleImageData, props, canceled, ConvStats)
  );
  

  
  // end converting
  
  // output single image 
  if( ConvStats.length === 1 ) {
    await outputSingleImageData(outputExt, SingleImageData);
  }
  
  // update condition by the result
  if( ConvStats.success === ConvStats.length ) {
    processingType.value = 'success';
    processingMessage.value = t('completed');
  }
  else {
    processingType.value = 'error';
    processingMessage.value = canceled.value? t('aborted') : t('incomplete');
  }
  
  // when error files exist
  if( completedFileIdSet.size !== fileList.length ) {
    const failedFileList = processFailedFiles( fileList, completedFileIdSet );
    
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

  elapsedTimeForConversion = Date.now() - startedTime;
  emit('end');
}





async function outputSingleImageData(ext, SingleImageData: SingleImageDataType) {
  if( SingleImageData.convertedImageBlob ) {
    const reader = new FileReader;
    reader.readAsDataURL(SingleImageData.convertedImageBlob);
    const dataUrl = await getAsPromise(reader).then((ev:any) => ev.target.result);

    ConvStats.convertedImageName = SingleImageData.convertedImageName.replace(/^.*\/(?=[^/]+$)/, '').replace(props.retainExtension ? '' : /\.(jpe?g|gif|png|avif|webp|bmp)$/i, '') + '.' + ext;
    ConvStats.convertedImageUrl = URL.createObjectURL(SingleImageData.convertedImageBlob);
    ConvStats.convertedImageDataUrl = dataUrl;
    ConvStats.convertedImageWidth = SingleImageData.convertedImageWidth;
    ConvStats.convertedImageHeight = SingleImageData.convertedImageHeight;
  }
}

function processFailedFiles( list: FileWithId[], completedFileIdSet: Set<number> ) {
  const errorList = [];
  const errorText = [];
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

// add id to File[]
let _fileIdCounter = 0;
function assignIdToFiles(list: File[]): FileWithId[] {
  const output = [];
  // add id to each file
  for( const file of list ) {
    if( !file.hasOwnProperty('_id') )
      Object.defineProperty(file, '_id', { value: _fileIdCounter++ });
    output.push(file);
  }

  return output as FileWithId[];
}

function makeCurrentOutputName(format: string, quality: number) {
  const d = new Date();
  
  format = format.replace(/^image\//, '').toLowerCase();

  const currentOutputFileName = `avif2jpg-
    ${ d.getFullYear().toString().substring(2) }
    ${ String((d.getMonth()+1) * 100 + d.getDate()).padStart(4, '0') }
    ${ String(d.getHours()*10000 + d.getMinutes()*100 + d.getSeconds()).padStart(6, '0') }
    -${``/*
    ${ String(d.getMilliseconds()).padStart(3, '0') }
    -*/}
    ${ format + (/jpe?g|webp/i.test(format) ? quality : '') }
  `.replace(/\s/g, '');

  return currentOutputFileName;
}

/*
function getOutputFullPath(path: string, ext: string, keepPrevExt: boolean, nameStore: { has(path: string): boolean }) {
  path = path.replace(/^\//, '');
  
  // remove extension
  if( !keepPrevExt )
    path = path.replace(/\.(jpe?g|jfif|pjpeg|pjp|gif|png|avif|webp|bmp|apng|ico)$/i, '');
  
  // add a number to the filename if the name already exists
  let outputPath = path + '.' + ext;
  for( let dupCounter = 1; dupCounter < 0x7FFFFFFF; dupCounter++ ) {
    
    // return when success
    if( !nameStore.has(outputPath) )
      return outputPath;
    
    // generate path
    outputPath = path + '_' + dupCounter + '.' + ext;
  }
  
  throw new Error(`failed to create valid output path. ${outputPath}`);
}
*/

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
  emit('multi-thread-count', disableMultiThreading ? 0 : CoreCount);
}



</script>





<template>

  <!-- re-convert button -->
  <n-space justify="center" align="center">
    <n-tooltip v-if="!processing && props.input?.length" trigger="hover" placement="top" :keep-alive-on-hover="false" :duration="0" :delay="50">
      <template #trigger>
        <n-button @click="convertAgain" round>{{t('convertAgain')}}</n-button>
      </template>
      <div v-html="t('reconvertTip', props.input?.length)"></div>
    </n-tooltip>
  </n-space>

  <!-- open the modal dialog during the conversion -->
  <n-modal
    ref="processingModal"   
    v-model:show="conversionModalActive"
    :closable="processCompleted"
    :close-on-esc="false"
    preset="dialog"
    display-directive="show"
    
    @click="notification.destroyAll(); message.destroyAll();"
    @mask-click="notification.destroyAll(); message.destroyAll();"
    @close="onBeforeProcessingDialogClose"
    @esc="onESCPress"
    :title="processingMessage"
    :type="processingType"
    :mask-closable="false"
    :on-after-leave="cleanUpProcessedData"

    class="processing-dialog"
  >
    <template #default>
      <n-flex vertical  style="flex-grow: 1;">
        
        <!-- conversion status -->
        <div style="flex-grow: 1;">
        <ConversionStatus
          :key="refreshStatKey"
          v-if="dispConvStatusComponent"
          :processing="processing"
          :status="ConvStats"
          :interval="STATUS_UPDATE_INTERVAL"
          @all-zips-clicked="allZipsClicked = true"
          @demand-zip-errors="onDemandZipErrorsFromStatus"
          @demand-image="onDemandImage"
        />
        </div>

        <!-- control buttons -->
        <n-flex justify="end">
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

@media screen and (max-width: 500px) {
  .processing-dialog {
    min-width: 320px;
  }	
}
</style>