<template>
  <n-space vertical align="stretch" justify="space-between" style="height:100%; width:100%;">
    <n-space justify="end" align="end" style="box-sizing:border-box; padding:4px; margin:0px;">
      <n-button-group size="tiny" style="padding:4px;">
        <n-tooltip trigger="hover" :keep-alive-on-hover="false">
          <template #trigger>
            <router-link :to="{ path: '/en'}">
            <n-a>
            <n-button :color="!langJA? 'red':''" @click="langJA=false" tag="a" href="/en">
                <n-icon><World /></n-icon> English
            </n-button>
            </n-a>
            </router-link>
            
          </template>
          Switch to English
        </n-tooltip>
      
      
        <router-link :to="{ path: '/ja'}" :style="{color:langJA? 'white':'black'}">
        <n-tooltip trigger="hover" :keep-alive-on-hover="false">
          <template #trigger>
            <n-button :color="langJA? 'red':''" @click="langJA=true">
                日本語 <n-icon><UserNinja /></n-icon>
            </n-button>
          </template>
          日本語に切り替え
        </n-tooltip>
        </router-link>
      
      </n-button-group>
    </n-space>

    <n-space vertical justify="center">
      <h1 style="text-decoration:underline; padding:0px; margin:0px; text-decoration-style: double; text-align:center;">{{Labels.title}}</h1>
    </n-space>

    <n-space vertical align="center" justify="center">
      <n-space vertical align="stretch" justify="center">
        <!-- file select -->
        <input ref="fileinput" type="file" multiple :accept="AcceptFileTypes[imageTypeOption]" style="display:none">
        <n-tooltip trigger="hover" :keep-alive-on-hover="false">
          <template #trigger>
            <n-button round @click="fileinput.click()" style="width:100%;">
              <n-icon size="large" color="gray"><FileImageRegular /></n-icon>
              {{Labels.loadbutton}}
            </n-button>
          </template>
          <div v-html="Labels.loadbuttontooltip"></div>
        </n-tooltip>

        <!-- folder select -->
        <input webkitdirectory directory ref="folderinput" type="file" style="display:none">
        <n-tooltip v-if="!IS_SP" trigger="hover" placement="bottom" :keep-alive-on-hover="false" style="max-width:90vw;">
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
      <n-collapse display-directive="show">
        <n-collapse-item :title="Labels.fileTypeRadioTitle">
          <n-radio-group v-model:value="imageTypeOption" name="filetyperadios" size="small">
            <n-space vertical style="padding-left:1em;">

              <n-tooltip v-for="(val) in FileTypeRadioValues" :key="val" trigger="hover" :keep-alive-on-hover="false">
                <template #trigger>
                  <n-radio :value="val">{{Labels.fileTypeRadioOptions[val]}}</n-radio>
                </template>
                {{AcceptFileTypes[val] || '.*'}}
              </n-tooltip>

            </n-space>
          </n-radio-group>
        </n-collapse-item>
      </n-collapse>
    </n-space>

    <!-- CONVERTER -->
    <n-notification-provider placement="top-right">
      <n-message-provider placement="top-right" :closable="true" container-style="font-size:xx-small;">
        <converter
          :target="doc"
          :format="UserSettings.imageFormat"
          :quality="UserSettings.imageQuality"
          :input="inputFiles"
          :sendmessage="sendMessage"
          :processing="processing"
          :accept="AcceptFileTypes[imageTypeOption]"
          :retain-extension="UserSettings.retainExtension"
          @mounted="onConverterReady" @start="onStart" @progress="onProgress" @success="onSuccess" @failure="onFailure" @complete="onComplete"
          @prevent="prevented = true;"
          @noimage="noimage = true"
          @avifsupport="flag => avifUnsupported = !flag"
          @imgload="onImgLoad"
        >
          <n-tooltip v-if="!IS_SP" trigger="hover" :keep-alive-on-hover="false">
            <template #trigger>
              <n-space align="center" style="text-align:center; color:silver; margin:1em; padding:2em; overflow-wrap: break-word; word-break: keep-all; border: 6px dashed #EEE; border-radius: 1em;">
                <n-space>
                  <n-icon size="48" color="silver"><DragDrop /></n-icon>
                </n-space>
                <n-space style="font-weight:bold; font-size:x-large;">
                  <div>
                    Drag & Drop<br>
                    AVIF Images
                  </div>
                </n-space>
              </n-space>
            </template>
            <h3 v-html="Labels.droptarget"></h3>
          </n-tooltip>
        </converter>
      </n-message-provider>
    </n-notification-provider>
    <!-- no image dialog -->
    <n-modal v-model:show="noimage" preset="dialog" type="error" title="Images Not Found" positive-text="OK">{{Labels.noimage}}<br>{{AcceptFileTypes[imageTypeOption] || '*.'}}</n-modal>
    <!-- <n-modal v-model:show="nofiles" preset="dialog" type="error">{{Labels.noimage}}</n-modal>-->
    <!-- AVIF unsupported dialog -->
    <n-modal v-model:show="avifUnsupported" preset="dialog" type="warning" title="Unsupported" positive-text="OK">{{Labels.avifUnsupported}}</n-modal>
    <!-- unsaved image dialog -->
    <n-modal v-model:show="unsaved" preset="dialog" type="warning" title="Images have not been saved"
      :positive-text="Labels.save" :negative-text="Labels.close" :maskClosable="false"
      :onPositiveClick="download"
      >
      {{Labels.confirmCloseDialog}}
    </n-modal>

    <!-- output settings -->
    <n-space justify="center">
      <n-space vertical align="start">

        <n-tooltip trigger="hover" :placement="LANDSCAPE ? 'left-start' : 'top-start'" :keep-alive-on-hover="false">
          <template #trigger>
            <n-space align="center">
              <n-icon><FileImageRegular /></n-icon>{{Labels.imageType}}:
              <n-select size="small" v-model:value="UserSettings.imageFormat" :options="formatList" :consistent-menu-width="false" />
            </n-space>
          </template>
          {{Labels.imageTypeTooltip}}
        </n-tooltip>

        <n-tooltip trigger="hover" :placement="LANDSCAPE ? 'left-start' : 'top-start'" :keep-alive-on-hover="false">
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

        <n-tooltip trigger="hover" :placement="LANDSCAPE ? 'left-start' : 'top-start'" :keep-alive-on-hover="false">
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
        v{{VERSION}}
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

  <!-- processing modal dialog -->
  <n-modal v-model:show="showProcess" :closable="!processing" :close-on-esc="!processing" @after-leave="sendMessage=['destroy']" @mask-click="sendMessage=['destroy']" preset="dialog" :title="processingMessage" :type="processingType" :mask-closable="false" :on-after-leave="beforeClose">
    <template #default>
    <n-space vertical align="center">

      <n-progress type="circle" :percentage="percentage" color="lime" indicator-text-color="black" rail-color="silver">
        <n-space vertical align="center" justify="center">
          <div style="font-size:x-large;">{{percentage}}%</div>
        </n-space>
      </n-progress>

      <!-- filename -->
      <n-space vertical align="center" item-style="overflow:hidden; text-overflow: ellipsis; white-space:nowrap;">
        <!-- <n-spin v-if="processing" size="small" /> -->
        <n-space style="font-size:x-small;">
          <span>( {{currentSuccess}} / {{currentLength}} )</span>
          <span>{{processingFileName}}</span>
        </n-space>
        <div style="height:90px;" ref="thumbnail"></div>
        <n-button size="small" v-if="imageLink" @click="openImage(imageLink.href)">{{Labels.open}}</n-button>
      </n-space>

      <p>{{Labels.inputSize}}: {{(inputTotalSize / 1024 |0).toLocaleString()}}KB {{Labels.outputSize}}: {{(outputTotalSize / 1024 |0).toLocaleString()}}KB</p>

      <!-- button cancel -->
      <n-button v-if="processing" size="large" ref="cancelbutton" round @click="onCancel">{{Labels.cancel}}</n-button>
      <n-space align="center" vertical>
        <!-- button save -->
        <n-button v-if="!processing && currentSuccess" size="large" style="font-size: large" round @click="download" color="lime">{{Labels.save}}</n-button>

        <!-- button close -->
        <n-button v-if="!processing" @click="showProcess = false" round size="small" style="font-size: small; margin-top:1em;">{{Labels.close}}</n-button>
      </n-space>


    </n-space>
    </template>
  </n-modal>
  <a href="#" ref="downloadlink" stlye="display:none"></a>

  <!-- prevented error -->
  <n-modal v-model:show="prevented" preset="dialog" type="error" positive-text="OK" title="Busy">{{Labels.interfered}}</n-modal>
</template>


<script setup lang="ts">
import { useRouter } from 'vue-router'
import Converter from './components/converter.vue'
import Licenses from './components/licenses.vue'
import { ref, reactive, watch, computed, onMounted, getCurrentScope, h } from 'vue'
import { NButton, NButtonGroup, NInput, NSelect, NSpace, NSlider, NInputNumber, NSwitch, NIcon, NProgress, NModal, NTooltip, NSpin, NCheckbox, NRadio, NRadioGroup, NCollapse, NCollapseItem } from 'naive-ui'
import { NMessageProvider, NNotificationProvider } from 'naive-ui'
import { NA, enUS, dateEnUS, jaJP, dateJaJP } from 'naive-ui'
import 'vfonts/RobotoSlab.css'
import { LogInOutline as LogInIcon, LogoGithub as Github, ImageOutline as FileImageRegular, ImageSharp as MdImage, FolderOpenOutline } from '@vicons/ionicons5'
import { DragDrop, World, Circle as UserNinja } from '@vicons/tabler'


const LabelsEnUS = {
  title: 'AVIF to JPEG "Offline" Batch Converter',
  droptarget: 'Drag & Drop AVIF Images to Convert',
  descriptions: [
    'This is a web application to batch convert AVIF(or WebP, etc) images to common image formats such as JPEG, PNG.',
    `It uses a browser's built-in function for the conversions, so <strong>no data will be sent</strong> to a server and is therefore <strong>fast</strong> and <strong>safe</strong>.`,
    'The converted images will be output as <strong>a zip file</strong> when multiple images are loaded.',
    //'Besides AVIF, it could load any other image formats <a href="https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types" target="_self" style="color:red">supported</a> by your browser.',
    'Requires <a href="https://caniuse.com/?search=avif" target="_self" style="color:red">latest</a> version of Firefox or Chrome to load AVIF images.',
  ],
  fileTypeRadioTitle: 'Choose Target File Extentions',
  fileTypeRadioOptions: {
    avif_only: 'Only ".avif" or ".webp"',
    all_images: 'All Image Types',
    all_files: 'All Types',
  },
  quality: 'Image Quality',
  qualitytooltip: 'Set image quality to convert',
  imageType: 'Image Type',
  imageTypeTooltip: 'Choose image type to convert',
  retainOriginalExtension: 'Keep Original Extension',
  retainExtTooltip: 'New extension is appended to original extension',

  ignoreFileExtensions: 'Load All File Types',
  ignoreExtTooltip: 'Try to load files that don\'t have image file extension',
  loadbutton: 'Load Images',
  loadbuttontooltip: 'Select your images from a dialog window',
  loadfolderbutton: 'Load A Whole Folder',
  loadfoldertooltip: `
    Convert all images in the selected folder and its subfolders, and add the converted images to a ZIP archive with relative path.<br>
    *It will show "Upload" button, but it actually doesn't upload anything.
  `,
  processing: 'Converting images',
  aborted: 'Aborted',
  incomplete: 'Some files failed to convert',
  completed: 'Completed',
  interfered: 'Currently Busy',
  noimage: 'No files with the extentions were found.',
  avifUnsupported: 'Your browser does not support AVIF. Please use latest version of Firefox or Google Chrome to convert AVIF images.',
  cancel: 'Cancel',
  inputSize: 'Input Size',
  outputSize: 'Output Size',
  save: 'Save',
  close: 'Close',
  open: 'Open the Image',

  confirmCloseDialog: `You have not saved the converted images yet.`,
};

const LabelsJaJP = {
  title: 'AVIF画像をJPEG画像へ「オフライン」で一括変換',
  droptarget: '変換したいAVIF画像をドラッグ&ドロップして下さい',
  descriptions: [
    'これはAVIF、又はWebP形式の画像を、JPEG、PNG等の一般的な形式へ一括変換するためのWebアプリです。',
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
  },
  quality: '画質設定',
  qualitytooltip: '出力する画像のクオリティを指定します',
  imageType: '画像形式',
  imageTypeTooltip: '出力する画像の形式を指定します',
  retainOriginalExtension: '元の拡張子を保持する',
  retainExtTooltip: '元の拡張子の後ろに新しい拡張子を付加します',

  ignoreFileExtensions: '全ての拡張子を読み込む',
  ignoreExtTooltip: '画像拡張子以外のファイルもロードできるか試行します',
  loadbutton: '画像をロード',
  loadbuttontooltip: 'ダイアログを開いて画像を選択します',
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
  open: '画像を開く',

  confirmCloseDialog: `まだ変換したファイルを保存していません。`,
};

const VERSION = '0.010';
const IS_SP = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/.test(navigator.userAgent);
const doc = document;
//const imageFormat = ref('image/png');
const formatList = ref([{
  label: 'image/png',
  value: 'image/png',
}]);

const UserSettings = reactive({
  imageFormat: 'image/png',
  imageQuality: 90,
  retainExtension: false,
});

const retainExtension = ref(false);
//const ignoreFileExtensions = ref(false);
const FileTypeRadioValues = ['avif_only', 'all_images', 'all_files'];
const imageTypeOption = ref(FileTypeRadioValues[0]);
const AcceptFileTypes = {
  avif_only: '.avif,.webp',
  all_images: ".jpg,.jpeg,.gif,.png,.webp,.avif,.bmp",
  all_files: ''
};

const percentage = ref(0);
const currentIndex = ref(0);
const currentSuccess = ref(0);
const currentLength = ref(0);
const LANDSCAPE = ref(true);
const processing = ref(false);
const prevented = ref(false);
const noimage = ref(false);
const unsaved = ref(false);
const nofiles = ref(false);
const avifUnsupported = ref(false);
const showProcess = ref(false);
const processingMessage = ref('');
const processingFileName = ref('');
const inputTotalSize = ref(0);
const outputTotalSize = ref(0);
const imageLink = ref(null);
const thumbnail = ref(null);
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
const inputFiles = ref(null);
const sendMessage = ref([]);
const downloadlink = ref(null);
const fileinput = ref(null);
const folderinput = ref(null);
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
}

onMounted(() => {
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
  // save UserSettings
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
  percentage.value = 0;
  imageLink.value = null;
  inputTotalSize.value = 0;
  outputTotalSize.value = 0;
  downloadButtonClicked = false;
  //console.log("start")
  processingMessage.value = Labels.value.processing;
}
function onProgress({length, index, name}) {
  currentIndex.value = index;
  percentage.value = index / length * 100 |0;//currentSuccess.value / length * 100 |0;
  processingMessage.value = Labels.value.processing;
  processingFileName.value = `${name}`;
}
function onImgLoad({img, width, height}) {
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
}
function onSuccess({img, name, index, success, inputSize, outputSize}) {
  currentSuccess.value = success;
  inputTotalSize.value += inputSize;
  outputTotalSize.value += outputSize;
  //const size = img.width > img.height ? 'width="48"' : 'height="48"';
  //sendMessage.value = [{content: ()=>h('div', {style:{fontSize:'xx-small'}, innerHTML:`${index}:<img src="${img.src}" ${size}>${name}`}), duration:0, placement:'bottom'}, 'success'];
}
function onFailure({name}) {
  //console.log("fail")
  sendMessage.value = [{description:`${name}`, duration:0}, 'warning'];
}
function onComplete({index, zip, aborted, success, length, img, name}) {
  //console.log("complete")
  const a = downloadlink.value;
  // set link to image file if the succeeded count is 1
  /*
  if( success ) {
    imageLink.value = {
      href: img,
      name
    };
    processingFileName.value = name;
  }
  */
  if( success === 1 ) {
    a.download = name;
    a.href = img;
  }
  else {
    const d = new Date();
    a.download = 'converted_'+(UserSettings.imageFormat.replace(/^image\//, ''))+'_'+d.getTime()+'.zip';
    a.href = zip;
  }
  if( !aborted ) {
    percentage.value = 100;
  }
  currentIndex.value = index;
  if( success === length ) {
    processingMessage.value = Labels.value.completed;
  }
  else {
    processingMessage.value = aborted? Labels.value.aborted : Labels.value.incomplete;
  }
  processing.value = false;
}
function checkLandScape() {
  const w = document.body.clientWidth * 0.7;
  const h = document.body.clientHeight;
  LANDSCAPE.value = w > h;
}
function download() {
  const a = downloadlink.value;
  a.click();
  downloadButtonClicked = true;
}
function close() {

}
function beforeClose() {
  if( currentSuccess.value && !downloadButtonClicked ) {
    unsaved.value = true;
  }
  else {
    downloadlink.value.href= '';
  }
}
async function openImage(url) {
  //if( /\bmsie\b|\bedge\b/.test(navigator.userAgent.toLowerCase()) ) {
  const w = window.open('about:blank', '_openimage');
  await new Promise(r => setTimeout(r, 1000));
  w.document.write(`<img src="${url}">`);
  /*
  }
  else
    window.open(url, '_openimage');
  */
}
function getLanguage(): string {
  const navigator = window.navigator as any;
  return navigator.language || navigator.userLanguage || navigator.browserLanguage;
}
function log(msg) {
  console.log(msg);
}
</script>

<style>
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