<script setup lang="ts">
import { onMounted, computed, watch, ref, inject } from "vue";
import { ImageSharp, ImageOutline } from '@vicons/ionicons5';
import { useI18n } from "vue-i18n";
import { GlobalValsKey } from "../Avif2Jpeg.vue";

// properties
const props = defineProps<{
  quality: number
  format: string
}>();

// emits
const emit = defineEmits<{
  'update:format': [string]
  'update:quality': [number]
}>();


const { t } = useI18n();

// injections
const INJ = inject(GlobalValsKey);

// data lists
const supportedFormats = ref<string[]>([]);
const Formats = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/avif',
  'image/webp',
];

// values
const format = computed({
  get: () => props.format,
  set: (val) => {
    val = checkFormat(val);
    emit('update:format', val);
  }
});
const quality = computed({
  get: () => props.quality,
  set: (val) => {
    emit('update:quality', val);
  }
});
const disableQuality = computed(() => /png|bmp/i.test(format.value));

// Nodes
const canvas = ref<HTMLCanvasElement | null>(null);


onMounted(() => {
  checkSupportedImageFormats();
});

function checkFormat(val) {
  if( supportedFormats.value.indexOf(val) < 0 ) {
    val = supportedFormats.value[0];
  }
  return val;
}

function checkSupportedImageFormats() {
  for( const f of Formats ) {
    const url = canvas.value.toDataURL(f);
    if( url.indexOf(f) >= 0 ) {
      supportedFormats.value.push(f);
    }
  }

  // if the list was empty there's something wrong
  if( supportedFormats.value.length === 0 )
    supportedFormats.value.push(Formats[0]);
}

</script>



<template>
  <n-space justify="center">
    
    <n-space vertical>
      <n-tooltip :to="false" display-directive="show" :show="INJ.showTooltipsBeforeMounted.value" trigger="hover" :placement="INJ.LANDSCAPE.value ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="0">
        <template #trigger>
          <n-space align="center">
            <n-icon><ImageOutline /></n-icon>{{t('settings.imageType')}}:
            <n-select v-model:value="format" :options="supportedFormats.map(value => ({value, label:value}))" :consistent-menu-width="false" size="small" />
          </n-space>
        </template>
        {{t('settings.imageTypeTooltip')}}
      </n-tooltip>

      <n-tooltip :to="false" display-directive="show" :show="INJ.showTooltipsBeforeMounted.value" trigger="hover" :placement="INJ.LANDSCAPE.value ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="0">
        <template #trigger>
          <n-space align="center">
            <n-space align="start" :wrap="false">
              <n-icon><ImageSharp /></n-icon><span style="white-space: nowrap;">{{t('settings.quality')}}:</span>
              <n-space align="center" justify="space-between">
                <n-slider :tooltip="false" v-model:value="quality" :step="1" style="width:120px;" :disabled="disableQuality" />
                <n-input-number v-model:value="quality" step="1" min="0" max="100" :disabled="disableQuality" style="width:90px;" size="small" />
              </n-space>
            </n-space>
          </n-space>
        </template>
        {{t('settings.qualitytooltip')}}
      </n-tooltip>
    </n-space>

  </n-space>
  <canvas ref="canvas" width="1" height="1" style="display:none"></canvas>
</template>
