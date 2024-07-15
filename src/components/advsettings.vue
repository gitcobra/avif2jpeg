<template>
  <n-collapse display-directive="show" :expanded-names="props.expanded ? ['collapitem'] : ''" :on-update:expanded-names="names => expanded = !!String(names)">
    <template #arrow><n-icon><SettingsOutline /></n-icon></template>
    <n-collapse-item :title="'Advanced Settings'" name="collapitem">
      
      <n-space vertical item-style="padding-left: 10%">
        <n-tooltip trigger="hover" :placement="true ? 'left' : 'bottom-start'" :keep-alive-on-hover="false" :duration="0" :delay="50">
          <template #trigger>
            <span><n-button size="tiny" style="font-size:smaller;" :bordered="false" :focusable="false" @click="retainExtension = !retainExtension">{{$t('retainOriginalExtension')}}</n-button><n-switch v-model:value="retainExtension" size="small" /></span>
            <!-- <n-checkbox v-model:checked="retainExtension">{{$t('retainOriginalExtension')}}</n-checkbox> -->
          </template>
          {{$t('retainExtTooltip')}}
        </n-tooltip>
        
        <n-tooltip trigger="hover" :placement="true ? 'left' : 'bottom-start'" :keep-alive-on-hover="false" :duration="0" :delay="50">
          <template #trigger>
          <n-space :wrap="false" align="center">
            <span style="white-space: nowrap; font-size:smaller; margin-left:8px;">Max zip file size:</span>
            <n-slider :tooltip="false" v-model:value="maxZipSizeMB" :step="1" :min="100" :max="1000" style="width:90px;"/>
            <n-input-number size="tiny" v-model:value="maxZipSizeMB" step="1" min="100" max="1000" style="width:120px"><template #suffix>(MB)</template></n-input-number>
          </n-space>
          </template>
          Set smaller value if memory problems occur.
        </n-tooltip>
      </n-space>
    </n-collapse-item>
  </n-collapse>
</template>


<script setup lang="ts">
import { computed } from "vue";
import { NSpace, NButton, NSlider, NInputNumber, NCollapse, NCollapseItem, NTooltip, NCheckbox, NSwitch, NIcon } from "naive-ui";
import { SettingsOutline } from "@vicons/ionicons5";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  expanded: boolean
  retainExt: boolean
  maxZipSize?: number
}>();
const emit = defineEmits<{
  (e: 'update:expanded', flag: boolean): void
  (e: 'update:retainExt', flag: boolean): void
  (e: 'update:maxZipSize', val: number): void
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

</script>
