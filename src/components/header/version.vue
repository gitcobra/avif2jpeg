<template>
  v{{verStr}}
</template>

<script setup lang="ts">
import Ver from '@/version.json';
const verStr: string = `${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;
</script>
