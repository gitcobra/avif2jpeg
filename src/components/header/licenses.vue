<template>
<n-button text @click="visible=true" style="color:black; font-size:small">Licenses</n-button>
<n-modal preset="dialog" ref="dialog" v-model:show="visible" positive-text="OK" title="Licenses">
  <h3>Used Framework and Libraries</h3>
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
  'Vite': 'https://github.com/vitejs/vite/blob/main/LICENSE',
  'Vite SSG': 'https://github.com/antfu/vite-ssg/blob/main/LICENSE',
  'Naive UI': 'https://github.com/TuSimple/naive-ui/blob/main/LICENSE',
  'Ionicons': 'https://github.com/ionic-team/ionicons/blob/main/LICENSE',
};

</script>
