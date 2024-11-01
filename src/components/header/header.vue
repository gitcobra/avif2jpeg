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
        <slot name="lang-switch"></slot>
      </n-space>
    </n-space>

    <n-divider style="margin:0px;" />
  </n-space>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Github from './github.vue';
import Licenses from './licenses.vue'
import Version from './version.vue';
</script>
