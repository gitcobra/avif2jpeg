<script setup lang="ts">
import { nextTick } from "vue";
import { resetUserSettings } from "@/user-settings";
import { SettingsOutline, BuildOutline, ArchiveOutline, DocumentTextOutline, HardwareChipOutline } from "@vicons/ionicons5";


const ZIP_MIN_SIZE_MB = 100;
const ZIP_MAX_SIZE_MB = 2000;


const props = defineProps<{
  expanded: boolean
  retainExt: boolean
  maxZipSize: number
  multithread: boolean
  threadCount: number | undefined
  
  threadMax: number
}>();
const emit = defineEmits<{
  (e: 'update:expanded', flag: boolean): void
  (e: 'update:retainExt', flag: boolean): void
  (e: 'update:maxZipSize', val: number): void
  (e: 'update:multithread', val: boolean): void
  (e: 'update:threadCount', val: number): void
}>();

const expanded = computed({
  get: () => props.expanded,
  set: (flag: boolean) => {
    emit('update:expanded', flag);
  },
});
const retainExtension = computed({
  get: () => props.retainExt,
  set: (flag: boolean) => {
    emit('update:retainExt', flag);
  },
});
const maxZipSizeMB = computed({
  get: () => props.maxZipSize,
  set: (val: number) => {
    emit('update:maxZipSize', val);
  },
});
const multithread = computed({
  get: () => props.multithread,
  set: (flag: boolean) => {
    emit('update:multithread', flag);
  },
});
const threadCount = computed({
  get: () => typeof props.threadCount === 'undefined' ? props.threadMax : props.threadCount,
  set: (val: number) => {
    emit('update:threadCount', val);
  },
});


// watcher
watch(() => [props.threadMax, props.threadCount], ([avail]) => {
  if( avail > 1 && typeof props.threadCount === 'undefined' )
    threadCount.value = avail;
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
          <n-tooltip trigger="hover" :placement="true ? 'left' : 'bottom-start'" :keep-alive-on-hover="false" :duration="0" :delay="0">
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
          
          <!-- zip size -->
          <n-tooltip trigger="hover" :placement="true ? 'left' : 'bottom-start'" :keep-alive-on-hover="false" :duration="0" :delay="0">
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
                <n-input-number size="tiny" v-model:value="maxZipSizeMB" step="1" :min="ZIP_MIN_SIZE_MB" :max="ZIP_MAX_SIZE_MB" style="width:10em"><template #suffix>(MB)</template></n-input-number>
              </n-flex>
            </n-flex>
            </template>
            {{$t('settings.maxZipFileSizeTooltip')}}
          </n-tooltip>

          <!-- multi threading -->
          <n-tooltip trigger="hover" :placement="true ? 'left' : 'bottom-start'" :keep-alive-on-hover="false" :duration="0" :delay="0">
            <template #trigger>
            <n-flex vertical>
              <n-flex :wrap="false" align="center">
                <n-button text :disabled="!props.threadMax" style="font-size:smaller;" :bordered="false" :focusable="false" @click="multithread = !multithread">
                  <template #icon><n-icon><HardwareChipOutline /></n-icon></template>
                  {{ $t('settings.enableMultiThreads') }}
                </n-button>
                <n-switch v-model:value="multithread" :disabled="!props.threadMax" size="small" />
              </n-flex>
              <n-flex :wrap="false" align="center" style="padding-left: 2em;">
                <n-slider v-model:value="threadCount" :disabled="!props.threadMax || !multithread" :step="1" :min="2" :max="props.threadMax" style="width:120px;"/>
                <n-input-number size="tiny" v-model:value="threadCount" :disabled="!props.threadMax || !multithread" :step="1" :min="2" :max="props.threadMax" style="width:10em"><template #suffix>{{$t('threads', threadCount)}}</template></n-input-number>
              </n-flex>
            </n-flex>
            </template>
            {{ $t('settings.multiThreadsTooltip') }}
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