<template>
  <n-config-provider :locale="locale" :date-locale="dateLocale" style="height:100%; box-sizing:border-box; margin:0px auto; padding:0px;">
    <n-space vertical align="stretch" justify="space-between" style="padding:0px; margin:0px; height:100%; box-sizing:border-box;">

      <n-space justify="end" align="end" style="box-sizing:border-box; padding:4px; margin:0px;">
        <n-button-group size="tiny" style="padding:4px;">
          <n-tooltip trigger="hover" :keep-alive-on-hover="false">
            <template #trigger>
              <n-button round :color="!langJA? 'red':''" @click="langJA=false">
                <n-icon><World /></n-icon> English
              </n-button>
            </template>
            Switch to English
          </n-tooltip>
          <n-tooltip trigger="hover" :keep-alive-on-hover="false">
            <template #trigger>
              <n-button round :color="langJA? 'red':''" @click="langJA=true">
                日本語 <n-icon><UserNinja /></n-icon>
              </n-button>
            </template>
            日本語に切り替え
          </n-tooltip>
        </n-button-group>
      </n-space>

      <n-space vertical justify="center">
        <h1 style="text-decoration:underline; text-decoration-style: double; text-align:center;">AVIF to JPEG "Offline" Converter</h1>
      </n-space>

      <n-space vertical align="center" justify="center">
        <n-space vertical align="stretch" justify="center">
          <!-- file select -->
          <input id="fileinput" ref="fileinput" type="file" multiple accept=".jpg,.jpeg,.gif,.png,.webp,.avif,.bmp" style="display:none">
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
          <input webkitdirectory directory id="folderinput" ref="folderinput" type="file" style="display:none">
          <n-tooltip v-if="!IS_SP" trigger="hover" placement="bottom" :keep-alive-on-hover="false">
            <template #trigger>
              <n-button round @click="folderinput.click()" style="width:100%;">
                <n-icon size="large" color="gray"><FolderOpenOutline /></n-icon>
                {{Labels.loadfolderbutton}}
              </n-button>
            </template>
            <div v-html="Labels.loadfoldertooltip"></div>
          </n-tooltip>

          <!-- option -->
          <n-tooltip trigger="hover" placement="bottom" :keep-alive-on-hover="false">
            <template #trigger>
              <n-checkbox v-model:checked="ignoreFileExtensions">
                {{Labels.ignoreFileExtensions}}
              </n-checkbox>
            </template>
            <div v-html="Labels.ignoreExtTooltip"></div>
          </n-tooltip>
        </n-space>
      </n-space>

      <!-- CONVERTER -->
      <n-notification-provider placement="top-right">
        <n-message-provider placement="top-right" :closable="true" container-style="font-size:xx-small;">
          <converter
            :target="doc"
            :format="imageFormat"
            :quality="quality"
            :input="inputFiles"
            :sendmessage="sendMessage"
            :processing="processing"
            :ignoreExtension="ignoreFileExtensions"
            @mounted="onConverterReady" @start="onStart" @progress="onProgress" @success="onSuccess" @failure="onFailure" @complete="onComplete"
            @prevent="prevented = true;"
            @noimage="noimage = true"
            @avifsupport="flag => avifUnsupported = !flag"
          >
            <div style="text-align:center; color:silver; padding:0.5em; overflow-wrap: break-word; word-break: keep-all; border: 0px dashed silver;">
              <p>
                <n-icon size="64" color="silver"><DragDrop /></n-icon>
              </p>
              <h3 v-html="Labels.droptarget"></h3>
            </div>
          </converter>
        </n-message-provider>
      </n-notification-provider>
      <!-- no image dialog -->
      <n-modal v-model:show="noimage" preset="dialog" type="error">{{Labels.noimage}}</n-modal>
      <n-modal v-model:show="avifUnsupported" preset="dialog" type="warning">{{Labels.avifUnsupported}}</n-modal>

      <!-- output settings -->
      <n-space justify="center">
        <n-space vertical align="start">

          <n-tooltip trigger="hover" :placement="landscape ? 'left-start' : 'top-start'" :keep-alive-on-hover="false">
            <template #trigger>
              <n-space align="center">
                <n-icon><FileImageRegular /></n-icon>{{Labels.imageType}}:
                <n-select size="small" v-model:value="imageFormat" :options="formatList" />
              </n-space>
            </template>
            {{Labels.imageTypeTooltip}}
          </n-tooltip>

          <n-tooltip trigger="hover" :placement="landscape ? 'left-start' : 'top-start'" :keep-alive-on-hover="false">
            <template #trigger>
            <n-space align="center">
              <n-space align="start" :wrap="false">
                <n-icon><MdImage /></n-icon><span style="white-space: nowrap;">{{Labels.quality}}:</span>
                <n-space align="center" justify="space-between">
                  <n-slider :tooltip="false" v-model:value="quality" step="1" style="width:120px;" :disabled="/png|bmp/.test(imageFormat)" />
                  <n-input-number style="width:90px;" size="small" v-model:value="quality" step="1" min="0" max="100" :disabled="/png/.test(imageFormat)" />
                </n-space>
              </n-space>
            </n-space>
            </template>
            {{Labels.qualitytooltip}}
          </n-tooltip>

        </n-space>
      </n-space>

      <!-- descriptions -->
      <n-space justify="center">
        <ul style="margin:20px; color:gray;">
          <li v-for="text in Labels.descriptions" :key="text" style="text-align:left" v-html="text"></li>
        </ul>
      </n-space>

      <!-- footer -->
      <n-space justify="center" align="baseline">
        <p style="font-size:x-small; text-align:center; margin:0px;">
          v{{VER}}
        </p>

        <n-space align="center">
          <n-space align="center">
            <a href="https://github.com/gitcobra/avif2jpeg" style="color:black; font-size:small;"><n-icon><Github /></n-icon>GitHub</a>
          </n-space>

          <n-space align="center">
            <licenses />
          </n-space>
        </n-space>
      </n-space>


    </n-space>

    <!-- processing modal dialog -->
    <n-modal v-model:show="showProcess" :closable="!processing" :close-on-esc="!processing" @after-leave="sendMessage=['destroy']" @mask-click="sendMessage=['destroy']" preset="dialog" :title="processingMessage" :type="processingType" :mask-closable="false">
      <template #default>
      <n-space vertical align="center">

        <n-progress type="circle" :percentage="percentage" color="lime" indicator-text-color="black" rail-color="silver">
          <n-space vertical align="center" justify="center">
            <div style="font-size:x-large;">{{percentage}}%</div>
            <div style="white-space:nowrap;">{{currentSuccess}}/{{currentLength}}</div>
          </n-space>
        </n-progress>

        <!-- filename -->
        <n-space vertical align="center" item-style="overflow:hidden; text-overflow: ellipsis; white-space:nowrap; font-size:xx-small;">
          <!-- <n-spin v-if="processing" size="small" /> -->
          <p>{{processingFileName}}</p>
          <n-button size="small" v-if="imageLink" href="#" @click="openImage(imageLink.href)">{{Labels.open}}</n-button>
        </n-space>

        <p>{{Labels.inputSize}}: {{(inputTotalSize / 1024 |0).toLocaleString()}}KB {{Labels.outputSize}}: {{(outputTotalSize / 1024 |0).toLocaleString()}}KB</p>

        <!-- button cancel -->
        <n-button v-if="processing" size="large" ref="cancelbutton" round @click="onCancel">{{Labels.cancel}}</n-button>
        <n-space align="center">
          <!-- button save -->
          <n-button v-if="!processing && currentSuccess" size="large" ref="downloadbutton" round @click="download" color="lime">{{Labels.save}}</n-button>
          <!-- button close -->
          <n-button v-if="!processing" @click="close" round>{{Labels.close}}</n-button>
        </n-space>


      </n-space>
      </template>
    </n-modal>
    <a href="#" ref="downloadlink" stlye="display:none"></a>

    <!-- prevented error -->
    <n-modal v-model:show="prevented" preset="dialog" type="error">{{Labels.interfered}}</n-modal>

  </n-config-provider>
</template>


<script setup lang="ts">
import Converter from './components/converter.vue'
import Licenses from './components/licenses.vue'
import { ref, reactive, watch, computed, onMounted, getCurrentScope, h } from 'vue'

import { NButton, NButtonGroup, NInput, NSelect, NSpace, NSlider, NInputNumber, NSwitch, NIcon, NProgress, NModal, NTooltip, NIon, NSpin, NCheckbox } from 'naive-ui'
import { NScrollbar, NMessageProvider, NNotificationProvider } from 'naive-ui'
import { NConfigProvider, enUS, dateEnUS, jaJP, dateJaJP } from 'naive-ui'

import 'vfonts/RobotoSlab.css'
import { LogInOutline as LogInIcon, LogoGithub as Github, ImageOutline as FileImageRegular, ImageSharp as MdImage, FolderOpenOutline } from '@vicons/ionicons5'
import { DragDrop, World, Circle as UserNinja } from '@vicons/tabler'

import { NThemeEditor } from 'naive-ui'

const LabelsEnUS = {
  droptarget: 'Drag & Drop AVIF Images<br>Here<br>to Convert',
  descriptions: [
    'This is a web application to convert AVIF(or WebP, etc) images into common image formats such as JPEG, PNG.',
    `It uses a browser's built-in function for the conversions, therefore <strong>no data will be sent</strong> to a server.`,
    'The converted images will be output as <strong>a zip file</strong> when multiple images are loaded.',
    //'Besides AVIF, it could load any other image formats <a href="https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types" target="_self" style="color:red">supported</a> by your browser.',
    'Requires <a href="https://caniuse.com/?search=avif" target="_self" style="color:red">latest</a> version of Firefox or Chrome to load AVIF images.',
  ],
  quality: 'Image Quality',
  qualitytooltip: 'Set image quality to export',
  imageType: 'Image Type',
  imageTypeTooltip: 'Choose image type to export',
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
  noimage: 'No image files',
  avifUnsupported: 'Your browser does not support AVIF. Please use latest version of Firefox or Google Chrome to convert AVIF images.',
  cancel: 'Cancel',
  inputSize: 'Input Size',
  outputSize: 'Output Size',

  save: 'Save',
  close: 'Close',
  open: 'Open the Image',
};
const LabelsJaJP = {
  droptarget: '変換したいAVIF画像を<br>ここへ<br>ドラッグ&ドロップして下さい',
  descriptions: [
    'これはAVIFやWebP等の画像を、JPEG、PNG等の一般的な形式へ変換するためのWebアプリです。',
    `変換処理にはブラウザの組み込み関数を利用するため、データがサーバーへ<strong>送信される事はありません</strong>。`,
    '複数枚の画像が読み込まれた場合、変換した画像は<strong>ZIPファイル</strong>に纏めて出力されます。',
    //'AVIF以外の画像も、ブラウザが<a href="https://developer.mozilla.org/ja/docs/Web/Media/Formats/Image_types" target="_self" style="color:red">対応している形式</a>であれば変換が実行されます。',
    'AVIF画像のロードには<a href="https://caniuse.com/?search=avif" target="_self" style="color:red">最新</a>のFirefox又はChromeが必要です。',
  ],

  quality: '画質設定',
  qualitytooltip: '出力する画像のクオリティを指定します',
  imageType: '画像形式',
  imageTypeTooltip: '出力する画像の形式を指定します',
  ignoreFileExtensions: '全ての拡張子を読み込む',
  ignoreExtTooltip: '画像拡張子以外のファイルもロードできるか試行します',

  loadbutton: '画像をロード',
  loadbuttontooltip: 'ダイアログを開いて画像を選択します',
  loadfolderbutton: 'フォルダごとロード',
  loadfoldertooltip: `
    選択したフォルダとサブフォルダの全ての画像に対して変換処理を行い、ZIP書庫へ相対パスで格納します。<br>
    ※「アップロード」というボタンが表示されますが実際にサーバーへのアップロードが行われる事はありません。
  `,

  processing: '画像変換中',
  aborted: '中断',
  incomplete: '変換に失敗したファイルがあります',
  completed: '変換終了',
  interfered: '既に処理中です',
  noimage: '画像ファイルがありません',
  avifUnsupported: 'このブラウザはAVIF形式に対応していません。AVIF画像を変換する場合は最新版のFirefox又はGoogle Chromeを使用して下さい。',
  cancel: 'キャンセル',
  inputSize: '入力サイズ',
  outputSize: '出力サイズ',

  save: '保存',
  close: '閉じる',
  open: '画像を開く',
};

const VER = '0.001';
const IS_SP = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/.test(navigator.userAgent);
const doc = document;
const imageFormat = ref('image/png');
const formatList = ref([{
  label: 'image/png',
  value: 'image/png',
}]);
const ignoreFileExtensions = ref(false);

const percentage = ref(0);
const currentIndex = ref(0);
const currentSuccess = ref(0);
const currentLength = ref(0);
const landscape = ref(true);

const processing = ref(false);
const prevented = ref(false);
const noimage = ref(false);
const avifUnsupported = ref(false);
const showProcess = ref(false);

const processingMessage = ref('');
const processingFileName = ref('');
const inputTotalSize = ref(0);
const outputTotalSize = ref(0);
const imageLink = ref(null);

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

const downloadbutton = ref(null);
const downloadlink = ref(null);
const fileinput = ref(null);
const folderinput = ref(null);
//const Directory_Available = ref(false);

const Labels = ref(LabelsEnUS);
const langJA = ref(false);
const quality = ref(90);
let locale = ref(enUS);
let dateLocale = ref(dateEnUS);

onMounted(() => {
  fileinput.value.oninput = folderinput.value.oninput = (ev) => {
    const list = [...(ev.target as HTMLInputElement).files as FileList];
    inputFiles.value = list;
    fileinput.value.value = '';
    folderinput.value.value = '';
  };

  checkLandScape();
  window.addEventListener('resize', checkLandScape);
  //Directory_Available.value = ['webkitdirectory', 'directory'].some(attr => typeof folderinput.value[attr] !== 'undefined');
});

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
});
if( /^ja\b/i.test(getLanguage()) ) {
  langJA.value = true;
}

function onConverterReady({formats}) {
  formatList.value = formats.map(val => {
    return {value:val, label:val}
  });

  const jpeg = formats.find(val => /jpeg/i.test(val));
  if( jpeg )
    imageFormat.value = jpeg;
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
  //console.log("start")
  processingMessage.value = Labels.value.processing;
}
function onProgress({length, index, name}) {
  currentIndex.value = index;
  percentage.value = index / length * 100 |0;//currentSuccess.value / length * 100 |0;
  processingMessage.value = Labels.value.processing;
  processingFileName.value = `${name}`;
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
    a.download = 'converted_'+(imageFormat.value.replace(/^image\//, ''))+d.getTime()+'.zip';
    a.href = zip;
  }

  percentage.value = 100;
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
  const w = document.documentElement.offsetWidth;
  const h = document.documentElement.offsetHeight;
  landscape.value = w > h;
}

function download() {
  const a = downloadlink.value;
  a.click();
}
function close() {
  showProcess.value = false;
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



</script>

<style>
html, body {
  padding: 0px 16px;
  margin: 0px auto;
  max-width: 1000px;
  height: 100%;
  background-color: white;
  color: black;
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
