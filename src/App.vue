<template>
  <n-config-provider :locale="locale" :date-locale="dateLocale" style="max-width:800px; height:100%; box-sizing:border-box; margin:0px auto; padding:0px;">
    <n-space vertical align="stretch" justify="space-between" style="padding:0px; margin:0px; height:100%; box-sizing:border-box;">
      <n-space justify="end" align="center" style="box-sizing:border-box; width:100%; padding:4px; margin:0px;">
        <n-button-group size="tiny" style="padding:4px;">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button round :color="!langJA? 'red':''" @click="langJA=false">
                <n-icon><World /></n-icon> English
              </n-button>
            </template>
            Switch to English
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button round :color="langJA? 'red':''" @click="langJA=true">
                日本語 <n-icon><UserNinja /></n-icon>
              </n-button>
            </template>
            日本語に切り替え
          </n-tooltip>
        </n-button-group>
      </n-space>

      <n-space vertical align="center" justify="center">
        <h1>AVIF to JPEG Converter</h1>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button round @click="fileinput.click()">
              <n-icon size="large" color="gray"><FileImageRegular /></n-icon>
              {{Labels.loadbutton}}
            </n-button>
          </template>
          {{Labels.loadbuttontooltip}}
        </n-tooltip>
        <input id="fileinput" ref="fileinput" type="file" multiple accept=".jpg,.jpeg,.gif,.png,.webp,.avif,.bmp" style="display:none">
      </n-space>

      <n-notification-provider placement="top-right">
      <n-message-provider placement="top-right" :closable="true" container-style="font-size:xx-small;">
      <converter
        :target="doc"
        :format="imageFormat"
        :quality="quality"
        :input="inputFiles"
        :sendmessage="sendMessage"
        :processing="processing"
        @mounted="onConverterReady" @start="onStart" @progress="onProgress" @success="onSuccess" @failure="onFailure" @complete="onComplete"
        @prevent="onPrevent"
      >

        <div style="text-align:center; color:silver; ">
          <h3>{{Labels.droptarget}}</h3>
          <p>
          <n-icon size="64" color="silver"><DragDrop /></n-icon>
          </p>

          <ul style="font-size:small; margin:20px; color:gray;">
            <li v-for="text in Labels.descriptions" :key="text" style="text-align:left" v-html="text"></li>
          </ul>
        </div>
      </converter>
      </n-message-provider>
      </n-notification-provider>

      <n-space align="end" justify="space-between" style="box-sizing: border-box; width:100%; padding:8px;">
        <n-space align="center">
          <n-space align="center">
            <a href="https://github.com/gitcobra/avif2jpeg" style="color:black; font-size:small;"><n-icon><Github /></n-icon>GitHub</a>
          </n-space>
          <n-space align="center">
            <licenses />
          </n-space>
        </n-space>


        <n-space vertical>

          <n-tooltip trigger="hover" placement="left-start">
            <template #trigger>
              <n-space align="center">
                <n-icon><FileImageRegular /></n-icon>{{Labels.imageType}}:
                <n-select size="small" v-model:value="imageFormat" :options="formatList" />
              </n-space>
            </template>
            {{Labels.imageTypeTooltip}}
          </n-tooltip>

          <n-tooltip trigger="hover" placement="left-start">
            <template #trigger>
            <n-space align="center">
              <n-icon><MdImage /></n-icon>{{Labels.quality}}:
              <n-slider :tooltip="false" v-model:value="quality" step="1" style="width:120px;" :disabled="/png/.test(imageFormat)" />
              <n-input-number style="width:90px;" size="small" v-model:value="quality" step="1" min="0" max="100" :disabled="/png/.test(imageFormat)" />
            </n-space>
            </template>
            {{Labels.qualitytooltip}}
          </n-tooltip>
        </n-space>


      </n-space>


    </n-space>

    <!-- processing modal dialog -->
    <n-modal v-model:show="showProcess" @after-leave="sendMessage=['destroy']" @mask-click="sendMessage=['destroy']" preset="dialog" :title="processingMessage" :type="processingType" :mask-closable="false">
      <template #default>
      <n-space vertical align="center">

        <n-progress type="circle" :percentage="percentage" color="lime" indicator-text-color="black" rail-color="silver">
          <n-space vertical align="center" justify="center">
            <div style="font-size:x-large;">{{percentage}}%</div>
            <div>{{currentSuccess}}/{{currentLength}}</div>
          </n-space>
        </n-progress>

        <!-- filename -->
        <n-space vertical align="center" item-style="overflow:hidden; text-overflow: ellipsis; white-space:nowrap; font-size:xx-small;">
          <!-- <n-spin v-if="processing" size="small" /> -->
          {{processingFileName}}
          <n-button size="small" v-if="imageLink" href="#" @click="openImage(imageLink.href)">{{Labels.open}}</n-button>
        </n-space>

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
    <n-modal v-model:show="prevented" preset="dialog" :title="Labels.interfered" type="error"></n-modal>

  </n-config-provider>
</template>


<script setup lang="ts">
import Converter from './components/converter.vue'
import Licenses from './components/licenses.vue'
import { ref, reactive, watch, computed, onMounted, getCurrentScope, h } from 'vue'

import { NButton, NButtonGroup, NInput, NSelect, NSpace, NSlider, NInputNumber, NSwitch, NIcon, NProgress, NModal, NTooltip, NIon, NSpin } from 'naive-ui'
import { NMessageProvider, NNotificationProvider } from 'naive-ui'
import { NConfigProvider, enUS, dateEnUS, jaJP, dateJaJP } from 'naive-ui'

import 'vfonts/RobotoSlab.css'
import { LogInOutline as LogInIcon, LogoGithub as Github, ImageOutline as FileImageRegular, ImageSharp as MdImage } from '@vicons/ionicons5'
import { DragDrop, World, Circle as UserNinja } from '@vicons/tabler'

import { NThemeEditor } from 'naive-ui'

const LabelsEnUS = {
  droptarget: 'Drag & Drop AVIF Images to Convert Here',
  descriptions: [
    'This is a web application to convert AVIF(or WebP, etc) images into common image formats such as JPEG、PNG',
    'Requires <a href="https://caniuse.com/?search=avif" target="_self" style="color:red">latest</a> FireFox or Chrome to load AVIF images',
    'It loads and converts and outputs your images on the client side, so <strong>no data will be sent</strong> to the server',
    'The converted images will be output as a zip file when multiple images are loaded',
    'Besides AVIF, it could load any other image formats <a href="https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types" target="_self" style="color:red">supported</a> by your browser',
  ],
  quality: 'Image Quality',
  qualitytooltip: 'Set Image Quality',
  imageType: 'Image Type',
  imageTypeTooltip: 'Choose Image Type to Export',
  loadbutton: 'Load Images',
  loadbuttontooltip: 'Select Your Images from a dialog window',

  processing: 'Converting images',
  aborted: 'Aborted',
  incomplete: 'Some files failed to convert',
  completed: 'Completed',
  interfered: 'Currently Busy',
  cancel: 'cancel',

  save: 'Save',
  close: 'Close',
  open: 'Open the Image',
};
const LabelsJaJP = {
  droptarget: '変換したいAVIF画像をドラッグ&ドロップして下さい',
  descriptions: [
    'これはAVIFやWebP等の画像をJPEG、PNG等へ変換するためのWebアプリです',
    'AVIF画像のロードには<a href="https://caniuse.com/?search=avif" target="_self" style="color:red">最新</a>のFireFox又はChromeが必要です',
    '変換処理は全てこのページ上で行われるため、データがサーバ等へ<strong>送信される事はありません</strong>',
    '複数枚の画像が読み込まれた場合、変換した画像はZIPファイルに纏めて出力されます',
    'AVIF以外の画像でも、ブラウザが<a href="https://developer.mozilla.org/ja/docs/Web/Media/Formats/Image_types" target="_self" style="color:red">対応している形式</a>であれば変換が実行されます',
  ],

  quality: '画質設定',
  qualitytooltip: '出力画像のクオリティを指定する',
  imageType: '画像形式',
  imageTypeTooltip: '出力画像形式を指定する',
  loadbutton: '画像を開く',
  loadbuttontooltip: 'ダイアログを開いて画像を選択',

  processing: '画像変換中',
  aborted: '中断',
  incomplete: '変換に失敗したファイルがあります',
  completed: '変換終了',
  interfered: '既に処理中です',
  cancel: 'キャンセル',

  save: '保存',
  close: '閉じる',
  open: '画像を開く',
};



const doc = document;
const imageFormat = ref('image/png');
const formatList = ref([{
  label: 'image/png',
  value: 'image/png',
}]);
const percentage = ref(0);
const currentIndex = ref(0);
const currentSuccess = ref(0);
const currentLength = ref(0);

const processing = ref(false);
const prevented = ref(false);
const showProcess = ref(false);

const processingMessage = ref('');
const processingFileName = ref('');
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

const Labels = ref(LabelsEnUS);
const langJA = ref(false);
const quality = ref(90);
let locale = ref(enUS);
let dateLocale = ref(dateEnUS);

onMounted(() => {
  document.getElementById('fileinput').oninput = (ev) => {
    const list = [...(ev.target as HTMLInputElement).files as FileList];
    inputFiles.value = list;
    document.getElementById('fileinput').value = '';
  };
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
  //console.log("start")
  processingMessage.value = Labels.value.processing;
}
function onProgress({length, index, name}) {
  currentIndex.value = index;
  percentage.value = index / length * 100 |0;//currentSuccess.value / length * 100 |0;
  processingMessage.value = Labels.value.processing;
  processingFileName.value = `${name}`;
}
function onSuccess({img, name, index, success}) {
  currentSuccess.value = success;
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
function onPrevent() {
  prevented.value = true;
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
  padding: 0px;
  margin: 0px;
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
