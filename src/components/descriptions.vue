<template>

<n-space vertical justify="end">
  <n-divider style="margin:0px;" />
  <n-space justify="center">
    <ul style="color:gray; padding-left:20px;">
      <li v-for="text in $tm('descriptions')" :key="text" style="text-align:left" v-html="text"></li>
    </ul>
  </n-space>
</n-space>

</template>

