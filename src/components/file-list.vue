<script setup lang="ts">
import canvasThumbnail from "./canvas-thumbnail.vue";
import { getUnitSize } from "./util";

import PromptDup from "./prompt-on-dup.vue";
import { FileWithId } from "./file-selector.vue";

// type
type PromptProps = InstanceType<typeof PromptDup>['$props'];

// common
const { t } = useI18n();
//const c = useThemeVars();

// props
const props = defineProps<{
  additionalFiles: FileWithId[];
}>();
// v-model
const fileList = defineModel<FileWithId[]>('file-list', {required:true});

// refs
const imageList = ref<{file: FileWithId, name: string}[]>([]);
const listTotal = ref('');
const prevListLength = ref(0);

const promptdup = ref();
const applyToAll = ref(false);
const duplicatedPath = ref('');


// const
const MAX_LEN = 3;
const buttonList = ref<PromptProps["buttons"]>([
  [() => t('dupAction_replace'), 'overwrite'],
  [() => t('dupAction_skip'), 'skip'],
  [() => t('cancel'), 'cancel'],
]);

onMounted(() => {
  // observe file list

  // when additional files are added
  watch(() => props.additionalFiles, async (newlist) => {
    // Build a Map keyed by paths
    const baseMap = new Map(
      fileList.value.map(item => [(item.webkitRelativePath || item.name), item])
    );

    let overwritten = false;
    let appliedAction = '';
    for( const file of newlist ) {
      const newkey = file.webkitRelativePath || file.name;

      if( baseMap.has(newkey) ) {  
        
        duplicatedPath.value = newkey;
        
        // show prompt
        const result = appliedAction || await promptdup.value.start();
        if( !appliedAction && applyToAll.value )
          appliedAction = result;
        
        switch(result) {
          case 'overwrite':
            overwritten = true;
            break;
          case 'cancel':
            return;
          case 'skip':
          default:
            continue;
        }
      }
      //list.push(file);
      baseMap.delete(newkey);
      baseMap.set(newkey, file);
    }
    if( baseMap.size > fileList.value.length || overwritten ) {
      fileList.value = [...baseMap.values()];
    }

  }/*, {immediate: true}*/);

  // update thumbnails
  watch(() => fileList.value[fileList.value.length - 1], () => {
    const list = fileList.value.slice(-MAX_LEN);

    for( const file of list ) {
      //const url = URL.createObjectURL(file);
      const name = file.name;
      
      imageList.value.push({file, name});
    }

    const minlen = Math.min(MAX_LEN, fileList.value.length);
    if( imageList.value.length > minlen ) {
      imageList.value = imageList.value.slice(-minlen);
    }

    listTotal.value = getUnitSize( fileList.value.reduce((c, item) => c + item.size, 0) );
  });

});


function clear() {
  fileList.value.length = 0;
  imageList.value.length = 0;
  //blobList.length = 0;
}

</script>

<template>
  <div>
  <n-flex class="container" justify="stretch" align="stretch" :wrap="false" :size="1">
    
    <!-- thumbnail box -->
    <n-flex class="list-box" :wrap="false" :size="0">
      
      <span class="list-label">{{ $t('SourceImageList') }}</span>
      <n-flex class="list-status" vertical :size="4" align="end" justify="end">
        <div class="sum">{{ $t('status.total') }}</div>
        <div class="size">{{ listTotal }}</div>
        <div class="files">
          <n-number-animation
            :active="true"
            :duration="1000"
            show-separator
            :to="fileList.length"
            :from="prevListLength"
            @finish="prevListLength = fileList.length"
          /> {{ $t('files', fileList.length) }}
        </div>
      </n-flex>
      
      <transition-group name="list">
        <canvas-thumbnail v-for="(item, i) in imageList"
          :key="item.file._id"
          :source="item.file"
          :width="67"
          :height="100"
          class="image-item"
        />
        <!--
        <n-image
          v-for="(item, i) in imageList"
          :key="item.name"
          :src="item.url"
          :alt="item.name"
          object-fit="cover"
          :width="200 / imageList.length" height="100"
          preview-disabled
          class="image-item"
        >
        </n-image>
        -->

      </transition-group>
    </n-flex>
    
    <!-- clear button -->
    <n-flex class="button-box" align="center" justify="center">
      <n-tooltip trigger="hover" placement="top" :keep-alive-on-hover="false" :delay="100">
        <template #trigger>
          <n-button
            class="close-button"
            :bordered="false"
            color="gray"
            ghost
            size="tiny"
            @click="clear()"
          > 
            <n-flex vertical align="center">
              <n-icon size="1.6em"><MaterialSymbolsCloseRounded/></n-icon>
              <span>{{$t('reset')}}</span>
            </n-flex>
          </n-button>
        </template>
        <template #default>
          {{ $t('resetListButtonTooltip') }}
        </template>
      </n-tooltip>
    </n-flex>

  </n-flex>

  <!-- confirm on duplicate path -->
  <PromptDup
    ref="promptdup"
    closable
    :buttons="buttonList"
    close-on-esc
    
    show-apply-all
    :label-apply-all="$t('confirmApplyAllLabel')"
    v-model:apply-all-checked="applyToAll"
  >
    <template #header>
      {{ $t('confirmListOverwrite') }}
    </template>
    <template #default>
      <div>
        {{ $t('confirmListOverwriteMsg') }}
      </div>
      <p class="path">
        {{ duplicatedPath }}
      </p>
    </template>
  </PromptDup>
  </div>

</template>

<style lang="scss" scoped>
.container {
  border: 1px solid silver;
  border-radius: 4px;
  height: 100px;
  padding: 2px;
  
  .list-box {
    flex-grow: 1;
    width: 200px;
    border: 1px solid silver;
    border-radius: 4px;
    overflow: hidden;
    position: relative;

    .list-label {
      position: absolute;
      left: 4px;
      top: 4px;
      font-size: 1em;
      line-height: 100%;
      z-index: 1;
    }
    .list-status {
      position: absolute;
      bottom: 4px;
      right: 10px;
      z-index: 1;

      .sum {
        font-size: 0.8em;
        line-height: 100%;
      }
      .size {
        font-size: 1em;
        line-height: 100%;
      }
      .files {
        color: black;
        font-weight: bold;
        font-size: 1.3em;
        line-height: 100%;
      }
    }
  }
  .button-box {
    .close-button {
      height: 100%;
      font-size: 0.8em;
      &:hover {
        color: red;
      }
    }
  }
}
.image-item {
  position: relative;
  z-index: 0;
  opacity: 0.2;
}

.path {
  font-size: 0.8em;
}

.list-move, 
.list-enter-active, .list-leave-active {
  transition: all 0.5s ease;
}
.list-leave-active {
  position: absolute;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

</style>
