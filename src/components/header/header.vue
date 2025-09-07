<template>

  <n-flex vertical justify="start">
    <n-flex justify="space-between" align="center" :wrap="false">

      <n-flex align="center">
        
        <Github/>

        <Version/>
        
        <ChangeLog url="/avif2jpeg/dist/commits.txt" />
        
        <Licenses/>
        
        <n-flex style="font-size: 1em;">
          <router-link v-if="route.path !== '/'" to="/" style="color:black;">HOME</router-link>
        </n-flex>

      </n-flex>
      
      <!-- language switches -->
      <n-flex align="end" id="langtarget">
        <slot name="lang-switch"></slot>
      </n-flex>
    </n-flex>

    <n-divider style="margin:0px;" />
  </n-flex>
</template>

<script setup lang="ts">
import Github from './github.vue';
import Licenses from './licenses.vue'
import Version from './version.vue';
import ChangeLog from './changelog.vue';

import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LANG_ID_LIST } from '@/i18n';


const route = useRoute();
// FIXME: Without this, i18n of components before switch-lang.vue will not take effect during SSG.
const { locale } = useI18n();
if( import.meta.env.SSR ) {
  const pathlang = route.path.match(/[^/]+(?=\/?$)/)?.[0];
  locale.value = LANG_ID_LIST.includes(pathlang) ? pathlang : 'en';
}


</script>
