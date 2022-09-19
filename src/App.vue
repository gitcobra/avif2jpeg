<template>
  <n-space vertical align="stretch" justify="space-between" style="height:100%; width:100%;">
    <n-space justify="end" align="end" style="box-sizing:border-box; padding:4px; margin:0px;">
      <n-button-group size="tiny" style="padding:4px;">
        <n-tooltip trigger="hover" :keep-alive-on-hover="false">
          <template #trigger>
            <router-link :to="{ path: '/en'}">
            <n-a>
            <n-button :color="!langJA? 'red':''" @click="langJA=false">
                English
            </n-button>
            </n-a>
            </router-link>
            
          </template>
          Switch to English
        </n-tooltip>
      
      
        <router-link :to="{ path: '/ja'}">
        <n-tooltip trigger="hover" :keep-alive-on-hover="false">
          <template #trigger>
            <n-button :color="langJA? 'red':''" @click="langJA=true">
                日本語
            </n-button>
          </template>
          日本語に切り替え
        </n-tooltip>
        </router-link>
      
      </n-button-group>
    </n-space>

    <n-space vertical justify="center">
      <h1 style="text-decoration:underline; padding:0px; margin:0px; text-decoration-style: double; text-align:center;"><a style="color:black; word-break: keep-all; overflow-wrap: break-word;" href="https://gitcobra.github.io/avif2jpeg/dist/">{{Labels.title}}</a></h1>
    </n-space>

    <n-space vertical align="center" justify="center">
      
      <!-- file selectors -->
      <input ref="fileinput" type="file" multiple :accept="AcceptFileTypes[UserSettings.acceptTypeValue]" style="display:none">
      <input webkitdirectory directory ref="folderinput" type="file" style="display:none">
      <n-space vertical align="stretch" justify="center">
        <!-- file select -->
        <n-tooltip trigger="hover" :keep-alive-on-hover="false" :placement="LANDSCAPE ? 'left' : 'top'" :duration="0" :delay="300">
          <template #trigger>
            <n-button round @click="fileinput.click()" style="width:100%;">
              <n-icon size="large" color="gray"><FileImageRegular /></n-icon>
              {{Labels.loadbutton}}
            </n-button>
          </template>
          <div v-html="Labels.loadbuttontooltip"></div>
        </n-tooltip>

        <!-- folder select -->
        <n-tooltip v-if="!IS_SP" trigger="hover" placement="bottom" :keep-alive-on-hover="false" style="max-width:90vw;" :duration="0" :delay="300">
          <template #trigger>
            <n-button round @click="folderinput.click()" style="width:100%;">
              <n-icon size="large" color="gray"><FolderOpenOutline /></n-icon>
              {{Labels.loadfolderbutton}}
            </n-button>
          </template>
          <div v-html="Labels.loadfoldertooltip"></div>
        </n-tooltip>
      </n-space>

      <!-- file type options -->
      <!--
      <n-tooltip trigger="hover" placement="bottom" :keep-alive-on-hover="false">
        <template #trigger>
          <n-checkbox v-model:checked="ignoreFileExtensions">
            {{Labels.ignoreFileExtensions}}
          </n-checkbox>
        </template>
        <div v-html="Labels.ignoreExtTooltip"></div>
      </n-tooltip>
      -->
      <n-collapse display-directive="show" :expanded-names="UserSettings.expandExtButtons ? ['extItem'] : ''" :on-update:expanded-names="names => UserSettings.expandExtButtons = !!String(names)">
        <n-collapse-item :title="Labels.fileTypeRadioTitle" name="extItem">
          <n-radio-group v-model:value="UserSettings.acceptTypeValue" name="filetyperadios" size="small">
            <n-space vertical style="padding-left:1em;">

              <n-tooltip v-for="(val) in FileTypeRadioValues" :key="val" trigger="hover" :keep-alive-on-hover="false">
                <template #trigger>
                  <n-radio :value="val">{{Labels.fileTypeRadioOptions[val]}}</n-radio>
                </template>
                {{AcceptFileTypes[val] || '.*'}}
              </n-tooltip>
              <n-tooltip trigger="hover" :keep-alive-on-hover="false" placement="bottom-start">
                <template #trigger>
                  <div style="padding-left:1em;">
                    <n-input v-model:value="UserSettings.editedAcceptTypes" @input="onInputTypes" status="success" :disabled="UserSettings.acceptTypeValue !== 'edit_type'" size="small" placeholder=".jpg, .gif, .png"/>
                  </div>
                </template>
                <span v-html="Labels.editAcceptTypes"></span>
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
          @mounted="onConverterReady" @start="onStart" @progress="onProgress" @success="onSuccess" @failure="onFailure" @complete="onComplete"
          @prevent="prevented = true;"
          @noimage="noimage = true"
          @avifsupport="flag => avifUnsupported = !flag"
          @imgload="onImgLoad"
          @consumeMessage="onCosumeMessage"
        >
          <n-tooltip v-if="!IS_SP" trigger="hover" :keep-alive-on-hover="false" placement="bottom" :duration="0" :delay="300">
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
            <h3 v-html="Labels.droptarget"></h3>
          </n-tooltip>
        </converter>
      </n-message-provider>
    </n-notification-provider>

    <n-space justify="center" align="center">
      <n-tooltip v-if="processCompleted" trigger="hover" placement="top" :keep-alive-on-hover="false" :duration="0" :delay="300">
        <template #trigger>
          <n-button @click="sendMessage='reconvert'" color="#888" round>{{Labels.reconvert}}</n-button>
        </template>
        <div v-html="`${Labels.reconvertTip}<br>(${inputFileCount} ${Labels.files})`"></div>
      </n-tooltip>
    </n-space>

    <!-- output settings -->
    <n-space justify="center">
      <n-space vertical align="start">

        <n-tooltip trigger="hover" :placement="LANDSCAPE ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="300">
          <template #trigger>
            <n-space align="center">
              <n-icon><FileImageRegular /></n-icon>{{Labels.imageType}}:
              <n-select size="small" v-model:value="UserSettings.imageFormat" :options="formatList" :consistent-menu-width="false" />
            </n-space>
          </template>
          {{Labels.imageTypeTooltip}}
        </n-tooltip>

        <n-tooltip trigger="hover" :placement="LANDSCAPE ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="300">
          <template #trigger>
            <n-space align="center">
              <n-space align="start" :wrap="false">
                <n-icon><MdImage /></n-icon><span style="white-space: nowrap;">{{Labels.quality}}:</span>
                <n-space align="center" justify="space-between">
                  <n-slider :tooltip="false" v-model:value="UserSettings.imageQuality" :step="1" style="width:120px;" :disabled="/png|bmp/.test(UserSettings.imageFormat)" />
                  <n-input-number style="width:90px;" size="small" v-model:value="UserSettings.imageQuality" step="1" min="0" max="100" :disabled="/png/.test(UserSettings.imageFormat)" />
                </n-space>
              </n-space>
            </n-space>
          </template>
          {{Labels.qualitytooltip}}
        </n-tooltip>

        <n-tooltip trigger="hover" :placement="LANDSCAPE ? 'left' : 'bottom-start'" :keep-alive-on-hover="false" :duration="0" :delay="300">
          <template #trigger><n-checkbox v-model:checked="UserSettings.retainExtension">{{Labels.retainOriginalExtension}}</n-checkbox></template>
          {{Labels.retainExtTooltip}}
        </n-tooltip>

      </n-space>
    </n-space>

    <!-- descriptions -->
    <n-space justify="center">
      <ul style="color:gray; padding-left:20px;">
        <li v-for="text in Labels.descriptions" :key="text" style="text-align:left" v-html="text"></li>
      </ul>
    </n-space>

    <!-- footer -->
    <n-space justify="center" align="baseline">
      <p style="font-size:x-small; text-align:center; margin:0px;">
        <version />
      </p>

      <n-space align="center">
        <n-space align="center">
          <n-a href="https://github.com/gitcobra/avif2jpeg" style="color:black; font-size:small;"><n-icon><Github /></n-icon>GitHub</n-a>
        </n-space>

        <n-space align="center">
          <licenses />
        </n-space>
      </n-space>
    </n-space>


  </n-space>

  <!-- no image dialog -->
  <n-modal v-model:show="noimage" preset="dialog" type="error" title="Images Not Found" positive-text="OK">
    {{Labels.noimage}}<br>{{AcceptFileTypes[UserSettings.acceptTypeValue] || '.*'}}
  </n-modal>
  <!-- AVIF unsupported dialog -->
  <n-modal v-model:show="avifUnsupported" preset="dialog" type="warning" title="Unsupported" positive-text="OK">
    {{Labels.avifUnsupported}}
  </n-modal>
  <!-- unsaved image dialog -->
  <n-modal v-model:show="unsaved" preset="dialog" type="warning" :title="Labels.confirmCloseDialogTitle"
    :positive-text="Labels.save" :negative-text="Labels.close" :maskClosable="false"
    :onPositiveClick="download"
    >
    {{Labels.confirmCloseDialog}}
  </n-modal>

  <!-- processing modal dialog -->
  <n-modal v-model:show="showProcess" :closable="!processing && processCompleted" :close-on-esc="!processing && processCompleted" @mask-click="sendMessage='destroy'" preset="dialog" :title="processingMessage" :type="processingType" :mask-closable="false" :on-after-leave="beforeClose">
    <template #default>
    <n-space vertical align="center">

      <n-progress type="circle" :percentage="percentage" :color="progressColor" indicator-text-color="black" rail-color="silver">
        <n-space vertical align="center" justify="center">
          <n-space style="font-size:x-large;">{{percentage}}%</n-space>
          <n-space style="font-size:xx-small">( {{currentSuccess}} / {{currentLength}} )</n-space>
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
          <a :href="convertedImageUrl" v-if="!!convertedImageUrl" target="_blank"><n-button round size="tiny">{{Labels.open}}</n-button></a>
          <n-button round size="tiny" v-if="!!convertedImageDataUrl" @click="copyDataURL(convertedImageDataUrl)">DataURI</n-button>
        </n-space>
      </n-space>

      <table>
      <tr><td>{{Labels.inputSize}}: </td><td style="text-align:right">{{(inputTotalSize / 1024 |0).toLocaleString()}}KB</td></tr>
      <tr><td>{{Labels.outputSize}}: </td><td style="text-align:right">{{(outputTotalSize / 1024 |0).toLocaleString()}}KB</td></tr>
      </table>

      <!-- button cancel -->
      <n-button v-if="processing" size="large" ref="cancelbutton" round @click="onCancel">{{Labels.cancel}}</n-button>
      <n-space align="center" vertical>
        <!-- button save -->
        <div>
          <n-button v-if="!processing && currentSuccess" size="large" round @click="download" color="lime">{{Labels.save}}</n-button>
          <span v-if="zipArchived" style="position:relative; width:1px; height:1px; overflow:visible">
            <span style="position:absolute; left:4px; top:-16px; transform: rotate(25deg); overflow:visible">
              <n-icon depth="4" size="30" color="lime"><Archive /></n-icon>
              <span style="position:absolute; left:28px; bottom:4px; transform: rotate(25deg); white-space:nowrap; font-size:small; font-family:impact; color:rgba(0,255,0, 0.5)">ZIP</span>
            </span>
          </span>
        </div>

        <!-- button close -->
        <n-button v-if="!processing && processCompleted" @click="showProcess = false" round size="small" style="font-size: small; margin-top:1em;">{{Labels.close}}</n-button>
      </n-space>


    </n-space>
    </template>
  </n-modal>
  <a ref="downloadlink" href="" v-show="false"></a>

  <!-- prevented error -->
  <n-modal v-model:show="prevented" preset="dialog" type="error" positive-text="OK" title="Busy">{{Labels.interfered}}</n-modal>
</template>


<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, reactive, watch, computed, onMounted, getCurrentScope, h } from 'vue'
import { useHead } from "@vueuse/head"

import { NButton, NButtonGroup, NInput, NSelect, NSpace, NSlider, NInputNumber, NSwitch, NIcon, NProgress, NModal, NTooltip, NSpin, NCheckbox, NRadio, NRadioGroup, NCollapse, NCollapseItem } from 'naive-ui'
import { NScrollbar, NMessageProvider, NNotificationProvider } from 'naive-ui'
import { NA, enUS, dateEnUS, jaJP, dateJaJP } from 'naive-ui'
import 'vfonts/RobotoSlab.css'
import { LogInOutline as LogInIcon, LogoGithub as Github, ImageOutline as FileImageRegular, ImageSharp as MdImage, FolderOpenOutline, ArrowRedoSharp, Archive } from '@vicons/ionicons5'

import Converter from './components/converter.vue'
import Licenses from './components/licenses.vue'
import version from './components/version.vue'

const LabelsEnUS = {
  title: 'AVIF to JPEG "Offline" Batch Converter',
  metaDescription: "It is a free web application to convert AVIF or WebP images to other common image formats such as JPEG or PNG without server communication.",
  droptarget: 'Drag & Drop AVIF Images to Convert',
  descriptions: [
    'This is a free web application to batch convert AVIF(or WebP, etc) images to common image formats such as JPEG, PNG.',
    `It uses a browser's built-in function for the conversions, so <strong>no data will be sent</strong> to a server and is therefore <strong>fast</strong> and <strong>safe</strong>.`,
    'The converted images will be output as <strong>a zip file</strong> when multiple images are loaded.',
    'Requires <a href="https://caniuse.com/?search=avif" target="_self" style="color:red">latest</a> version of Firefox or Chrome to load AVIF images.',
  ],
  fileTypeRadioTitle: 'Choose Target File Extentions',
  fileTypeRadioOptions: {
    avif_only: 'Only ".avif" or ".webp"',
    all_images: 'All Image Types',
    all_files: 'All Types',
    edit_type: 'Input File Extensions',
  },
  editAcceptTypes: 'Input list of comma separated file extentions to load.<br>e.g.) .jpg,.gif,.png',

  quality: 'Image Quality',
  qualitytooltip: 'Set image quality for output',
  imageType: 'Image Type',
  imageTypeTooltip: 'Choose image format for output',
  retainOriginalExtension: 'Keep Original File Extension',
  retainExtTooltip: 'New extension will be appended to original extension',

  ignoreFileExtensions: 'Load All File Types',
  ignoreExtTooltip: 'Try to load files that don\'t have image file extension',
  loadbutton: 'Load Images',
  loadbuttontooltip: 'Select your images from a dialog window.<br>*Multiple selection allowed.',
  loadfolderbutton: 'Load A Whole Folder',
  loadfoldertooltip: `
    Convert all images in the selected folder and its subfolders, and add the converted images to a ZIP archive with relative path.<br>
    *It will show "Upload" button, but it actually doesn't upload anything to a server.
  `,
  processing: 'Converting images',
  aborted: 'Aborted',
  incomplete: 'Some files failed to convert',
  completed: 'Completed',
  interfered: 'Currently Busy',
  noimage: 'No files with the extentions were found.',
  avifUnsupported: 'Your browser does not support AVIF format. Please use latest version of Firefox or Chrome to convert AVIF images.',
  cancel: 'Cancel',
  inputSize: 'Input Size',
  outputSize: 'Output Size',
  save: 'Save',
  close: 'Close',
  open: 'Open',
  reconvert: 'Reconvert',
  reconvertTip: 'Reconvert previous selected files.',
  files: 'Files',

  confirmCloseDialog: `You have not saved the converted images yet.`,
  confirmCloseDialogTitle:'Data have not been saved',
};

const LabelsJaJP = {
  title: 'AVIFからJPEGへ "オフライン"一括画像変換',
  metaDescription: 'AVIF・WebP形式の画像をJPEGやPNG等へオフラインで一括変換する無料ツール',
  droptarget: '変換したいAVIF画像をドラッグ&ドロップして下さい',
  descriptions: [
    'これはAVIF、又はWebP形式の画像を、JPEG、PNG等の一般的な形式へ一括変換するための無料Webアプリです。',
    `変換処理はブラウザの組み込み機能を利用するため、画像データがサーバーへ<strong>送信される事はなく</strong>、またそれゆえに<strong>高速</strong>かつ<strong>安全</strong>です。`,
    '複数枚の画像が読み込まれた場合、変換した画像は<strong>ZIPファイル</strong>に纏めて出力されます。',
    //'AVIF以外の画像も、ブラウザが<a href="https://developer.mozilla.org/ja/docs/Web/Media/Formats/Image_types" target="_self" style="color:red">対応している形式</a>であれば変換が実行されます。',
    'AVIF画像のロードには<a href="https://caniuse.com/?search=avif" target="_self" style="color:red">最新</a>のFirefox又はChromeが必要です。',
  ],
  fileTypeRadioTitle: '変換対象ファイルの拡張子を指定',
  fileTypeRadioOptions: {
    avif_only: '".avif" 又は ".webp" のみ',
    all_images: '全ての画像形式',
    all_files: '全ての形式',
    edit_type: '拡張子を入力して指定',
  },
  editAcceptTypes: 'ロードするファイルの拡張子のリストをカンマ区切りで指定して下さい。<br>例) .jpg,.gif,.png',

  quality: '画質設定',
  qualitytooltip: '出力する画像のクオリティを指定します',
  imageType: '画像形式',
  imageTypeTooltip: '出力する画像の形式を指定します',
  retainOriginalExtension: '元の拡張子を保持する',
  retainExtTooltip: '元の拡張子の後ろに新しい拡張子を付加します',

  ignoreFileExtensions: '全ての拡張子を読み込む',
  ignoreExtTooltip: '画像拡張子以外のファイルもロードできるか試行します',
  loadbutton: '画像をロード',
  loadbuttontooltip: 'ダイアログを開いて画像を選択します<br>※複数ファイル選択可',
  loadfolderbutton: 'フォルダごとロード',
  loadfoldertooltip: `
    選択したフォルダとサブフォルダの全ての画像に対して変換処理を行い、ZIP書庫へ相対パスで格納します。<br>
    ※「アップロード」というボタンが表示されますが実際にはサーバーへのファイルのアップロードは行われません。
  `,
  processing: '画像変換中',
  aborted: '中断',
  incomplete: '変換に失敗したファイルがあります',
  completed: '変換終了',
  interfered: '既に処理中です',
  noimage: 'この拡張子のファイルは見つかりませんでした。',
  avifUnsupported: 'このブラウザはAVIF形式に対応していません。AVIF画像を変換する場合は最新版のFirefox又はGoogle Chromeを使用して下さい。',
  cancel: 'キャンセル',
  inputSize: '入力サイズ',
  outputSize: '出力サイズ',
  save: '保存',
  close: '閉じる',
  open: '開く',
  reconvert: '再変換',
  reconvertTip: '前回選択したファイルを再変換します。',
  files: 'ファイル',

  confirmCloseDialog: `まだ変換したファイルを保存していません。`,
  confirmCloseDialogTitle: '変換ファイルが未保存',
};

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
  retainExtension: false,

  expandExtButtons: false,
  acceptTypeValue: FileTypeRadioValues[0],
  editedAcceptTypes: '',
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
const unsaved = ref(false);
const nofiles = ref(false);
const avifUnsupported = ref(false);
const showProcess = ref(false);
const processingMessage = ref('');
const processingFileName = ref('');
const inputTotalSize = ref(0);
const outputTotalSize = ref(0);
const processingType = computed(() => {
  switch(processingMessage.value) {
    case Labels.value.completed:
      return currentLength.value === currentIndex.value ? 'success' : 'warning';
    case Labels.value.aborted:
      return 'error';
    case Labels.value.incomplete:
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

//const Directory_Available = ref(false);
const Labels = ref(LabelsEnUS);
const langJA = ref(false);
//const quality = ref(90);
let locale = ref(enUS);
let dateLocale = ref(dateEnUS);
let downloadButtonClicked = false;

// switch language
watch(langJA, (newValue, oldValue) => {
  if( newValue ) {
    locale.value = jaJP;
    dateLocale.value = dateJaJP;
    Labels.value = LabelsJaJP;
  }
  else {
    locale.value = enUS;
    dateLocale.value = dateEnUS;
    Labels.value = LabelsEnUS;
  }
  //document.title = Labels.value.title;
});

// initialize language
// "location.pathname" doesn't work while vite-ssg generates html files so use router's parameter instead.
const router = useRouter();
const currentPath = router.currentRoute.value.path;
if( /\/ja\b/.test(currentPath) || /^\/?$/.test(currentPath) && /^ja\b/i.test(getLanguage()) ) {
  langJA.value = true;
  locale.value = jaJP;
  dateLocale.value = dateJaJP;
  Labels.value = LabelsJaJP;
}

// insert meta tags
useHead({
  // Can be static or computed
  title: Labels.value.title,
  meta: [
    {
      property: "og:title",
      content: Labels.value.title,
    },
    {
      property: `og:description`,
      content: Labels.value.metaDescription,
    }
  ],
});

onMounted(() => {
  // remove style for svg size fix
  document.querySelector('head').removeChild(document.getElementById('svgfix'));
  
  fileinput.value.oninput = folderinput.value.oninput = onInputFile;
  checkLandScape();
  window.addEventListener('resize', checkLandScape);
  //Directory_Available.value = ['webkitdirectory', 'directory'].some(attr => typeof folderinput.value[attr] !== 'undefined');
  
  // load UserSettings
  const storeName = 'avif2jpeg';
  const dat = JSON.parse(localStorage.getItem(storeName) || '{}');
  for( const p in UserSettings ) {
    if( dat.hasOwnProperty(p) ) {
      UserSettings[p] = dat[p];
    }
  }
  onInputTypes(UserSettings.editedAcceptTypes || '');

  window.addEventListener('unload', () => {
    const dat = {};
    for( const p in UserSettings ) {
      dat[p] = UserSettings[p];
    }
    localStorage.setItem(storeName, JSON.stringify(dat));
  });
});



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
  unsaved.value = false;
  percentage.value = 0;
  convertedImageUrl.value = '';
  convertedImageDataUrl.value = '';
  inputTotalSize.value = 0;
  outputTotalSize.value = 0;
  downloadButtonClicked = false;
  zipArchived.value = false;
  processingMessage.value = Labels.value.processing;
  prevLoadedImg = null;
  progressColor.value = 'lime';
  inputFileCount.value = 0;
  elapsedTime = 0;
}
function onProgress({length, index, name, success}) {
  currentIndex.value = index;
  percentage.value = index / length * 100 |0;
  processingMessage.value = Labels.value.processing;
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
  //console.log("fail")
  sendMessage.value = [{description:`${name}`, duration:0}, 'warning'];
  progressColor.value = 'orange';
}
function onComplete({index, zip, aborted, success, length, lastImage, lastImageDataURL, name, inputFileCount:fcount, elapsedTime:etime}) {
  //console.log("complete")
  const a = downloadlink.value;
  const lastPercentage = index / length * 100 |0;
  inputFileCount.value = fcount;
  elapsedTime = etime;

  if( success ) {
    // set link to an image if the succeeded count is 1
    if( success === 1 ) {
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
    // link to zip file if multiple files
    else {
      const d = new Date();
      a.download = 'avif2jpeg_'+(UserSettings.imageFormat.replace(/^image\//, ''))+'_'+d.getTime()+'.zip';
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
    processingMessage.value = Labels.value.completed;
  }
  else {
    processingMessage.value = aborted? Labels.value.aborted : Labels.value.incomplete;
  }
  
  processing.value = false;
  processCompleted.value = true;
}

function onCosumeMessage() {
  sendMessage.value = '';
}

function checkLandScape() {
  const w = document.body.clientWidth;
  const h = document.body.clientHeight;
  LANDSCAPE.value = w * 0.75 > h || w > 900;
}
function close() {

}
function beforeClose() {
  sendMessage.value = 'destroy';
  // show a prompt to save the converted file if more than 10 seconds have elapsed for the conversion
  if( elapsedTime > 1000 * 10 && !downloadButtonClicked ) {
    unsaved.value = true;
  }
  else {
    downloadlink.value.href= '';
  }
}
function download() {
  const a = downloadlink.value;
  a.click();
  downloadButtonClicked = true;
}

function openImage(url) {
  window.open(url, '_blank').document.write(`<img src="${url}">`);
}

function copyDataURL(url) {
  try {
    navigator.clipboard.writeText(url);
  } catch(e) {}
}

function getLanguage(): string {
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