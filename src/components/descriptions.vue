<template>
<ul style="color:gray; padding-left:20px;">
  <li v-for="text in $tm('descriptions')" :key="text" style="text-align:left" v-html="text"></li>
</ul>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
</script>
