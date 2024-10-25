<template>
  <n-space align="center" justify="center" style="margin:0px;">
    <h1 style="padding:0px; margin:0px; text-align:center;">
      <span v-if="isLangRoot">{{$t('title')}}</span>
      <router-link v-else to="../" #="{ navigate, href }" custom>
        <n-a :href="href" @click="navigate" style="color:black; word-break: keep-all; overflow-wrap: break-word;">{{$t('title')}}</n-a>
      </router-link>
    </h1>
  </n-space>
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
