<script setup lang="ts">
import { VNodeChild } from 'vue';
import { DialogProps } from 'naive-ui';

// types
type DefaultButtonKeys = 'overwrite' | 'rename' | 'skip' | 'cancel';

// props
type Props = {
  preset?: 'dialog' | 'card';
  title?: string | (() => VNodeChild);
  content?: string | (() => VNodeChild);
  type?: DialogProps["type"];
  
  show?: boolean;
  buttons?:
    [ label: string | (() => VNodeChild), key:any ][] |
    { label: string | (() => VNodeChild), key: string }[];
  defaultButtons?: DefaultButtonKeys[];
  
  closable?: boolean;
  draggable?: boolean;
  closeOnEsc?: boolean;
  maskClosable?: boolean;

  showApplyAll?: boolean;
  labelApplyAll?: string;
};
const props = withDefaults(defineProps<Props>(), {
  preset: 'dialog',
  //closable: true,
  
  labelApplyAll: 'Apply this action to all',
});

// v-models
const applyAllChecked = defineModel<boolean>('applyAllChecked');



// emits
const emit = defineEmits<{
  start: [Promise<any>]; // @start event returns Promise<"key"> to wait for user action
  close: [any];
  applyAllChange: [boolean];
}>();


// methods
defineExpose({
  start, // start method also returns Promise
  click: onButtonClick,
  close,
  isApplyAllChecked: getApplyAll,
});

// slots
const slots = defineSlots<{
  action: {};
  default: {};
  header: {};
  icon: {};
  close: {};
}>();

// const

// default button names
const DEF_LABELS = {
  overwrite: 'Overwrite',
  skip: 'Skip',
  rename: 'Rename',
  cancel: 'Cancel',
};



// data
/*
const ButtonList = ref(props.buttons || [
  [props.labelOverwrite, 'overwrite'],
  [props.labelSkip, 'skip'],
  [props.labelRename, 'rename'],
  [props.labelCancel, 'cancel'],
]);
*/

// reactives
const buttonList = ref();
const visible = ref(false);

// variables
let resolver: Function;
let result: any = undefined;




// watchers
watch(() => props.show, (newval, oldval) => {
  if( newval )
    start();
  else
    close();
}, {immediate: props.show});

// functions
function start() {
  buttonList.value = createButtonList();
  
  visible.value = true;
  result = undefined;
  applyAllChecked.value = false;
  
  const prom = new Promise((res) => {
    resolver = res;
  });

  emit('start', prom);
  return prom;
}

function close() {
  visible.value = false;
  const frozenResult = result;
  setTimeout(() => {
    resolver(frozenResult);
    emit('close', frozenResult);
  }, 50);

  return result;
}

function createButtonList() {
  const list = [];
  if( props.buttons ) {
    for( const item of props.buttons ) {
      let key, label;
      // string list
      if( typeof item === 'string' )
        key = label = item;
      // array list
      else if( item instanceof Array ) {
        [label, key] = item;
        if( typeof key === 'undefined' )
          key = label;
      }
      // object list
      else if( item )
        ({key, label} = item);

      if( !key || !label ) {
        console.error(item);
        throw new Error('unexpected button item')
      }

      list.push([label, key]);
    }
  }
  else {
    const defbuttons = props.defaultButtons || ['overwrite', 'skip', 'cancel'];
    defbuttons.forEach( key => {
      if( !(key in DEF_LABELS) )
        throw new Error(`${key} doen't exist in DEF_LABELS`)
      list.push([DEF_LABELS[key], key]) 
    });
  }

  return list;
}

function vnode2str(html: (() => VNodeChild) | string) {
  return typeof html === 'function' ? html() : html;
}

// event handlers
function onButtonClick(val: any) {
  result = val;
  close();
}
function onClickCloseButton() {
  result = 'close';
  close();
}
function onApplyAllChange(checked: boolean) {
  emit('applyAllChange', checked);
}
function getApplyAll() {
  return applyAllChecked.value;
}

</script>

<template>
  <n-modal
    :show="visible"
    :closable="closable"
    :draggable="draggable"

    :preset="preset"
    :title="title"
    :content="content"
    :type="type"
    
    @close="closable && onClickCloseButton()"
    @esc="closeOnEsc && onClickCloseButton()"
    @mask-click="maskClosable && onClickCloseButton()"
  >
    
    <template #action>
      <slot v-if="slots.action" name="action"/>
      <n-button v-else v-for="item in buttonList"
        @click="onButtonClick(typeof item[1] !== 'undefined' ? item[1] : item[0])"
      >
        {{ vnode2str(item[0]) }}
      </n-button>
    </template>

    <template #default>
      <slot name="default"/>
      <n-flex v-if="showApplyAll" justify="end" style="padding: 1em; font-size:0.8em;">
        <n-checkbox v-model:checked="applyAllChecked" @update-checked="onApplyAllChange">{{labelApplyAll}}</n-checkbox>
      </n-flex>
    </template>
    <template #header>
      <slot name="header"/>
    </template>
    <template #icon>
      <slot name="icon"/>
    </template>
    <template #close>
      <slot name="close"/>
    </template>
  </n-modal>
</template>
