
<template>
  <n-tooltip :to="false" display-directive="show" :show="INJ.showBeforeMounted.value" trigger="hover" :duration="0" :delay="50">
    <template #trigger>
      <n-a href="https://github.com/gitcobra/avif2jpeg" style="color:black; font-size:small; font-weight: bolder;"><n-icon><LogoGithub /></n-icon>GitHub</n-a>
    </template>
    {{ $t('githubOpenSource') }}
  </n-tooltip>
</template>

<script setup lang="ts">
import { LogoGithub } from '@vicons/ionicons5';
import { inject } from "vue";
import { GlobalValsKey } from "../../Avif2Jpeg.vue";

// injections
const INJ = inject(GlobalValsKey);

</script>


