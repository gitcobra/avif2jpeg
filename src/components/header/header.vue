<template>
  <n-space vertical justify="start">
    <n-space justify="space-between" style="box-sizing:border-box; padding:4px; margin:0px;">      

      <n-space align="start">
        <Github/>

        <Version/>
        
        <n-space align="center">
          <Licenses/>
        </n-space>

      </n-space>
      
      <!-- language switches -->
      <n-space align="end" style="font-size: x-small;">          
        <router-view>
          <Suspense>
          <SwitchLanguages @lang-ready="emit('ready')"/>
          </Suspense>
        </router-view>
      </n-space>
    </n-space>

    <n-divider style="margin:0px;" />
  </n-space>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, inject } from "vue";
import { ImageOutline, FolderOpenOutline, SearchCircle } from '@vicons/ionicons5';
import { useI18n } from "vue-i18n";
import { GlobalValsKey } from "../../Avif2Jpeg.vue";
import SwitchLanguages from './switch-lang.vue';
import Github from './github.vue';
import Licenses from './licenses.vue'
import Version from './version.vue';


const emit = defineEmits<{
  'ready': []
}>();

// injections
const INJ = inject(GlobalValsKey);

useI18n();
</script>
