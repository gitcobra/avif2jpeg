<script setup lang="ts">
const props = defineProps<{
  successPerc: number;
  elapsedTime: string;
  
  threads: number;
  fileType: string;
  shrink: [number, number] | null;
  zipSize: number;

  inputTotalSize: number;
  outputTotalSize: number;

  rateColor: string;
  difColor: string;
  totalSizeDifStr: string;
}>();

</script>

<template>
  <n-collapse-item name="progress" style="white-space:nowrap;">
    <template #header="{collapsed}">
      <n-flex>
        {{ $t('status.Progress') }}
        <template v-if="collapsed">
          ({{ successPerc |0 }}%)
        </template>
      </n-flex>
    </template>
    <n-flex justify="center" align="center" :wrap="false" style="white-space: nowrap; margin-top:-2em; padding-bottom:5px;">

      <!-- left column -->
      <n-flex vertical justify="center" class="left-column">
  
        <n-statistic tabular-nums :label="$t('status.elapsedTime')">
          <n-flex>
            {{ elapsedTime }}
          </n-flex>
        </n-statistic>

        <n-statistic tabular-nums :label="$t('status.multiThreading')">
          <n-flex :style="{color: !threads ? 'red' : '', fontSize: '0.7rem'}">
            {{ threads ? $rt('{n} @:threads', threads) : $t('disabled') }}
          </n-flex>
        </n-statistic>

        <n-statistic tabular-nums :label="$t('status.outputSettings')">
          <n-flex vertical justify="end" style="font-size: 0.6rem; line-height:0.6rem;">
            <div>{{$t('settings.imageType')}}: {{ fileType }}</div>
            <div v-if="shrink">{{$t('status.Shrinking')}}: <span style="">{{shrink[0]}}×{{shrink[1]}}</span></div>
            <div>Zip: {{ zipSize }}MB</div>
          </n-flex>
        </n-statistic>

      </n-flex>

      <!-- center column -->
      <slot name="center"/>

      <!-- right column -->
      <n-flex vertical style="height:100%;" justify="center" class="right-column">
        <n-statistic tabular-nums :label="$t('status.inputSize')">
          <n-flex justify="end" :wrap="false" style="font-family:v-mono;">{{(inputTotalSize / 1024 | 0).toLocaleString('en-us')}} KB</n-flex>
        </n-statistic>

        <n-statistic tabular-nums :label="$t('status.outputSize')">
          <n-flex justify="end" :wrap="false" style="font-family:v-mono;">{{(outputTotalSize / 1024 | 0).toLocaleString('en-us')}} KB</n-flex>
        </n-statistic>

        <n-statistic tabular-nums :label="$t('status.outInRate')">
          <n-flex vertical align="end" justify="start" style="font-size: 0.8em; font-family:v-mono; line-height:50%;">
            <span :style="{color:rateColor, fontSize:'larger'}">× {{ (outputTotalSize / inputTotalSize || 1).toFixed(2) }}</span>
            <span :style="{color:difColor}">({{ totalSizeDifStr }})</span>
            
          </n-flex>
        </n-statistic>
      </n-flex>

    </n-flex>
  </n-collapse-item>
</template>

<style scoped lang="scss">
.right-column {
  width: 8em;
}

.left-column {
  height:100%;
}
.center-column {
  width: 10rem;
  font-size: 1rem;
}
@media screen and (max-width: 580px) {
	.left-column {
    > * {
      display: none;
    }
  }
  .center-column {
  }
  .hide-mobile {
    display: none;
  }
}


</style>