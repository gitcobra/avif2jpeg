<template>
  <n-flex vertical justify="start">
    <n-flex justify="space-between" align="center" :wrap="false">

      <n-flex align="center">
        <Github/>
        
        <Version/>
        
        <Licenses/>
        
        <n-flex style="font-size:small">
          <a href="/" v-if="route.path !== '/'">HOME</a>
        </n-flex>

      </n-flex>
      
      <!-- language switches -->
      <n-flex align="end" style="font-size: x-small;">          
        <slot name="lang-switch"></slot>
      </n-flex>
    </n-flex>

    <n-divider style="margin:0px;" />
  </n-flex>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Github from './github.vue';
import Licenses from './licenses.vue'
import Version from './version.vue';
const route = useRoute();

</script>
