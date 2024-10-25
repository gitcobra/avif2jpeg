<script lang="ts">
// for provide
import { type InjectionKey, type Ref } from 'vue';

export const GlobalValsKey: InjectionKey<{
  LANDSCAPE: Ref<boolean>
  showBeforeMounted: Ref<boolean>
  IS_SP: boolean
  switchToolTipVisibility: Function
}> = Symbol('global variables');
</script>

<script setup lang="ts">
import { UserSettings } from './user-settings';
import { useI18n } from 'vue-i18n'
import { useHead } from "@vueuse/head";

import 'vfonts/RobotoSlab.css';
import { ArrowDown } from '@vicons/ionicons5';


import Header from './components/header/header.vue';
import Title from './components/title.vue';
import Converter from './components/converter/converter.vue'
import FileSelector from './components/file-selector.vue'
import OutputSettings from './components/settings-output.vue';
import AdvancedSettings from './components/settings-adv.vue';
import Descriptions from './components/descriptions.vue';
import LangFlag from './components/lang-flag.vue';




const { t, locale } = useI18n();

// constants

// detect smartphone
const IS_SP = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/.test(navigator.userAgent);



// reactive values

const inputConversionFiles = ref(null);
const availableThreadCount = ref(2);

let showBeforeMounted = ref<boolean | undefined>(false);
const LANDSCAPE = ref(true);
const processing = ref(false);
const mounted = ref(false);








provide(GlobalValsKey, {
  showBeforeMounted,
  LANDSCAPE,
  IS_SP,
  switchToolTipVisibility,
});


// insert meta tags

useHead({
  // Can be static or computed
  //title: t('title'),
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



// on mounted

onMounted(() => {
  // remove style for svg size fix
  //document.querySelector('head').removeChild(document.getElementById('svgfix'));
  
  
  checkLandScape();
  window.addEventListener('resize', checkLandScape);

  switchToolTipVisibility();
  setTimeout(() => mounted.value = true, 1000);
});





// functions


async function switchToolTipVisibility() {
  setTimeout(() => showBeforeMounted.value = true, 200);
  setTimeout(() => showBeforeMounted.value = undefined, 300);
}

function checkLandScape() {
  const w = document.body.clientWidth;
  const h = document.body.clientHeight;
  LANDSCAPE.value = w * 0.75 > h || w > 900;
}

function onInputFile(list: File[]) {
  inputConversionFiles.value = list;
}

</script>








<template>

  <n-flex vertical align="stretch" justify="start" style="height:100%; position: relative;">
    <Header/>
    
    <transition :name="mounted ? 'fade' : ''" mode="out-in">
    <n-flex :key="locale" vertical align="stretch" justify="space-between" style="height:100%;">    
      <Title/>

      <n-space justify="center">
        <FileSelector
          v-model:expanded="UserSettings.expandExtButtons"
          v-model:target="UserSettings.acceptTypeValue"
          v-model:userExtensions="UserSettings.editedAcceptTypes"
          :forbidden="processing"
          @input="onInputFile"
        />
      </n-space>
      
      <!-- core component -->
      <Converter
        :input="inputConversionFiles"
        :format="UserSettings.imageFormat"
        :quality="UserSettings.imageQuality"
        :retain-extension="UserSettings.retainExtension"
        :maxZipSizeMB="UserSettings.maxZipSizeMB"
        :threads="UserSettings.multithread ? UserSettings.threadCount : 0"
        
        @start="processing=true"
        @end="processing=false"
        @multi-thread-count="val => availableThreadCount = val"
      />

      <n-space vertical align="center">
        <n-popover trigger="manual" placement="top" :keep-alive-on-hover="false" :duration="0" :delay="0">
        <template #trigger>
          <n-icon size="4vh" color="#DADADA" style="margin:0px;"><ArrowDown/></n-icon>
        </template>
        <span>CONVERT TO👇</span>
        </n-popover>
      </n-space>

      <n-space vertical align="center">  
        <OutputSettings
          v-model:format="UserSettings.imageFormat"
          v-model:quality="UserSettings.imageQuality"
        />

        <AdvancedSettings
          v-model:retain-ext="UserSettings.retainExtension"
          v-model:max-zip-size="UserSettings.maxZipSizeMB"
          v-model:expanded="UserSettings.expandAdvSettings"
          v-model:multithread="UserSettings.multithread"
          v-model:thread-count="UserSettings.threadCount"
          
          :thread-max="availableThreadCount || 0"
        />
        
      </n-space>
      
      <Descriptions/>
    </n-flex>
    </transition>
  
  </n-flex>
  <!-- <LangFlag/> -->
</template>








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
