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
import { clearDirCache, getFileSystemWritePermission, isDirHandleValid, useDirCache } from '../filesystem-api';

// sub components
import ConversionStatus from './status/status.vue';
//import SwitchLanguage from '../header/switch-lang.vue';
import { GlobalValsKey } from '@/Avif2Jpeg.vue';
import PromptDup from '../prompt-on-dup.vue';

import { UserSettings, MaxThreads } from '@/user-settings';
export type ConversionStatusType = InstanceType<typeof ConversionStatus>['$props']['status'];

import type { FileWithId } from '../file-selector.vue';
import { VNode } from 'vue';

import { buildDirsAndWriteFile, createExistingFolderSetWithinFileList } from '../filesystem-api';
import themeLight from 'naive-ui/es/float-button-group/styles/light';
import { OverwriteCommand } from './workers/worker.canvas';

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
const buttonList = ref<typeof PromptDup["buttons"]>([
  [() => t('dupAction_overwrite'), 'overwrite'],
  [() => t('dupAction_skip'), 'skip'],
  [() => t('cancel'), 'cancel'],
]);

// properties
const props = defineProps<{
  input: FileWithId[];
  format: string;
  quality: number;
  retainExtension: boolean;
  maxZipSizeMB: number;
  autoStart?: boolean;

  threads?: number;

  outputToDir: boolean;
  outputDirHandle: FileSystemDirectoryHandle;
}>();

const showNote = defineModel<boolean>('showNote');


// emits

const emit = defineEmits<{
  start: []
  end: []
  //'multi-thread-count': [number]
}>();

// methods
defineExpose({
  beginConversion,
});




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

const isReadyToConvert = computed(() => props.input?.length);

const promptref = ref<InstanceType<typeof PromptDup>>();
const confirmationTargetPath = ref('');
const confirmationApplyAllChecked = ref(false);
const confirmationTargetIsFolder = ref<boolean>(true);

const warnfsysShow = ref(false);
let onCloseWarnFsys = () => {};
const noWarnFilesys = ref(false);
let warnfsysAccepted = false as boolean;

// normal variables

let disableMultiThreading = false;

// Flag indicating whether "Apply to all" was checked in the overwrite dialog
let appliedOverwriteDecision = undefined;


// clean up workes
let callbackToClearConverter = () => {};
let demandImage: (index: number) => any | null;

// conversion statuses
let elapsedTimeForConversion = 0;
let allZipsClicked = false as boolean;




// watchers
watch(() => props.input.length, (val, oldval) => {
  if( val >= oldval ) {
    if( props.autoStart )
      beginConversion();
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
    if( !props.outputToDir && !allZipsClicked && ConvStats.success > 0 ) {
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

async function beginConversion() {
  if( !props.input?.length || processing.value ) {
    dialog.error({
      title: 'error',
      positiveText: 'OK',
      content: 'An unexpected error occurred.',
    });
    return;
  }

  if( props.outputToDir && !props.outputDirHandle ) {
    dialog.error({
      title: 'error',
      positiveText: 'OK',
      content: t('errMsgOutputDirNotFound'),
    });
    return;
  }

  // conversion process is already in progress
  if( processing.value ) {
    dialog.error({
      title: 'Busy',
      positiveText: 'OK',
      content: t('interfered'),
    });
    return;
  }

  if( props.outputToDir ) {
    if( !noWarnFilesys.value ) {
      await new Promise<void>(resolve => {
        warnfsysShow.value = true;
        warnfsysAccepted = false;
        onCloseWarnFsys = resolve;
      });

      if( !warnfsysAccepted ) {
        noWarnFilesys.value = false;
        return;
      }
    }

    // check permission
    if(
      !(await getFileSystemWritePermission(props.outputDirHandle)) ||
      !(await isDirHandleValid(props.outputDirHandle))
    ) {
      await dialog.warning({
        title: 'Rejected',
        positiveText: 'OK',
        maskClosable: true,
        content: t('settings.permissionDenied'),
      });
      return;
    }
  }

  startConversion(props.input!);
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
    shrink: UserSettings.multithread && UserSettings.shrinkImage ?
      [UserSettings.maxWidth, UserSettings.maxHeight] : undefined,
    unconvertedListText: '',

    failedZipDone: false,
    failedZips: [],
    unconvertedFileCount: 0,
    unconvertedTotalSize: 0,
    failedFileZippedCount: 0,
    failedToCreateFailedZip: false,

    outputToDir: props.outputToDir,
    outputDirName: props.outputDirHandle ? props.outputDirHandle.name : '',
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

  // dialog handling
  isConfirmationQueueActive = false;
  confirmationQueue.length = 0;
  appliedOverwriteDecision = undefined;
  overwriteAllowList.clear();
  overwriteDenyList.clear();

  clearDirCache();
  //useDirCache(true);
}


async function startConversion(input: FileWithId[]) {

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

  
  // --- prepare for converter ---
  const completedFileIdSet = new Set<number>();
  const completedPathList = [];
  const format = props.format;
  const quality = props.quality;
  const outputExt = [...format.matchAll(/.+\/(.+)/g)][0][1].replace(/jpeg/, 'jpg');
  const baseZipName = makeCurrentOutputName(format, quality, fileList[0].webkitRelativePath);

  // prepare for File System API
  // NOTE:
  // create list of existing folders in the output folder for each thread
  // to check whether a folder is created by another thread.
  let existingFolders = new Set<string>;
  if( props.outputDirHandle ) {
    existingFolders = await createExistingFolderSetWithinFileList(props.outputDirHandle, fileList);
  }

  // set initial Status properties
  ConvStats.length = fileList.length;
  ConvStats.baseZipName = baseZipName;
  ConvStats.type = format.replace(/image\//, '').toUpperCase() +
    ( /jpe?g|webp/i.test(format) ? ' (' + quality + ')' : '');
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
    result = await convertTargetFilesInMultithread({
      files:fileList,
      completedFileIdSet,
      completedFileDat: completedPathList,
      ConvStats, canceled,
      props,
      imageType:format,
      quality,
      outputExt,
      format,
      message,
      
      //outputMethod: UserSettings.outputMethod,
      fsysDirHandler: props.outputDirHandle,
      //outputToDir: props.outputToDir,
      writeUsingFileSystem,
      //openOverwriteConfirmation,
      enqueueOverwriteConfirmation,
      existingFolders,
    });
  }
  // single-threading
  else {
    demandImage = demandImageSingle;
    result = await convertImagesInSingleThread(
      fileList, completedFileIdSet, props, canceled, ConvStats, enqueueOverwriteConfirmation,
    );
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
  //fileList.length = 0;
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

async function writeUsingFileSystem(path: string, blob: Blob) {
  console.log(path, blob);
  
  const dirHandle = props.outputDirHandle;
  if( !dirHandle )
    throw new Error('Directory Handle is empty');
  
  await buildDirsAndWriteFile(dirHandle, path, blob, true);
}

let isConfirmationQueueActive = false;
const confirmationQueue: {
  resolver: (val: OverwriteCommand) => any,
  target: string,
  type: 'file' | 'folder',
  path: string,
}[] = [];

async function enqueueOverwriteConfirmation(
  /*resolver: Function,*/ target: string, type: 'file' | 'folder', path: string,
) {
  return new Promise<OverwriteCommand>(resolver => {
    if( !isConfirmationQueueActive ) {
      isConfirmationQueueActive = true;
      openOverwriteConfirmation(resolver, target, type, path);
    }
    else
      confirmationQueue.push({resolver, target, type, path});
  });
}

const overwriteAllowList = new Set<string>();
const overwriteDenyList = new Set<string>();
async function openOverwriteConfirmation(
  resolver: (val: OverwriteCommand) => any,
  target: string,
  type: 'file' | 'folder',
  path: string,
) {
  let result: OverwriteCommand;
  
  if( canceled.value )
    result = 'cancel';
  else if( overwriteAllowList.has(target) )
    result = 'overwrite';
  else if( overwriteDenyList.has(target) )
    result = 'skip';
  else {
    // set content
    confirmationTargetPath.value = target;
    confirmationTargetIsFolder.value = type === 'folder';
    
    // show prompt
    result = appliedOverwriteDecision || await promptref.value.start();
    
    if( result.startsWith('cancel') )
      canceled.value = true;
    if( result === 'overwrite')
      overwriteAllowList.add(target);
    if( result === 'skip')
      overwriteDenyList.add(target);
    if( result === 'close' )
      confirmationApplyAllChecked.value = false;

    await nextTick();

    if( !appliedOverwriteDecision && confirmationApplyAllChecked.value ) {
      result += '-all';
      appliedOverwriteDecision = result;
    }
  }

  console.log("result", result, target);
  resolver(result);

  if( confirmationQueue.length ) {
    const {resolver, target, type, path} = confirmationQueue.shift();
    openOverwriteConfirmation(resolver, target, type, path);
  }
  else
    isConfirmationQueueActive = false;
}

</script>





<template>
  <!-- convert button -->
  <n-flex v-if="!processing" justify="center" align="center" style="margin-top:0.4em">
    <n-tooltip trigger="hover" placement="top" :keep-alive-on-hover="false" :duration="0" :delay="50">
      <template #trigger>
        <transition>
        <!-- <n-badge :value="input?.length || 0" :offset="[-12, -5]" color="#99999966"> -->
          <n-button
            :disabled="!isReadyToConvert"
            @click="beginConversion" round size="large"
            style="font-size: 1.5em; padding:1em;"
            :type="isReadyToConvert ? 'success' : undefined"
            _:class="{'button-ready': isReadyToConvert}"
          >
            <template #icon>
              <n-icon size="1.2em"><SimpleIconsConvertio/></n-icon>
            </template>
            {{t('StartConversion')}}
          </n-button>
        <!-- </n-badge> -->
        </transition>
      </template>
      <template #default>
        <div v-html="isReadyToConvert? t('convertTooltip') : t('convertUnpreparedTooltip')"></div>
      </template>
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
          <!--
          <n-flex justify="start" align="center">
            <slot name="lang-switch"></slot>
          </n-flex>
          -->
          
          <!-- cancel button -->
          <n-button v-if="processing" :disabled="canceled" ref="cancelbutton" round size="large" @click="canceled = true">
            <!-- spinner waiting for complete -->
            <n-spin :show="canceled && !processCompleted" size="small">{{t('cancel')}}</n-spin>
          </n-button>
          <!-- close button -->
          <n-button v-else-if="processCompleted" @click="onBeforeProcessingDialogClose" round size="large">
            {{t('close')}}
          </n-button>
        </n-flex>

      </n-flex>
    </template>
  </n-modal>


  <!-- overwrite confirmation dialog -->
  <prompt-dup
    ref="promptref"
    closable
    draggable
    type="warning"
    close-on-esc
    :buttons="buttonList"
    
    show-apply-all
    :label-apply-all="$t('confirmApplyAllLabel')"
    v-model:apply-all-checked="confirmationApplyAllChecked"
  >
    <template #header>
      {{
        $t('confirmFileOverwriteTitle', {
          type: confirmationTargetIsFolder ? $t('folder') : $t('file')
        })
      }}
    </template>
    <template #default>
      <div>
        {{
          $t('confirmFileOverwriteMsg', {
            type: confirmationTargetIsFolder ? $t('folder') : $t('file')
          })
        }}
      </div>
      <n-flex class="path" align="center" :size="1" :wrap="false">
        <MaterialSymbolsFolderOutline v-if="confirmationTargetIsFolder" />
        <FormkitFileimage v-else />
        {{ confirmationTargetPath }}
      </n-flex>
    </template>
  </prompt-dup>

  <n-modal
    preset="dialog"
    type="warning"
    v-model:show="warnfsysShow"
    :title="$t('warnAboutFileSysTitle')"
    @after-leave="onCloseWarnFsys()"
    :positive-text="$t('Continue')"
    :negative-text="$t('cancel')"
    @positive-click="void(warnfsysAccepted = true)"
    @negative-click="void(warnfsysAccepted = false)"
  >
    <p>
    {{ $t('warnAboutFileSysBeforeConversion1') }}
    </p>
    <n-flex class="path" align="center" :size="1" :wrap="false">
      <MaterialSymbolsFolderOutline/>
      {{ outputDirHandle.name }}
    </n-flex>
    <p style="color: red">
    {{ $t('warnAboutFileSysBeforeConversion2') }}
    </p>
    <!--
    <n-flex justify="end" style="padding: 1em; font-size:0.8em;">
      <n-checkbox v-model:checked="noWarnFilesys">{{$t('checkboxTextDontShowThis')}}</n-checkbox>
    </n-flex>
    -->
  </n-modal>

</template>

<style lang="scss">
.processing-dialog {
  min-width: 900px;
}
.path {
  padding-left: 1em;
}
.button-ready {
  text-shadow:
    0 0 0.5em #2F6,
    0 0 0.3em #FFF,
    0 0 1em rgba(150, 255, 200, 0.5);
  box-shadow:
    0 0 0.5em #3E6,
    0 0 2px #FFF,
}
@media screen and (max-width: 900px) {
  .processing-dialog {
    min-width: 90%;
  }
}

@media screen and (max-width: 580px) {
  .processing-dialog {
    min-width: 320px;
  }	
}
</style>