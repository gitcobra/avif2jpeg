<template>  
  
  <n-popselect
    :show-arrow="true"
    trigger="click"
    size="small"
    placement="bottom-start"
    :options="Options"
    :render-label="renderLabel"
    @update:value="onSelect"
  >
    <template #header>
      <span style="font-size:x-small; user-select: none;">{{ $t('previousVersion') }}</span>
    </template>
    <span style="cursor: pointer;">v{{CurVer}}</span>
  </n-popselect>

</template>

<script setup lang="ts">
import Ver from '@/version.json';
import { DropdownOption } from 'naive-ui';



const VersionList: string[] = [
  '0.0.118',
];

const CurVer: string = `${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;
const Options = VersionList.map(ver => ({
  label: `v${ver}`,
  key: ver,
  value: ver,
}));

function renderLabel(option: DropdownOption) {
  const {key, label} = option;
  
  const href = getHrefByKey(key);
  const a = h('a', {href}, label as string);
  const item = h('div', null, a);

  return h('div', null, item);
}

function onSelect(key) {
  location.href = (getHrefByKey(key));
}

function getHrefByKey(key) {
  return `/avif2jpeg/old/${key}/`;
}


</script>
