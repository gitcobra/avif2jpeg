<script lang="ts">
import SwitchLanguages from './components/header/switch-lang.vue';
// for provide
import { type InjectionKey, type Ref } from 'vue';

export const GlobalValsKey: InjectionKey<{
  LANDSCAPE: Ref<boolean>
  showTooltipsBeforeMounted: Ref<boolean>
  IS_SP: boolean
  IS_DEV: boolean
  switchToolTipVisibility: Function
  SSR: boolean
}> = Symbol('global variables');
</script>

<script setup lang="ts">
import { UserSettings } from './user-settings';
import { useI18n } from 'vue-i18n'
import { useHead } from "@vueuse/head";

//import 'vfonts/FiraSans.css';
//import 'vfonts/IBMPlexSans.css';
//import 'vfonts/Inter.css';
//import 'vfonts/Lato.css';
//import 'vfonts/OpenSans.css';
import 'vfonts/Roboto.css';
//import 'vfonts/RobotoSlab.css';
import 'vfonts/FiraCode.css';

import { ArrowDown } from '@vicons/ionicons5';


import Header from './components/header/header.vue';
import Title from './components/title.vue';
import Converter from './components/converter/converter.vue'
import FileSelector from './components/file-selector.vue'
import OutputSettings from './components/settings-output.vue';
import AdvancedSettings from './components/settings-adv.vue';
import Descriptions from './components/descriptions.vue';

//import LangFlag from './components/lang-flag.vue';




const { t, locale } = useI18n();

const emit = defineEmits<{
  'ready': []
}>();


// constants
const TRANSTIME = 200;

// detect smartphone
const IS_SP = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/.test(navigator.userAgent);
const IS_DEV = process.env.NODE_ENV === 'development';


// reactive values

const inputConversionFiles = ref(null);
const availableThreadCount = ref(0);

let showTooltipsBeforeMounted = ref<boolean | undefined>(undefined);
const LANDSCAPE = ref(true);
const processing = ref(false);
const mounted = ref(false);

const contentVisible = ref(false);
const firstPageView = ref(true);

// for SSG
if( import.meta.env.SSR ) {
  contentVisible.value = true;
  showTooltipsBeforeMounted.value = true;
}

const showNote = ref(false);







// global variables

provide(GlobalValsKey, {
  showTooltipsBeforeMounted,
  LANDSCAPE,
  IS_SP,
  IS_DEV,
  switchToolTipVisibility,
  SSR: import.meta.env.SSR,
});






// on mounted

onMounted(() => {
  // remove style for svg size fix
  //document.querySelector('head').removeChild(document.getElementById('svgfix'));
  
  
  checkLandScape();
  window.addEventListener('resize', checkLandScape);

  switchToolTipVisibility();
  setTimeout(() => mounted.value = true, 3000);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkLandScape);
});




// functions

let transStartTime = 0;
function onLangChange() {
  if( import.meta.env.SSR )
    return;
  contentVisible.value = false;
  transStartTime = Date.now();
  //alert("onLangChange")
}
function onLangReady() {
  const dif = firstPageView.value ? 0 : Math.max(0, TRANSTIME - (Date.now() - transStartTime));
  firstPageView.value = false;
  nextTick(() => {
    setTimeout(() => contentVisible.value = true, dif);
  });
  //emit('ready');
}

async function switchToolTipVisibility() {
  if( !import.meta.env.SSR )
    return;
  
  showTooltipsBeforeMounted.value = true;
  setTimeout(() => showTooltipsBeforeMounted.value = undefined, 1000);
}

function checkLandScape() {
  const w = document.body.clientWidth;
  const h = document.body.clientHeight;
  LANDSCAPE.value = w * 0.75 > h || w > 900;
}

function onInputFile(list: File[]) {
  inputConversionFiles.value = list;
}

function onInputClick(flag: boolean) {
  showNote.value = flag;
}

</script>








<template>

  <n-flex vertical align="stretch" class="avif2jpeg">
    <Header>
      <template #lang-switch>
        <Suspense>
          <SwitchLanguages
            @lang-change="onLangChange"
            @lang-ready="onLangReady"
            :delay="firstPageView ? 0 : TRANSTIME"
          />
        </Suspense>
      </template>
    </Header>

    
    <transition name="fade">
    <n-flex v-show="contentVisible" vertical align="stretch" justify="space-between" style="height:100%;">
      <n-flex justify="space-around" vertical style="height:100%;">
        <Title/>
        <n-flex justify="center">
          <FileSelector
            _v-model_expanded="UserSettings.expandExtButtons"
            v-model:target="UserSettings.acceptTypeValue"
            v-model:userExtensions="UserSettings.editedAcceptTypes"
            v-model:disable-notifying-folder-select="UserSettings.disableNotifyingFolderSelect"
            :forbidden="processing"
            @input="onInputFile"
            @click="onInputClick(true)"
            @cancel="onInputClick(false)"
          />
        </n-flex>
        
        <!-- core component -->
        <Converter
          :input="inputConversionFiles"
          :format="UserSettings.imageFormat"
          :quality="UserSettings.imageQuality"
          :retain-extension="UserSettings.retainExtension"
          :maxZipSizeMB="UserSettings.maxZipSizeMB"
          :threads="UserSettings.multithread ? UserSettings.threadCount : 0"
          v-model:show-note="showNote"
          
          @start="processing=true"
          @end="processing=false"
        >
          <template #lang-switch>
            <!--
            <Suspense>
              <SwitchLanguages :delay="firstPageView ? 0 : TRANSTIME"/>
            </Suspense>
            -->
          </template>
        </Converter>

        <n-flex vertical align="center">
          <n-popover trigger="manual" placement="top" :keep-alive-on-hover="false" :duration="0" :delay="0">
          <template #trigger>
            <n-icon size="5vh" color="#DADADA" style="margin:0px;"><ArrowDown/></n-icon>
          </template>
          <span>CONVERT TO👇</span>
          </n-popover>
        </n-flex>

        <n-flex vertical align="center">  
          <OutputSettings
            v-model:format="UserSettings.imageFormat"
            v-model:quality="UserSettings.imageQuality"
          />

          <AdvancedSettings
            v-model:retain-ext="UserSettings.retainExtension"
            v-model:use-folder-name-for-zip="UserSettings.useFolderNameForZip"
            v-model:max-zip-size="UserSettings.maxZipSizeMB"
            _v-model:expanded="UserSettings.expandAdvSettings"
            v-model:multithread="UserSettings.multithread"
            v-model:thread-count="UserSettings.threadCount"
            _:thread-max="availableThreadCount"
            
            v-model:shrink-image="UserSettings.shrinkImage"
            v-model:max-width="UserSettings.maxWidth"
            v-model:max-height="UserSettings.maxHeight"
          />
          
        </n-flex>

        <Descriptions/>

      </n-flex> 
      
    </n-flex>

    </transition>

    <!-- <LangFlag/> -->
  
  </n-flex>

</template>








<style lang="scss">
@import '/node_modules/modern-normalize/modern-normalize.css';

html, body {
  box-sizing: border-box;
  height: 100%;
  background-color: white;
  color: black;
  padding: 4px;
  overflow-x: hidden;
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
  box-sizing: border-box;
  
  position: relative;
  height:100%;
}
.avif2jpeg {
  overflow: visible;
  height: 100%;
  max-width: 1024px;
  /*max-height: 900px;*/
  margin: 0px auto;
}


/* transitions */
.fade-enter-active {
  transition: all .4s ease;
}
.fade-leave-active {
  transition: all .1s ease;
}
.fade-leave-to, .fade-enter-from {
  opacity: 0;
}

</style>
