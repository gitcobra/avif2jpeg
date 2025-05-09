<template>
  <n-flex vertical justify="start">
    <n-flex justify="space-between" align="center" :wrap="false">

      <n-flex align="center">
        <Github/>
        
        <ChangeLog url="/avif2jpeg/dist/commits.txt" />
        <Version/>
        
        <!--
        <Licenses/>
        -->
        
        <n-flex style="font-size: 1em; color:black;">
          <router-link v-if="route.path !== '/'" to="/">HOME</router-link>
        </n-flex>

      </n-flex>
      
      <!-- language switches -->
      <n-flex align="end">
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
const route = useRoute();

</script>
