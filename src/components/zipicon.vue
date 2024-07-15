<template>
<span style="position:relative; width:50px; height:50px; overflow:visible">
  <span style="position:absolute; transform: rotate(25deg); overflow:visible">
    <n-icon depth="4" size="30" color="lime"><Archive /></n-icon>
    <span style="position:absolute; left:28px; bottom:4px; transform: rotate(25deg); white-space:nowrap; font-size:small; font-family:impact; color:rgba(0,255,0, 0.5)">ZIP</span>
  </span>
</span>
</template>

<script setup>
import {NIcon} from 'naive-ui';
import {Archive} from '@vicons/ionicons5';
</script>
