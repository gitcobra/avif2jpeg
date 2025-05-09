
<template>
  <n-tooltip :to="false" display-directive="show" :show="INJ.showTooltipsBeforeMounted.value" trigger="hover" :duration="0" :delay="0">
    <template #trigger>
      <a href="https://github.com/gitcobra/avif2jpeg" style="color:black; font-weight: bolder;">
        <n-flex align="center" :size="0">
        <n-icon size="1.2em"><LogoGithub /></n-icon>GitHub
        </n-flex>
      </a>
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


