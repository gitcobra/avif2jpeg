<template>
<a href="#" @click="visible = true" style="color:black; font-size:small">Licenses</a>
<n-modal preset="card" ref="dialog" v-model:show="visible">
  <h3>Licenses of Used Framework and Libraries</h3>
  <ul>
    <li v-for:="(value, key) in Licenses"><a :href="value">{{key}}</a></li>
  </ul>
</n-modal>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import { NModal } from 'naive-ui';

const visible = ref(false);

const Licenses = {
  'Vue': 'https://github.com/vuejs/core/blob/main/LICENSE',
  'Naive UI': 'https://github.com/TuSimple/naive-ui/blob/main/LICENSE',
  'tabler': 'https://github.com/tabler/tabler-icons/blob/master/LICENSE',
  'Ionicons': 'https://github.com/ionic-team/ionicons/blob/main/LICENSE',
};

</script>

<style scoped>

</style>
