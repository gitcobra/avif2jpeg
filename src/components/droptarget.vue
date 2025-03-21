
<template>

  <div class="container-1">
    <n-tooltip :to="false" display-directive="show" trigger="hover" :duration="0" :delay="0" placement="bottom-end">
      <template #trigger>
        <n-space vertical class="container-2">
          <n-space align="center" :wrap="false" class="container-3">
            <!--
            <n-space align="center">
              <n-icon size="32" color="silver"><ArrowRedoSharp /></n-icon>
            </n-space>
            -->
            <n-space vertical align="center" :wrap="false" style="font-weight:bold; font-size:1em; line-height: 90%; white-space: nowrap;">
              <span>Drag & Drop</span>
              <span style="position:relative">
                AVIF Images
                <span style="position:absolute; font-size:0.5em; right:-3.5em; bottom:-1.5em; white-space: nowrap;">
                   or 
                  <n-popover placement="bottom-end">
                    <template #trigger>
                    <span style="color:#666666;">
                      <n-icon style="vertical-align: middle;"><FolderOpenOutline /></n-icon>
                      Folders
                    </span>
                    </template>
                    You can drag and drop your local folders
                  </n-popover>
                </span>
              </span>
            </n-space>
            <n-space>
              <img src="/avif.png" class="avif">
            </n-space>
          </n-space>
        </n-space>
      </template>
      <h3 v-html="$t('droptarget')" style="max-width:200px; text-align: center; word-break: keep-all; overflow-wrap: break-word; "></h3>
    </n-tooltip>
  


    <n-modal v-model:show="loading" :closable="true" preset="dialog" title="Parsing dropped items." type="info" :mask-closable="false" :negative-text="$t('cancel')">
      <template #default>
        <n-space vertical align="center">
          <div style="width: 100%; overflow:hidden; text-overflow: ellipsis; font-size: xx-small; white-space: nowrap;">{{ parsingFolder }}</div>
          <div>found {{ fileCount }} files</div>
        </n-space>
      </template>
    </n-modal>

  </div>
</template>

<script setup lang="ts">
import { ArrowRedoSharp, FolderOpenOutline } from '@vicons/ionicons5';
import { GlobalValsKey } from "../Avif2Jpeg.vue";


// injections
const INJ = inject(GlobalValsKey);

// props
const props = defineProps<{
  forbidden?: boolean
  dropTarget?: HTMLElement | Document
}>();

// emits
const emit = defineEmits<{
  'drop': [list: File[]]
}>();


const loadingBar = useLoadingBar();

const loading = ref(false);
const fileCount = ref(0);
const parsingFolder = ref('');


onMounted(() => {
  setDropEvents(props.dropTarget || document);
});

function setDropEvents(droptarget: Document | HTMLElement) {
  document.ondragstart = (ev) => ev.preventDefault();
  document.ondragover = (ev) => ev.preventDefault();
  droptarget.ondrop = async (ev: DragEvent) => {
    ev.preventDefault();
    
    if( loading.value || props.forbidden ) {
      return;
    }
    
    loading.value = true;
    fileCount.value = 0;
    parsingFolder.value = '';
    
    let list: File[];
    
    try {
      // parse as FileSystemEntry[]
      const items = [...ev.dataTransfer.items].map(item => item.webkitGetAsEntry());
      loadingBar.start();
      list = await digOutFileSystemEntries(items);
      loadingBar.finish();
    } catch(e) {
      // parse as File[]
      list = [...ev.dataTransfer?.files ?? []];
      loadingBar.error();
    }
    
    if( !loading.value )
      return;
    loading.value = false;

    emit('drop', list);
  };
}

async function digOutFileSystemEntries(entries: FileSystemEntry[], list?: File[]): Promise<File[]> {
  list = list || [];
  
  for( const entry of entries ) {
    if( entry.isFile ) {
      const file = await new Promise<File>( resolve => (entry as FileSystemFileEntry).file(file => resolve(file)) );
      
      // add "webkitRelativePath" property
      Object.defineProperty(file, 'webkitRelativePath', {value: entry.fullPath});
      
      list.push(file);
      fileCount.value++;
    }
    else if( entry.isDirectory ) {
      parsingFolder.value = entry.fullPath;
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      
      // continue to readEntries until the folder runs out of its entry.
      do {
        const subEntries = await new Promise<FileSystemEntry[]>( resolve => reader.readEntries(subEntries => resolve(subEntries)) );
        if( !subEntries.length )
          break;
        
        // dig deeper into its entries
        await digOutFileSystemEntries( subEntries, list );
      } while(true)
    }
  }
  
  return list;
}


</script>

<style lang="scss" scoped>
.container-2 {
  opacity: 0.2;
  /*
  border-radius: 1em;
  border: 1px dashed #999;
  padding: 1em;
  */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: x-small;
  width: 100%;
  height: 100%;
}

/*
.container-1 {
  margin-top: 0.2em;
  border-radius: 1em;
  padding: 4px;
  border: 3px solid #FAFAFA;
  background-color: #CCCCCC;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: large;
  width: 100%;
  height: 100%;
}
.container-2 {
  border: 2px dashed #FAFAFA;
  border-radius: 1em;
  padding: 0.1em;
}
.container-3 {
  background-color: #CCCCCC;
  color:#FFFFFF;
  border-radius: 0.7em;
  padding: 0.5em 1em;
  overflow-wrap: break-word;
  word-break: keep-all;
  cursor: crosshair;
}
*/
.avif {
  max-width: 10vw;
  width: 48px;
}
</style>
