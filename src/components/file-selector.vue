<template>
  <div class="container-1">
  <div class="container-2">
  <n-space vertical align="center" justify="center" inline>
    <n-space align="center" justify="space-around" class="main-buttons">
      
      <n-space vertical align="stretch" justify="center">
        <!-- file select -->
        <n-tooltip :to="false" display-directive="show"
          :show="INJ.showTooltipsBeforeMounted.value" trigger="hover" :keep-alive-on-hover="false"
          :placement="INJ.LANDSCAPE.value ? 'right' : 'top'"
          :duration="0" :delay="0" :z-index="10"
        >
          <template #trigger>
            <n-button
              :disabled="!isAllowedInputs"
              size="large"
              @click="onInputButtonClick(fileinput)"
              round
              style="width:100%; background-color:white; font-size: large;"
            >
              <template #icon>
                <n-icon size="large" color="gray"><ImageOutline /></n-icon>
              </template>
              {{$t('loadbutton')}}
            </n-button>
          </template>
          <div v-html="$t('loadbuttontooltip')"></div>
        </n-tooltip>

        <n-space align="center" justify="center" style="color:gray; margin:0em;">
          <!-- <n-icon color="gray"><ArrowUp /></n-icon> -->
          {{$t('or')}}
          <!-- <n-icon color="gray"><ArrowDown /></n-icon> -->
        </n-space>

        <!-- folder select -->
        <n-tooltip :to="false" display-directive="show" trigger="hover"
          placement="left" :keep-alive-on-hover="false" style="max-width: 40vw;"
          :duration="0" :delay="0" :z-index="10"
          v-if="!INJ.IS_SP && folderInputSupport || INJ.SSR"
          :show="INJ.showTooltipsBeforeMounted.value"
        >
          <template #trigger>
            <n-button
              :disabled="!isAllowedInputs"
              size="large"
              @click="onInputButtonClick(folderinput)"
              round
              style="width:100%; background-color:white; font-size: large;"
            >
              <template #icon>
                <n-icon size="large" color="gray"><FolderOpenOutline /></n-icon>
              </template>
              {{$t('loadfolderbutton')}}
            </n-button>
          </template>
          <div v-html="$t('loadfoldertooltip')"></div>
        </n-tooltip>
      </n-space>

      <!-- drop target -->
      <DropTarget
        v-if="!INJ.IS_SP"
        @drop="emitInputs"
        :forbidden="!isAllowedInputs"
        class="drop-target"
      />
    </n-space>

    <!-- target file type menu -->
    <div :class="{'expand-ext-list-container': expandedMenu}" style="margin-top: 1em;">
    <n-collapse display-directive="show" :expanded-names="expandedMenu ? ['extItem'] : ''" :on-update:expanded-names="names => {expandedMenu = !!(''+names)}" :class="{'expand-ext-list': expandedMenu}">
      
      <!-- show current selected target -->
      <template #header-extra>
        <n-tag type="success" round size="tiny" style="margin-left:0.2em; font-size:8px; opacity:0.7;">
          {{FileExtLabels[targetType]}}
        </n-tag>
      </template>
      
      <n-collapse-item :title="$t('fileTypeRadioTitle')" name="extItem">
        <n-radio-group v-model:value="targetType" name="filetyperadios" size="small">
          <n-space vertical style="padding-left:1em;">

            <n-tooltip v-for="(val) in FileTypeRadioValues" :key="val" trigger="hover" :keep-alive-on-hover="false" :z-index="5" placement="left" style="max-width:200px;" :duration="0" :delay="0">
              <template #trigger>
                <n-radio :value="val">{{$t('fileTypeRadioOptions.'+val)}}</n-radio>
              </template>
              {{ getAcceptStringByTargetType(val).replace(/,/g, ', ') }}
            </n-tooltip>

            <n-tooltip trigger="hover" :keep-alive-on-hover="false" placement="bottom-start" :show="userExtInputActive" :duration="0" :delay="0">
              <template #trigger>
                <div style="padding-left:1em;">
                  <n-popover trigger="manual" placement="right-end" :show="targetType === 'edit_type' && userExtValidationStat !== 'success' && !!userExtInputActive">
                    <template #trigger>
                      <n-input
                        v-model:value="customExtensions"
                        :status="userExtValidationStat"
                        :disabled="targetType !== 'edit_type'"
                        @focus="userExtInputActive=true"
                        @blur="userExtInputActive=undefined"
                        :clearable="true"
                        size="small" placeholder=".jpg, .gif, .png"
                        spellcheck="false"
                      />
                    </template>
                    <n-alert type="error" :show-icon="true" title="Validation error">
                      Please correct the extension list.<br>
                      <ul>
                        <li>Each extension must begin with a period. </li>
                        <li>Separate each extension with a comma. </li>
                        <li>Use alphameric characters.</li>
                      </ul>
                    </n-alert>
                  </n-popover>
                </div>
              </template>
              <span v-html="$t('editAcceptTypes')"></span>
            </n-tooltip>

          </n-space>
        </n-radio-group>
      </n-collapse-item>
    </n-collapse>
    </div>



  </n-space>
  </div>
  </div>

  <input ref="fileinput" @input="onInputFile" @cancel="onInputButtonCancel" type="file" multiple :accept="accept" style="display:none">
  <input ref="folderinput" webkitdirectory directory @input="onInputFile" @cancel="onInputButtonCancel" type="file" style="display:none">
</template>

<script setup lang="ts">
import { ImageOutline, FolderOpenOutline, SearchCircle, ArrowUp, ArrowDown } from '@vicons/ionicons5';
import { NCheckbox, NEmpty, NImage } from "naive-ui";
import { GlobalValsKey } from "../Avif2Jpeg.vue";
import { useI18n } from 'vue-i18n';
import DropTarget from "./droptarget.vue";




// common liblaries
const dialog = useDialog();
const { t } = useI18n();


// injections
const INJ = inject(GlobalValsKey);

// constants
const FileTypeRadioValues = ['avif_only', 'all_images', 'all_files', 'edit_type'] as const;
type TargetTypes = typeof FileTypeRadioValues[number];
const FileExtLabels: { [key in TargetTypes]: string } = {
  avif_only: 'AVIF',
  all_images: 'IMGS',
  all_files: 'ALL',
  edit_type: 'EDIT',
};

// properties
const props = defineProps<{
  expanded?: boolean
  target?: TargetTypes
  userExtensions?: string
  forbidden?: boolean
}>();


// emits
const emit = defineEmits<{
  input: [val: File[]]
  click: []
  cancel: []
  
  'on-change-accept': [val: string]
  
  'update:target': [val: TargetTypes]
  'update:userExtensions': [val: string]

  'update:expanded': [val: boolean]
}>();


// reactive values
const inputtedFileCount = ref(0);
const userExtInputActive = ref(false);
const disableInputButtons = ref(false);

// computed
const accept = computed(() => {
  return getAcceptStringByTargetType(targetType.value);
});
const userExtValidationStat = computed(() => {
  const flag = customExtensions.value.split(',').every(val => /^\s*(\.[\w\-]+)*\s*$/.test(val));
  return flag ? 'success' : 'error';
});
const isAllowedInputs = computed( () => !props.forbidden && !disableInputButtons.value );

// v-model values
const expandedMenu = computed({
  get: () => props.expanded,
  set: (flag: boolean) => {
    emit('update:expanded', flag);
  },
});
const targetType = computed({
  get: () => {
    return FileTypeRadioValues.indexOf(props.target) >= 0 ? props.target : FileTypeRadioValues[0];
  },
  set: (val: TargetTypes) => {
    emit('update:target', val);
  },
});
const customExtensions = computed({
  get: () => props.userExtensions,
  set: (val: string) => {
    emit('update:userExtensions', val);
  },
});
const disableNotifyingFolderSelect = defineModel<boolean>('disableNotifyingFolderSelect');


// DOM elements
const fileinput = ref(null);
const folderinput = ref(null);


// variables
const folderInputSupport = ref(checkFolderInputSupport());



// wathcers
watch(targetType, (val) => {
  emit('on-change-accept', accept.value);
});

// on mounted
onMounted(() => {
  
});




// event handlers

async function onInputButtonClick(elm: HTMLInputElement) {
  emit('click');

  // notify about the dialog box that the browser pops up when selected a folder
  if( elm === folderinput.value && !disableNotifyingFolderSelect.value ) {
    let ok = false;
    await new Promise<boolean>(resolve => {
      dialog.info({
        title: t('loadfolderNotifyingTitle'),
        positiveText: t('Continue'),
        negativeText: t('Cancel'),
        onAfterLeave: () => resolve(ok),
        onPositiveClick: () => ok = true,
        content: () => h('div', [
          h('p', {}, t(`loadfolderNotifyingMessageTerm1`)),
          h('div', [h(NImage, {width:250, style:{border:'3px solid gray'}, src: import.meta.env.BASE_URL +'/notification-folder.png'})]),
          h('p', {}, t(`loadfolderNotifyingMessageTerm2`)),
          h('p', [h(NCheckbox, { onUpdateChecked: val => disableNotifyingFolderSelect.value = val, checked: disableNotifyingFolderSelect.value }, () => t('checkboxTextDontShowThis'))]),
        ]),
      });
    });

    if( !ok ) {
      disableNotifyingFolderSelect.value = false;
      emit('cancel');
      return;
    }
  }
  
  //disableInputButtons.value = true;
  elm.click();
}
function onInputButtonCancel() {
  //disableInputButtons.value = false;
  emit('cancel');
}

function onInputFile(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const list: File[] = [...input.files];

  //fileinput.value.disabled = folderinput.value.disabled = true;
  /*
  if( list.length === 0 )
    nofiles.value = true; // open nofiles dialog
  else
    inputFiles.value = list;
  */
  //inputConversionFiles.value = list;
  fileinput.value.value = '';
  folderinput.value.value = '';
  //fileinput.value.disabled = folderinput.value.disabled = false;

  emitInputs(list);
  //disableInputButtons.value = false;
}




// general functions
function checkFolderInputSupport() {
  return 'webkitdirectory' in document.createElement('input');
}

function getAcceptStringByTargetType(target: TargetTypes ) {
  switch( target ) {
    case 'avif_only':
      return '.avif, .webp';
    case 'all_images':
      return ".jpg, .jpeg, .jfif, .pjpeg, .pjp, .gif, .png, .webp, .avif, .bmp, .apng, .ico";
    case 'edit_type':
      return customExtensions.value;
    
    case 'all_files':
    default:
      return '.*';
  }
}

// check file extension
async function filterByExtension(list: File[]) {
  const acceptsStr = String(accept.value).toLowerCase().replace(/\s+/g, '');
  if( acceptsStr && accept.value !== '.*') {
    const accepts = acceptsStr.split(',');
    list = list.filter( item => accepts.includes(item.name.replace(/^.+(\.[^.]+)$/, '$1').toLowerCase()) );
    if( !list.length ) {
      await new Promise(resolve => {
        dialog.error({
          title: 'Images Not Found',
          positiveText: 'OK',
          onAfterLeave: resolve as any,
          content: () => h('div', [h(NEmpty, {description:"NO IMAGES"}), `${t('noimage')}`, h('br'), accept.value]),
        });
      });
      onInputButtonCancel();
    }
  }
  return list;
}

async function emitInputs(list: File[]) {
  disableInputButtons.value = true;
  list = await filterByExtension(list);
  inputtedFileCount.value = list.length;
  
  if( list.length > 0 ) {
    emit('input', list);
  }
  disableInputButtons.value = false;
}




function log(str: any) {
  console.log(str);
}

</script>

<style scoped lang="scss">
ul {
  list-style-type: square;
  li {
    font-size: xx-small;
  }
}
ul, li {
  margin: 0px;
  padding: 0px 0px 0px 4px;
}

.container-1 {
  /*
  border-radius: 1em;
  border: 1px solid #DDDDDD;
  padding: 2px;
  background-color: #EEEEEE;
  .container-2 {
    margin: 0px;
    border-radius: 1em;
    padding: 16px;
    border: 1px dashed #BBBBBB;
  }
  */
}

.main-buttons {
  position: relative;
}
.drop-target {
  position: absolute;
  right: -15em;
  top: 1.5em;
}
@media screen and (max-width: 640px) {
  .drop-target {
    display: none;
  }	
}

.expand-ext-list-container {
  border-radius: 1em;
  background-color: #FEFEFE;
  padding: 2px;
}
.expand-ext-list {
  border-radius: 1em;
  border: 1px dashed #E3E3E3;
  padding: 1em;
}
</style>
