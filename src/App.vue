<template>
  <n-space vertical align="stretch" justify="space-between" style="height:100%; width:100%;">
    
    <!-- header -->
    <n-space vertical justify="start">
      <n-space justify="space-between" style="box-sizing:border-box; padding:4px; margin:0px;">      

        <n-space align="start">
          <!-- github -->
          <n-a href="https://github.com/gitcobra/avif2jpeg" style="color:black; font-size:small; font-weight: bolder;"><n-icon><Github /></n-icon>GitHub</n-a>

          <span style="font-size:x-small;"><version/></span>
          
          <n-space align="center">
            <licenses/>
          </n-space>

        </n-space>
        
        <!-- language switches -->
        <n-space align="end" style="font-size: x-small;">          
          <n-tooltip :to="false" display-directive="show" :show="showBeforeMounted" trigger="hover" :keep-alive-on-hover="false" :placement="LANDSCAPE ? 'left' : 'bottom'" :duration="0" :delay="50">
            <template #trigger>
              <n-select ref="langselect" size="tiny" v-model:value="locale" :options="langOptions" :consistent-menu-width="false" @update:value="changeRoute" style="width: 100%;">
                <template #arrow>
                  <n-icon><GlobeOutline /></n-icon>
                </template>
              </n-select>
            </template>
            <div v-html="t('selectLanguage')"></div>
          </n-tooltip>
        </n-space>
      </n-space>

      <n-divider style="margin:0px;" />
    </n-space>
    
    <!-- title -->
    <n-space vertical justify="center" style="margin:0px;">
      <h1 style="padding:0px; margin:0px; text-align:center;"><a style="color:black; word-break: keep-all; overflow-wrap: break-word;" href="https://gitcobra.github.io/avif2jpeg/dist/">{{t('title')}}</a></h1>
    </n-space>

    <n-space vertical align="center" justify="center">
      
      <!-- file selectors -->
      <input ref="fileinput" type="file" multiple :accept="AcceptFileTypes[UserSettings.acceptTypeValue]" style="display:none">
      <input webkitdirectory directory ref="folderinput" type="file" style="display:none">
      <n-space vertical align="stretch" justify="center">
        <!-- file select -->
        <n-tooltip :to="false" display-directive="show" :show="showBeforeMounted" trigger="hover" :keep-alive-on-hover="false" :placement="LANDSCAPE ? 'left' : 'top'" :duration="0" :delay="50" :z-index="10">
          <template #trigger>
            <n-button round @click="fileinput.click()" style="width:100%;">
              <template #icon>
                <n-icon size="large" color="gray"><FileImageRegular /></n-icon>
              </template>
              {{t('loadbutton')}}
            </n-button>
          </template>
          <div v-html="t('loadbuttontooltip')"></div>
        </n-tooltip>

        <!-- folder select -->
        <n-tooltip :to="false" display-directive="show" :show="showBeforeMounted" v-if="!IS_SP" trigger="hover" placement="bottom" :keep-alive-on-hover="false" style="max-width:90vw;" :delay="0" :z-index="10">
          <template #trigger>
            <n-button round @click="folderinput.click()" style="width:100%;">
              <template #icon>
                <n-icon size="large" color="gray"><FolderOpenOutline /></n-icon>
              </template>
              {{t('loadfolderbutton')}}
            </n-button>
          </template>
          <div v-html="t('loadfoldertooltip')"></div>
        </n-tooltip>
      </n-space>

      <n-collapse display-directive="show" :expanded-names="UserSettings.expandExtButtons ? ['extItem'] : ''" :on-update:expanded-names="names => UserSettings.expandExtButtons = !!String(names)">
        <template #header-extra><n-icon size="large"><SearchCircle /></n-icon></template>
        <n-collapse-item :title="t('fileTypeRadioTitle')" name="extItem">
          <n-radio-group v-model:value="UserSettings.acceptTypeValue" name="filetyperadios" size="small">
            <n-space vertical style="padding-left:1em;">

              <n-tooltip v-for="(val) in FileTypeRadioValues" :key="val" trigger="hover" :keep-alive-on-hover="false" :z-index="5">
                <template #trigger>
                  <n-radio :value="val">{{t('fileTypeRadioOptions.'+val)}}</n-radio>
                </template>
                {{AcceptFileTypes[val] || '.*'}}
              </n-tooltip>

              <n-tooltip trigger="hover" :keep-alive-on-hover="false" placement="bottom-start">
                <template #trigger>
                  <div style="padding-left:1em;">
                    <n-input v-model:value="UserSettings.editedAcceptTypes" @input="onInputTypes" status="success" :disabled="UserSettings.acceptTypeValue !== 'edit_type'" size="small" placeholder=".jpg, .gif, .png"/>
                  </div>
                </template>
                <span v-html="t('editAcceptTypes')"></span>
              </n-tooltip>

            </n-space>
          </n-radio-group>
        </n-collapse-item>
      </n-collapse>
    </n-space>

    <!-- CONVERTER -->
    <n-notification-provider placement="top-right">
      <n-message-provider :closable="true" container-style="font-size:xx-small;">
        <converter
          :target="doc"
          :format="UserSettings.imageFormat"
          :quality="UserSettings.imageQuality"
          :input="inputFiles"
          :sendmessage="sendMessage"
          :processing="processing"
          :accept="AcceptFileTypes[UserSettings.acceptTypeValue]"
          :retain-extension="UserSettings.retainExtension"
          :max-zip-size="UserSettings.maxZipSizeMB"
          @mounted="onConverterReady" @start="onStart" @progress="onProgress" @success="onSuccess" @failure="onFailure" @complete="onComplete"
          @prevent="prevented = true;"
          @noimage="noimage = true"
          @avifsupport="flag => avifUnsupported = !flag"
          @imgload="onImgLoad"
          @consumeMessage="onCosumeMessage"
          @pushZip="onPushZip"
        >
          <n-tooltip :to="false" display-directive="show" :show="showBeforeMounted" v-if="!IS_SP" trigger="hover" placement="left" overlap :duration="0" :delay="50">
            <template #trigger>
              <n-space vertical style="border: 6px dashed #EEE; border-radius: 1em; padding:2em; ">
                <n-space align="stretch" style="color:silver; overflow-wrap: break-word; word-break: keep-all;">
                  <n-space>
                    <n-icon size="64" color="silver" class="test"><ArrowRedoSharp /></n-icon>
                  </n-space>
                  <n-space vertical style="font-weight:bold; font-size:x-large;">
                    <span>Drag & Drop</span>
                    <span>AVIF Images</span>
                  </n-space>
                </n-space>
              </n-space>
            </template>
            <h3 v-html="t('droptarget')"></h3>
          </n-tooltip>
        </converter>
      </n-message-provider>
    </n-notification-provider>

    <n-space justify="center" align="center">
      <n-tooltip v-if="processCompleted" trigger="hover" placement="top" :keep-alive-on-hover="false" :duration="0" :delay="50">
        <template #trigger>
          <n-button @click="sendMessage='reconvert'" color="#888" round>{{t('reconvert')}}</n-button>
        </template>
        <div v-html="t('reconvertTip', inputFileCount)"></div>
      </n-tooltip>
    </n-space>

    <!-- output settings -->
    <n-space justify="center">
      <n-space vertical align="start">

        <n-tooltip :to="false" display-directive="show" :show="showBeforeMounted" trigger="hover" :placement="LANDSCAPE ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="50">
          <template #trigger>
            <n-space align="center">
              <n-icon><FileImageRegular /></n-icon>{{t('imageType')}}:
              <n-select size="small" v-model:value="UserSettings.imageFormat" :options="formatList" :consistent-menu-width="false" />
            </n-space>
          </template>
          {{t('imageTypeTooltip')}}
        </n-tooltip>

        <n-tooltip :to="false" display-directive="show" :show="showBeforeMounted" trigger="hover" :placement="LANDSCAPE ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="50">
          <template #trigger>
            <n-space align="center">
              <n-space align="start" :wrap="false">
                <n-icon><MdImage /></n-icon><span style="white-space: nowrap;">{{t('quality')}}:</span>
                <n-space align="center" justify="space-between">
                  <n-slider :tooltip="false" v-model:value="UserSettings.imageQuality" :step="1" style="width:120px;" :disabled="/png|bmp/.test(UserSettings.imageFormat)" />
                  <n-input-number style="width:90px;" size="small" v-model:value="UserSettings.imageQuality" step="1" min="0" max="100" :disabled="/png|bmp/.test(UserSettings.imageFormat)" />
                </n-space>
              </n-space>
            </n-space>
          </template>
          {{t('qualitytooltip')}}
        </n-tooltip>

      </n-space>
    </n-space>

    <!-- advanced settings -->
    <n-space justify="center" item-style="margin-top:4px;">
      <advanced-settings v-model:retain-ext="UserSettings.retainExtension" v-model:max-zip-size="UserSettings.maxZipSizeMB" v-model:expanded="UserSettings.expandAdvSettings"/>
    </n-space>

    <!-- descriptions -->
    <n-space vertical justify="end">
      <n-divider style="margin:0px;" />
      <n-space justify="center">
        <descriptions/>
      </n-space>
    </n-space>
    
  </n-space>











  <!-- dialogs -->

  <!-- no image dialog -->
  <n-modal v-model:show="noimage" preset="dialog" type="error" title="Images Not Found" positive-text="OK">
    {{t('noimage')}}<br>{{AcceptFileTypes[UserSettings.acceptTypeValue] || '.*'}}
  </n-modal>
  <!-- AVIF unsupported dialog -->
  <n-modal v-model:show="avifUnsupported" preset="dialog" type="warning" title="Unsupported" positive-text="OK">
    {{t('avifUnsupported')}}
  </n-modal>
  <!-- unsaved image dialog -->
  <n-modal v-model:show="showUnsavedDialog" preset="dialog" type="warning" :title="t('confirmCloseDialogTitle')"
    :positive-text="t('save')" :negative-text="t('close')" :maskClosable="false"
    :onPositiveClick="() => showProcess = true"
    >
    {{t('confirmCloseDialog')}}
  </n-modal>

  <!-- processing modal dialog -->
  <n-modal v-model:show="showProcess" :closable="!processing && processCompleted" :close-on-esc="!processing && processCompleted" @mask-click="sendMessage='destroy'" preset="dialog" :title="processingMessage" :type="processingType" :mask-closable="false" :on-after-leave="onBeforeProcessingDialogClose">
    <template #default>
    <n-space vertical align="center">

      <n-progress type="circle" :percentage="percentage" :color="progressColor" indicator-text-color="black" rail-color="silver">
        <n-space vertical align="center" justify="center">
          <n-space style="font-size:x-large; white-space: nowrap;">{{percentage}}%</n-space>
          <n-space style="font-size:xx-small; white-space: nowrap;">( {{currentSuccess}} / {{currentLength}} )</n-space>
        </n-space>
      </n-progress>

      <!-- filename -->
      <n-space vertical align="center" item-style="overflow:hidden; text-overflow: ellipsis; white-space:nowrap;">
        <!-- <n-spin v-if="processing" size="small" /> -->
        <n-space style="font-size:x-small;">
          <span>{{processingFileName}}</span>
        </n-space>
        <n-space vertical style="height:90px;" align="center" justify="center">
          <div ref="thumbnail"></div>
        </n-space>
        <n-space>
          <a :href="convertedImageUrl" v-if="!!convertedImageUrl" target="_blank"><n-button round size="tiny">{{t('open')}}</n-button></a>
          <n-button round size="tiny" v-if="!!convertedImageDataUrl" @click="copyDataURL(convertedImageDataUrl)">DataURI</n-button>
        </n-space>
      </n-space>

      <table>
      <tr><td>{{t('inputSize')}}: </td><td style="text-align:right">{{(inputTotalSize / 1024 |0).toLocaleString()}}KB</td></tr>
      <tr><td>{{t('outputSize')}}: </td><td style="text-align:right">{{(outputTotalSize / 1024 |0).toLocaleString()}}KB</td></tr>
      </table>

      <!-- button cancel -->
      <n-button v-if="processing" size="large" ref="cancelbutton" round @click="onCancel">{{t('cancel')}}</n-button>

      <!-- converted image buttons -->
      <n-space align="center" vertical>  
        
        <!-- zip list -->
        <n-space justify="center">
          <div v-for="(item, index) in pushedZipList">
            <n-button size="small" round :color="item.clicked? 'gray':'lime'" :title="item.name + '('+(item.size/1024/1024|0)+'MB)'" @click="downloadPushedZip(item);">ZIP {{index + 1}}</n-button>
          </div>
        </n-space>
        
        <!-- button save -->
        <div>
          <n-button v-if="!processing && currentSuccess" size="large" round @click="download" color="lime">{{t('save')}}</n-button>
          <ZipIcon v-if="zipArchived"/>
        </div>

        <!-- button close -->
        <n-button v-if="!processing && processCompleted" @click="showProcess = false" round size="small" style="font-size: small; margin-top:1em;">{{t('close')}}</n-button>
      </n-space>


    </n-space>
    </template>
  </n-modal>
  <a ref="downloadlink" href="" v-show="false"></a>

  <!-- errors -->
  <n-modal v-model:show="prevented" preset="dialog" type="error" positive-text="OK" title="Busy">{{t('interfered')}}</n-modal>
</template>





<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, reactive, watch, computed, onMounted, getCurrentScope, h, nextTick } from 'vue'
import { useHead } from "@vueuse/head"

import { NButton, NButtonGroup, NInput, NSelect, NSpace, NSlider, NInputNumber, NSwitch, NIcon, NProgress, NModal, NTooltip, NCheckbox, NRadio, NRadioGroup, NCollapse, NCollapseItem, NA } from 'naive-ui'
import { NScrollbar, NMessageProvider, NNotificationProvider, NDivider } from 'naive-ui'
import 'vfonts/RobotoSlab.css'
import { LogInOutline as LogInIcon, LogoGithub as Github, ImageOutline as FileImageRegular, ImageSharp as MdImage, FolderOpenOutline, ArrowRedoSharp, Archive, GlobeOutline, SearchCircle } from '@vicons/ionicons5'

import Converter from './components/converter.vue'
import Licenses from './components/licenses.vue'
import Descriptions from './components/descriptions.vue';
import AdvancedSettings from './components/advsettings.vue'
import ZipIcon from './components/zipicon.vue'
import version from './components/version.vue';

import { useI18n } from 'vue-i18n'
import { LANG_ID_LIST, LANG_NAMES } from './i18n';

const { locale, t } = useI18n();
const langList = [];
const langOptions = ref(langList);
for( const lang of LANG_ID_LIST ) {
  langList.push({
    label: LANG_NAMES[lang],
    value: lang,
  });
}
langList.sort((a, b) => {
  const c = a.label;
  const d = b.label;
  return c > d ? 1 : c < d ? -1 : 0;
});

const ELAPSED_SECONDS_TO_CONFIRM_BEFORE_CLOSING = 10;

const IS_SP = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/.test(navigator.userAgent);
const doc = document;
//const imageFormat = ref('image/png');
const formatList = ref([{
  label: 'image/png',
  value: 'image/png',
}]);

//const ignoreFileExtensions = ref(false);
const FileTypeRadioValues = ['avif_only', 'all_images', 'all_files', 'edit_type'];
//const imageTypeOption = ref(FileTypeRadioValues[0]);
const AcceptFileTypes = ref({
  avif_only: '.avif,.webp',
  all_images: ".jpg,.jpeg,.jfif,.pjpeg,.pjp,.gif,.png,.webp,.avif,.bmp,.apng,.ico",
  all_files: '',
  edit_type: '',
});

const UserSettings = reactive({
  imageFormat: 'image/png',
  imageQuality: 90,

  expandExtButtons: false,
  acceptTypeValue: FileTypeRadioValues[0],
  editedAcceptTypes: '',

  expandAdvSettings: false,
  retainExtension: false,
  maxZipSizeMB: 1000,
});

const retainExtension = ref(false);
const percentage = ref(0);
const currentIndex = ref(0);
const currentSuccess = ref(0);
const currentLength = ref(0);
const LANDSCAPE = ref(true);
const processing = ref(false);
const processCompleted = ref(false);
const prevented = ref(false);
const noimage = ref(false);
const zipArchived = ref(false);
const showUnsavedDialog = ref(false);
const nofiles = ref(false);
const avifUnsupported = ref(false);
const showProcess = ref(false);
const processingMessage = ref('');
const processingFileName = ref('');
const inputTotalSize = ref(0);
const outputTotalSize = ref(0);
const processingType = computed(() => {
  switch(processingMessage.value) {
    case t('completed'):
      return currentLength.value === currentIndex.value ? 'success' : 'warning';
    case t('aborted'):
      return 'error';
    case t('incomplete'):
      return 'warning';
    default:
      return 'info';
  }
});
const progressColor = ref('lime');
const inputFileCount = ref(0);
let elapsedTime = 0;

// HTML Element references
const inputFiles = ref(null);
const sendMessage = ref<string | any[]>('');
const downloadlink = ref(null);
const convertedImageUrl = ref('');
const convertedImageDataUrl = ref('');
const fileinput = ref(null);
const folderinput = ref(null);
const thumbnail = ref(null);
const langselect = ref(null);

const pushedZipList = ref<{ name: string, url: string, size: number, clicked?: boolean }[]>([]);


//const Directory_Available = ref(false);
//const Labels = ref(LabelsEnUS);
const lang = ref('en');

//const quality = ref(90);
let downloadButtonClicked = false;


// switch language
watch(locale, (newValue, oldValue) => {
  /*
  if( newValue ) {
    locale.value = newValue;
  }
  else {
    locale.value = 'en';
  }
  */
  document.title = t('title');
  showBeforeMounted.value = true;
  switchToolTipVisibility();
});

// initialize language
// "location.pathname" doesn't work while vite-ssg generates html files so use router's parameter instead.
const router = useRouter();
const currentPath = router.currentRoute.value.path || '';
const langPath = String(currentPath.match(/(?<=^\/)[^/]+/) || '');
if( langPath && LANG_ID_LIST.includes(langPath) ) {
  locale.value = langPath;
}
else {
  const userlang = getBrowserLanguage().toLowerCase();
  const langhead = userlang.split(/[-_]/)[0];
  
  $LANG:
  if( LANG_ID_LIST.includes(langhead) ) {
    // choose traditional or simplified chinese
    if( langhead === 'zh' ) {
      switch( userlang ) {
        case 'zh-hant':
        case 'zh-mo':
        case 'zh-hk':
        case 'zh-tw':
          locale.value = 'zh-hant';
          break $LANG;
      }
    }

    locale.value = langhead;
  }
}


// insert meta tags
useHead({
  // Can be static or computed
  title: t('title'),
  meta: [
    {
      property: "og:title",
      content: t('title'),
    },
    {
      property: `og:description`,
      content: t('metaDescription'),
    }
  ],
});

  // load UserSettings
  const storeName = 'avif2jpeg';
  const dat = JSON.parse(localStorage.getItem(storeName) || '{}');
  for( const p in UserSettings ) {
    if( dat.hasOwnProperty(p) ) {
      UserSettings[p] = dat[p];
    }
  }
  onInputTypes(UserSettings.editedAcceptTypes || '');

onMounted(() => {
  // remove style for svg size fix
  document.querySelector('head').removeChild(document.getElementById('svgfix'));
  
  fileinput.value.oninput = folderinput.value.oninput = onInputFile;
  checkLandScape();
  window.addEventListener('resize', checkLandScape);
  //Directory_Available.value = ['webkitdirectory', 'directory'].some(attr => typeof folderinput.value[attr] !== 'undefined');
  


  window.addEventListener('unload', () => {
    const dat = {};
    for( const p in UserSettings ) {
      dat[p] = UserSettings[p];
    }
    localStorage.setItem(storeName, JSON.stringify(dat));
  });

  switchToolTipVisibility();
});

let showBeforeMounted = ref<true | undefined>(true);
async function switchToolTipVisibility() {
  //await new Promise(res => setTimeout(res, 100));
  setTimeout(() => showBeforeMounted.value = undefined, 3000);
}


function changeRoute(val) {
  router.push('/' + val + '/');
}

function onInputFile(ev) {
  const input = ev.target as HTMLInputElement;
  const list: File[] = [...input.files];
  /*
  if( list.length === 0 )
    nofiles.value = true; // open nofiles dialog
  else
    inputFiles.value = list;
  */
  inputFiles.value = list;
  fileinput.value.value = '';
  folderinput.value.value = '';
}
function onInputTypes(value) {
  AcceptFileTypes.value['edit_type'] = value;
}
function onConverterReady({formats}) {
  formatList.value = formats.map(val => {
    return {value:val, label:val}
  });
  const jpeg = formats.find(val => /jpeg/i.test(val));
  if( jpeg )
    UserSettings.imageFormat = jpeg;
}
function onCancel() {
  processing.value = false;
}
function onStart({length}) {
  currentIndex.value = 0;
  currentSuccess.value = 0;
  currentLength.value = length;
  showProcess.value = true;
  processing.value = true;
  processCompleted.value = false;
  showUnsavedDialog.value = false;
  percentage.value = 0;
  convertedImageUrl.value = '';
  convertedImageDataUrl.value = '';
  inputTotalSize.value = 0;
  outputTotalSize.value = 0;
  downloadButtonClicked = false;
  zipArchived.value = false;
  processingMessage.value = t('processing');
  prevLoadedImg = null;
  progressColor.value = 'lime';
  inputFileCount.value = 0;
  elapsedTime = 0;
  
  for( const item of pushedZipList.value ) {
    URL.revokeObjectURL(item.url);
  }
  pushedZipList.value.length = 0;
  decideCurrentOutputFileName();
}
function onProgress({length, index, name, success}) {
  currentIndex.value = index;
  percentage.value = index / length * 100 |0;
  processingMessage.value = t('processing');
  processingFileName.value = `${name}`;
}

let prevLoadedImg = null;
function onImgLoad({img, width, height}) {
  if( prevLoadedImg ) {
    prevLoadedImg.remove();
    prevLoadedImg.src = '';
  };
  
  const ratio = width / height;
  if( width > height ) {
    width = 120;
    height = width / ratio;
  }
  else {
    height = 90;
    width = height * ratio;
  }
  img.style.width = width + 'px';
  img.style.height = height + 'px';
  
  if( thumbnail.value ) {
    thumbnail.value.innerHTML = '';
    thumbnail.value.appendChild(img);
  }
  prevLoadedImg = img;
}
function onSuccess({name, index, success, inputSize, outputSize}) {
  currentSuccess.value = success;
  inputTotalSize.value += inputSize;
  outputTotalSize.value += outputSize;
}
function onFailure({name}) {
  sendMessage.value = [{description:`${name}`, duration:0}, 'warning'];
  progressColor.value = 'orange';
}

function onComplete({index, zip, aborted, success, length, lastImage, lastImageDataURL, name, inputFileCount:fcount, elapsedTime:etime, size}) {
  const a = downloadlink.value;
  const lastPercentage = index / length * 100 |0;
  inputFileCount.value = fcount;
  elapsedTime = etime;

  if( success ) {
    // splited zips
    if( pushedZipList.value.length > 0 ) {
      onPushZip({zip, size});
      //zipArchived.value = true;
    }
    // set link to an image if the succeeded count is 1
    else if( success === 1 ) {
      a.download = name;
      let url = lastImage;
      /*
      // For Firefox, change the MIME-type of the DataURI. Because Firefox opens an image link that has download attribute in new tab for uncertain reason.
      if( navigator.userAgent.indexOf('Firefox') !== -1 ) {
        url = lastImage.replace(/(?<=data:image\/)[^;]+(?=;)/, 'octet/stream');
      }
      */
      a.href = url;
      convertedImageUrl.value = lastImage;
      if( lastImageDataURL ) {
        convertedImageDataUrl.value = lastImageDataURL;
      }
    }
    // link to the zip file if multiple files were converted
    else {
      const d = new Date();
      a.download = currentOutputFileName + '.zip';
      a.href = zip;
      zipArchived.value = true;
    }
  }
  
  if( !aborted || lastPercentage === 100 ) {
    percentage.value = 100;
  }
  else
    progressColor.value = 'red';
  
  currentIndex.value = index;
  if( success === length ) {
    processingMessage.value = t('completed');
  }
  else {
    processingMessage.value = aborted? t('aborted') : t('incomplete');
  }
  
  processing.value = false;
  processCompleted.value = true;
}

function onPushZip({zip, size}) {
  // link to the zip file if multiple files were converted
  //const d = new Date();
  //const a = downloadlink.value;
  /*a.download = 'avif2jpeg_'+(UserSettings.imageFormat.replace(/^image\//, ''))+'_'+d.getTime()+'.zip';
  a.href = zip;
  zipArchived.value = true;*/

  pushedZipList.value.push({name: currentOutputFileName + '_' + String(pushedZipList.value.length + 1).padStart(2, '0') + '.zip', url: zip, size});
}

function onCosumeMessage() {
  sendMessage.value = '';
}

function downloadPushedZip(item) {
  item.clicked = true;
  downloadUrl(item.url, item.name);
}
function downloadUrl(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
}



function checkLandScape() {
  const w = document.body.clientWidth;
  const h = document.body.clientHeight;
  LANDSCAPE.value = w * 0.75 > h || w > 900;
}
function close() {

}
function onBeforeProcessingDialogClose() {
  sendMessage.value = 'destroy';
  // show a prompt to save the converted file if more than 10 seconds have elapsed for the conversion
  if( !downloadButtonClicked && elapsedTime > 1000 * ELAPSED_SECONDS_TO_CONFIRM_BEFORE_CLOSING ) {
    
    if( pushedZipList.value.length > 0 ) {
      // when pushed zip buttons exist, check if all zip file button were clicked
      for( const item of pushedZipList.value ) {
        if( !item.clicked ) {
          showUnsavedDialog.value = true;    
          break;
        }
      }
    }
    else
      showUnsavedDialog.value = true;
  }
  else {
    downloadlink.value.href= '';
  }
}
function download() {
  if( pushedZipList.value.length > 0 ) {
    for( const item of pushedZipList.value ) {
      downloadPushedZip(item);
    }
  }
  else {
    const a = downloadlink.value;
    a.click();
    downloadButtonClicked = true;
  }
}

let currentOutputFileName = '';
function decideCurrentOutputFileName() {
  const d = new Date();
  currentOutputFileName = 'avif2jpeg_' + (UserSettings.imageFormat.replace(/^image\//, '')) + '_' + d.getTime();
  return currentOutputFileName;
}

function openImage(url) {
  window.open(url, '_blank').document.write(`<img src="${url}">`);
}

function copyDataURL(url) {
  try {
    navigator.clipboard.writeText(url);
  } catch(e) {}
}

function getBrowserLanguage(): string {
  const navigator = window.navigator as any;
  return navigator.language || navigator.userLanguage || navigator.browserLanguage;
}
function log(msg) {
  console.log(msg);
}
</script>

<style lang="scss">
html, body {
  box-sizing: border-box;
  height: 100%;
  background-color: white;
  color: black;
  padding: 4px;
}
ul, div, li {
  box-sizing: border-box;
}
a {
  text-decoration: none;
}
#app {
  font-family: v-sans;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 99%;
  box-sizing: border-box;
  padding: 0px;
  margin: 0px;
}
</style>