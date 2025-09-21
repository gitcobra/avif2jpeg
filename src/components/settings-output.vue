<script setup lang="ts">
import { onMounted, computed, watch, ref, inject } from "vue";
import { ImageSharp, ImageOutline } from '@vicons/ionicons5';
import { useI18n } from "vue-i18n";
import { GlobalValsKey } from "../Avif2Jpeg.vue";
import { OutputMethods } from "@/user-settings";
import { isFileSystemAPISupported, openDirectoryPicker } from "./filesystem-api";
import { sleep, invertRef } from "./util";
import { SelectOption } from 'naive-ui';

// properties
const props = defineProps<{
  quality: number;
  format: string;
  isMultithreadEnabled?: boolean;
}>();
const outputMethod = defineModel<OutputMethods>('method', {required: true});
const targetFolderHandle = defineModel<FileSystemDirectoryHandle>('target-folder-handle');
const actionOnDuplicate = defineModel<ActionsOnDuplicte>('action-on-duplicate', {default: 'prompt'});

// emits
const emit = defineEmits<{
  'update:format': [string]
  'update:quality': [number]
}>();



// common
const { t } = useI18n();
const dialog = useDialog();
const message = useMessage();

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

// actions on duplicate
type ActionsOnDuplicte = 'prompt' | 'overwrite' | 'skip';
const ActionOnDupOptions: SelectOption[] = [
  {
    value: 'prompt',
    label: () => t('dupAction_prompt'),
  },
  {
    value: 'overwrite',
    label: () => t('dupAction_overwrite'),
  },
  {
    value: 'skip',
    label: () => t('dupAction_skip'),
  },
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

// elements
const canvas = ref<HTMLCanvasElement | null>(null);

// reactives
const showAlertToChooseDest = ref(false);
const noOutputFolderSet = computed(() => outputMethod.value === 'fs' && !targetFolderHandle.value);


// watchers
watch(() => props.isMultithreadEnabled, (val) => {
  if( !val )
    outputMethod.value = 'zip';
});

// variables
const fsysIsAvailable = isFileSystemAPISupported();





onMounted(() => {
  checkSupportedImageFormats();
  if( !fsysIsAvailable && outputMethod.value === 'fs' )
    outputMethod.value = 'zip';
});





function checkFormat(val) {
  if( supportedFormats.value.indexOf(val) < 0 ) {
    val = supportedFormats.value[0];
  }
  return val;
}

function checkSupportedImageFormats() {
  for( const f of Formats ) {
    const url = canvas.value!.toDataURL(f);
    if( url.indexOf(f) >= 0 ) {
      supportedFormats.value.push(f);
    }
  }

  // if the list was empty there's something wrong
  if( supportedFormats.value.length === 0 )
    supportedFormats.value.push(Formats[0]);
}

function getTargetFolderName() {
  return targetFolderHandle.value.name;
}


function onOutputToFolderChecked() {
  outputMethod.value = 'fs';
  /*
  if( !targetFolderHandle.value )
    onDestFolderClick();
  */
  invertRef(showAlertToChooseDest, 200, false);
}
async function onDestFolderClick() {
  const dh = await openDirectoryPicker();
  if( !dh ) {
    await dialog.warning({
      title: 'Rejected',
      positiveText: "OK",
      maskClosable: true,
      content: t('settings.outputFolderDenied'),
    });

    if( targetFolderHandle.value ) {
      return;
    }

    outputMethod.value = 'zip';
  }
  
  targetFolderHandle.value = dh;
}

</script>



<template>
  <n-flex vertical justify="center" class="body">
    
    <!--
    <n-divider style="font-size:1em; color:gray; margin:0.4em 0em 0em;" title-placement="left">出力形式</n-divider>
    -->
    <n-flex vertical>
      <!-- <n-divider title-placement="left" style="margin-bottom:0px;">Output Settings</n-divider> -->

      <!-- output type -->
      <n-tooltip :to="false" display-directive="show" :show="INJ.showTooltipsBeforeMounted.value" trigger="hover" :placement="INJ.LANDSCAPE.value ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="0">
        <template #trigger>
          <n-flex align="center" :wrap="false">
            <n-icon><ImageOutline /></n-icon>{{t('settings.outputType')}}:
            <n-select v-model:value="format" :options="supportedFormats.map(value => ({value, label:value}))" :consistent-menu-width="false" size="small" />
          </n-flex>
        </template>
        {{t('settings.imageTypeTooltip')}}
      </n-tooltip>

      <!-- output quality -->
      <n-tooltip :to="false" display-directive="show" :show="INJ.showTooltipsBeforeMounted.value" trigger="hover" :placement="INJ.LANDSCAPE.value ? 'left' : 'top-start'" :keep-alive-on-hover="false" :duration="0" :delay="0">
        <template #trigger>
          <n-flex align="center">
            <n-flex align="start" :wrap="false">
              <n-icon><ImageSharp /></n-icon><span style="white-space: nowrap;">{{t('settings.outputQuality')}}:</span>
              <n-flex align="center" justify="space-between">
                <n-slider :tooltip="false" v-model:value="quality" :step="1" style="width:120px;" :disabled="disableQuality" />
                <n-input-number @blur="quality=quality==null?0:quality" v-model:value="quality" step="1" min="0" max="100" :disabled="disableQuality" style="width:90px;" size="small" />
              </n-flex>
            </n-flex>
          </n-flex>
        </template>
        {{t('settings.qualitytooltip')}}
      </n-tooltip>
    </n-flex>

    <n-collapse :trigger-areas="['arrow', 'main']">
    <n-collapse-item :disabled="outputMethod === 'fs'/*noOutputFolderSet*/">
      <template #header>
        {{ $t('settings.changeSaveMethod') }}
      </template>
      <!-- output method -->
      <n-flex vertical align="stretch" class="method-box" :size="1">
        <n-radio
          :checked="outputMethod === 'zip'"
          @update:checked="checked => checked && (outputMethod='zip')"
        >
          <n-flex
            align="center" :size="2"
            :class="outputMethod === 'zip' ? 'method-active':'method-inactive'"
          >
            <n-icon size="1.5em"><HugeiconsZip02/></n-icon>
            <span>
              {{ $t('settings.saveAsZIP') }} ({{ $t('Default') }})
            </span>
          </n-flex>
        </n-radio>
        
        <n-radio
          :disabled="!fsysIsAvailable || !isMultithreadEnabled"
          :checked="outputMethod === 'fs'"
          @update:checked="checked => checked && fsysIsAvailable && onOutputToFolderChecked()"
        >
          <n-flex align="center" :size="2"
            :class="outputMethod === 'fs' ? 'method-active':'method-inactive'"
          >
            <n-icon size="1.5em"><MdiFolderEditOutline/></n-icon>
            <n-flex align="center" :size="1">
              {{ $t('settings.saveToSpecifiedFolder') }}
              (<MaterialSymbolsExperimentOutline/>{{ $t('experimental') }})
            </n-flex>
          </n-flex>
        </n-radio>
        <transition>
          <n-flex
            vertical
            justify="center"
            v-if="outputMethod === 'fs'" style="margin-left: 2em;"
          >
            <n-popover trigger="manual" placement="right-start"
              :show="showAlertToChooseDest && noOutputFolderSet"
              :keep-alive-on-hover="true"
            >
              <template #trigger>
                <n-button
                  @click="onDestFolderClick()"
                  size="small" style="justify-content: start;" ghost
                  :color="targetFolderHandle ? 'green' : 'red'"
                >
                  <template #icon>
                    <StashChevronRightDuotone/>
                  </template>
                  
                  <n-flex v-if="targetFolderHandle" :wrap="false" :size="2" align="center">
                    <MaterialSymbolsFolderOutline/>
                    <n-ellipsis style="max-width: 15em;">
                      {{getTargetFolderName()}}
                    </n-ellipsis>
                  </n-flex>
                  <n-flex v-else :wrap="false" :size="2" align="center">
                    {{$t('settings.chooseOutputFolder')}}
                  </n-flex>
                </n-button>
              </template>
              <template #default>
                <n-alert type="error" :show-icon="true" :title="$t('settings.chooseOutputFolderTooltip')"/>
              </template>
            </n-popover>

            <!--
            <n-flex :wrap="false" align="center" style="font-size:smaller; padding-left: 2em;">
              {{ $t('settings.actionOnDuplicate') }}:
              <n-select size="tiny" :options="ActionOnDupOptions" default-value="prompt" />
            </n-flex>
            -->
          </n-flex>
        </transition>

      </n-flex>

    </n-collapse-item>
    </n-collapse>
    


  </n-flex>
  <canvas ref="canvas" width="1" height="1" style="display:none"></canvas>
</template>

<style scoped lang="scss">
.body {
  white-space: nowrap;
}
.method-box {
  padding-left: 2em;
}
.method-active, .method-inactive {
  font-size: 1em;
}
.method-active {
  font-weight: bold;
}
</style>