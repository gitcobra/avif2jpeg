<template>

<n-flex vertical justify="end">
  <n-divider style="margin:0px;" />
  <n-flex justify="center">
    <ul style="color:gray; padding-left:20px;">
      <li v-for="text in $tm('descriptions')" :key="text" style="text-align:left" v-html="text"></li>
    </ul>
  </n-flex>
</n-flex>

</template>

