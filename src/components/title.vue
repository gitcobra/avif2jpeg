<template>
  <n-flex vertical align="center" justify="center" style="margin:0px;" :size="1">
    <h1 class="title">
      <img src="/pwa-64x64.png" style="height: 1em; vertical-align: middle;">
      {{$t('title')}}
    </h1>
  </n-flex>
</template>

<script setup lang="ts">
const router = useRouter();

// whether current page is on language root path
const isLangRoot = computed(() => {
  const currentPath = router.currentRoute.value.path || '';
  const langPath = String(currentPath.match(/(?<=^\/)[^/]+/) || '');
  
  return !langPath;
});
</script>

<style scoped lang="scss">
.title {
  padding:0px; margin:0px; text-align:center;
  line-height: 1em;
}
.subtitle {
  text-decoration: underline;
  text-decoration-color: gray;
  text-decoration-style: double;
}
</style>
