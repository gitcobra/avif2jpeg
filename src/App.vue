<template>
  <n-config-provider :theme-overrides="themeOverrides" style="width:100%; height:100%;">
  <n-loading-bar-provider>
  <n-notification-provider placement="top-right" :max="20">
  <n-message-provider placement="top-left" :closable="true" :max="50">
  <n-dialog-provider>
  <n-modal-provider>
    <Avif2Jpeg :class="{hide}" />
  </n-modal-provider>
  </n-dialog-provider>
  </n-message-provider>
  </n-notification-provider>
  </n-loading-bar-provider>
  </n-config-provider>
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
};

// hide SSGed html until mounted
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
