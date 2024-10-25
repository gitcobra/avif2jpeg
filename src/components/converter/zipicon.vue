<template>
  <span class="container">
    <n-icon><Archive /></n-icon>
    <span class="text">ZIP</span>
  </span>
</template>

<script setup>
import {NIcon} from 'naive-ui';
import {Archive} from '@vicons/ionicons5';
</script>

<style scoped lang="scss">
.container {
  position: relative;
  left: -0.1em;
  transform: rotate(-25deg);
}
.text {
  display: inline-block;
  position: relative;
  left:0.1em;
  bottom:0.3em; 
  transform: rotate(35deg);
  white-space: nowrap;
  font-size: smaller;
  font-family: impact;
}
</style>
