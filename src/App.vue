<template>
  <n-config-provider :theme-overrides="themeOverrides" style="width:100%; height:100%;">
  <n-loading-bar-provider>
  <n-message-provider placement="top-left" :closable="true" :max="50">
  <n-dialog-provider>
  <n-modal-provider>
    <Avif2Jpeg :class="{hide}" />
  </n-modal-provider>
  </n-dialog-provider>
  </n-message-provider>
  </n-loading-bar-provider>
  </n-config-provider>

  <div v-if="hide" style="text-align: center;">
    Rendering the page… please wait.
  </div>
</template>

<script setup lang="ts">
import Avif2Jpeg from "./Avif2Jpeg.vue";
import { GlobalThemeOverrides } from "naive-ui";



const themeOverrides: GlobalThemeOverrides = {
  Statistic: {
    valueFontSize: '1em',
  },
  Popover: {
    //color: 'black',
    //textColor: 'white',
    borderRadius: '0.4em',
    //color: '#777777',
    boxShadow: '2px 2px 5px 0px #555555',
  },
  Tooltip: {
    // transparency
    //color: '#000000AA', 
  },
  Image: {
    toolbarColor: '#00000099',
  },
};

// hide SSGed html until app has mounted
const hide = ref(true);
onMounted(() => {
  hide.value = false;
});

</script>

<style lang="scss">

.hide {
  visibility: hidden;
}

</style>
