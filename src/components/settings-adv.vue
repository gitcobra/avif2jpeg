<script setup lang="ts">
import { watch, computed, onMounted } from "vue";
import { resetUserSettings, MaxThreads } from "@/user-settings";
import { SettingsOutline, BuildOutline, ArchiveOutline, DocumentTextOutline, HardwareChipOutline, ImagesOutline, FolderOpenOutline } from "@vicons/ionicons5";
import { NTooltip } from "naive-ui";


// constants
const ZIP_MIN_SIZE_MB = 100;
const ZIP_MAX_SIZE_MB = 2000;
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 4096;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;
const TooltipDefAttr: InstanceType<typeof NTooltip>['$props'] = {
  trigger: "hover",
  placement: "left",
  keepAliveOnHover: false,
  duration: 0,
  delay: 0,
  style: 'max-width: 20vw;',
};


/*
Component v-model | Vue.js
https://vuejs.org/guide/components/v-model
Starting in Vue 3.4, the recommended approach to achieve this is using the defineModel() macro
*/
const expanded = defineModel<boolean>('expanded', {required: false});

const multithread = defineModel<boolean>('multithread', {required:true});
const threadCount = defineModel<number|undefined>('threadCount', {required:true});

const maxZipSizeMB = defineModel<number>('maxZipSize', {required:true});
const retainExtension = defineModel<boolean>('retainExt', {required:true});
const useFolderNameForZip = defineModel<boolean>('useFolderNameForZip', {required:true});

const shrinkImage = defineModel<boolean>('shrinkImage', {required:true});
const maxWidth = defineModel<number>('maxWidth', {required:true});
const maxHeight = defineModel<number>('maxHeight', {required:true});


// props
const props = defineProps<{
  //threadMax: number;
}>();


// disable multi thread switch
watch(MaxThreads, (val) => {
//watch(() => props.threadMax, (val) => {
  if( !(val > 1) ) {
    multithread.value = false;
  }
  if( threadCount.value > val )
    threadCount.value = val;
}, {immediate:true});

/*
watch(threadCount, (val) => {
  if( val === undefined ) {
    threadCount.value = Math.max(2, Math.min(props.threadMax, 16));
  }
});
*/

const enableNewFeatures = computed(() => multithread.value && MaxThreads.value > 1);



onMounted(() => {
  // set thread count to max/2 if undefined
  if( MaxThreads.value > 1 && typeof threadCount.value === 'undefined' )
    //threadCount.value = Math.max(props.threadMax / 2|0, 2);
    threadCount.value = Math.max(MaxThreads.value, 2);
});

</script>





<template>
  <n-flex justify="center">
    <n-collapse
      display-directive="show"
      :default-expanded-names="expanded ? ['collapitem'] : ''"
      :on-update:expanded-names="names => expanded = !!String(names)"
      :trigger-areas="['arrow', 'main']"
      class="settings-body" :class="expanded ? 'expand-adv-settings':''"
    >
      <template #arrow>
        <n-icon :style="expanded && {top:'8px'}"><BuildOutline /></n-icon>
        <n-icon><SettingsOutline /></n-icon>
      </template>

      <!-- reset button -->
      <template #header-extra v-if="expanded">
        <n-tooltip :keep-alive-on-hover="false" :duration="0" :delay="0">
          <template #trigger>
          <n-button @click="resetUserSettings" size="tiny" style="font-size:xx-small">{{$t('reset')}}</n-button>
          </template>
          {{ $t('settings.resetButtonTooltip') }}
        </n-tooltip>
      </template>
      
      <n-collapse-item :title="$t('settings.advancedSettings')" name="collapitem">  
        <n-flex vertical style="padding-left: 2em;">
          
          <!-- multi threading -->
          <n-tooltip v-bind="TooltipDefAttr">
            <template #trigger>
            <n-flex vertical>
              <n-flex :wrap="false" align="center">
                <n-button text :disabled="!MaxThreads" style="font-size:smaller;" :bordered="false" :focusable="false" @click="multithread = !multithread">
                  <template #icon><n-icon><HardwareChipOutline /></n-icon></template>
                  {{ $t('settings.enableMultiThreads') }}
                </n-button>
                <n-switch v-model:value="multithread" :disabled="!MaxThreads" size="small" />
              </n-flex>
              <n-flex :wrap="false" align="center" style="padding-left: 2em;">
                <n-slider v-model:value="threadCount" :disabled="!MaxThreads || !multithread" :step="1" :min="2" :max="MaxThreads" style="width:120px;"/>
                <n-input-number @blur="threadCount??=2" size="tiny" v-model:value="threadCount" :disabled="!MaxThreads || !multithread" :step="1" :min="2" :max="MaxThreads" style="width:10em"><template #suffix>{{ $t('threads', threadCount!)}}</template></n-input-number>
              </n-flex>
              {{ MaxThreads }}
            </n-flex>
            </template>
            {{ $t('settings.multiThreadsTooltip') }}
          </n-tooltip>
          
          <!-- zip size -->
          <n-tooltip v-bind="TooltipDefAttr">
            <template #trigger>
            <n-flex vertical>
              <n-flex :wrap="false" align="center">
                <n-button text :focusable="false" style="white-space: nowrap; font-size:smaller;">
                  <template #icon><n-icon style="vertical-align: middle;"><ArchiveOutline /></n-icon></template>
                  {{$t('settings.maxZipFileSize')}}:
                </n-button>
              </n-flex>
              <n-flex :wrap="false" align="center" style="padding-left: 2em;">
                <n-slider :tooltip="false" v-model:value="maxZipSizeMB" :step="1" :min="ZIP_MIN_SIZE_MB" :max="ZIP_MAX_SIZE_MB" style="width:120px;"/>
                <n-input-number @blur="maxZipSizeMB??=ZIP_MIN_SIZE_MB" size="tiny" v-model:value="maxZipSizeMB" step="1" :min="ZIP_MIN_SIZE_MB" :max="ZIP_MAX_SIZE_MB" style="width:10em"><template #suffix>(MB)</template></n-input-number>
              </n-flex>
            </n-flex>
            </template>
            {{$t('settings.maxZipFileSizeTooltip')}}
          </n-tooltip>

          <!-- use folder name -->
          <n-tooltip v-bind="TooltipDefAttr">
            <template #trigger>
            <n-flex :wrap="false" align="center">
              <n-button text style="font-size:smaller;" :bordered="false" :focusable="false" @click="useFolderNameForZip = !useFolderNameForZip">
                <template #icon><n-icon><FolderOpenOutline /></n-icon></template>
                {{$t('settings.useFolderNameForZip')}}
              </n-button>
              <n-switch v-model:value="useFolderNameForZip" size="small" />
            </n-flex>
            </template>
            {{$t('settings.useFolderNameForZipTooltip')}}
          </n-tooltip>

          <!-- keep extension -->
          <n-tooltip v-bind="TooltipDefAttr">
            <template #trigger>
            <n-flex :wrap="false" align="center">
              <n-button text style="font-size:smaller;" :bordered="false" :focusable="false" @click="retainExtension = !retainExtension">
                <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
                {{$t('settings.retainOriginalExtension')}}
              </n-button>
              <n-switch v-model:value="retainExtension" size="small" />
            </n-flex>
            </template>
            {{$t('settings.retainExtTooltip')}}
          </n-tooltip>

          <!-- resize image -->
          <n-tooltip v-bind="TooltipDefAttr">
            <template #trigger>
            <n-flex vertical>
              <n-flex :wrap="false" align="center">
                <n-button :disabled="!enableNewFeatures" text style="font-size:smaller;" :bordered="false" :focusable="false" @click="shrinkImage=!shrinkImage">
                  <template #icon><n-icon><ImagesOutline /></n-icon></template>
                  {{ $t('settings.shrinkImage') }}
                </n-button>
                <n-switch :disabled="!enableNewFeatures" v-model:value="shrinkImage" size="small" />
              </n-flex>
              <n-flex :wrap="false" align="center" style="padding-left: 2em;">
                <n-slider v-model:value="maxWidth" :disabled="!shrinkImage || !enableNewFeatures" :step="1" :min="MIN_WIDTH" :max="MAX_WIDTH" style="width:120px;"/>
                <n-input-number size="tiny" @blur="maxWidth??=8" v-model:value="maxWidth" :disabled="!shrinkImage || !enableNewFeatures" :step="1" :min="8" :max="MAX_WIDTH*4" style="max-width:15em; text-align: right;">
                  <template #prefix><span style="width:4em; text-align: left;">{{$t('width')}}</span></template>
                  <template #suffix>px</template>
                </n-input-number>
              </n-flex>
              <n-flex :wrap="false" align="center" style="padding-left: 2em;">
                <n-slider v-model:value="maxHeight" :disabled="!shrinkImage || !enableNewFeatures" :step="1" :min="MIN_HEIGHT" :max="MAX_HEIGHT" style="width:120px;"/>
                <n-input-number size="tiny" @blur="maxHeight??=8" v-model:value="maxHeight" :disabled="!shrinkImage || !enableNewFeatures" :step="1" :min="8" :max="MAX_HEIGHT*4" style="max-width:15em; text-align: right;">
                  <template #prefix><span style="width:4em; text-align: left;">{{$t('height')}}</span></template>
                  <template #suffix>px</template>
                </n-input-number>
              </n-flex>
            </n-flex>
            </template>
            {{ $t('settings.shrinkImageTooltip') }}
          </n-tooltip>

        </n-flex>
      </n-collapse-item>
    </n-collapse>
  </n-flex>
</template>




<style lang="scss" scoped>
.settings-body {
  padding: 1em;
}
.expand-adv-settings {
  border-radius: 1em;
  border: 1px dashed silver;
}
</style>