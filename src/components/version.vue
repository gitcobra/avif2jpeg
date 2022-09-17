<template>
  v{{verStr}}
</template>

<script setup lang="ts">
import Ver from './version.json'
const verStr: string = `${Ver.major}.${String(Ver.build).padStart(3, '0')}${Ver.tag}`;
</script>
