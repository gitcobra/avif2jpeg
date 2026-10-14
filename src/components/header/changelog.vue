<script setup lang="ts">
import { UserSettings } from '@/user-settings';
import { sleep } from '../util';



// properties
const props = defineProps<{
  url: string;
}>();


const changeLogLatestTime = ref(0);
const logTxt = ref('');
const updated = computed(
  () => changeLogLatestTime.value > UserSettings.changeLogCheckedDate
);
const logs = ref('');
watch<string>(logTxt, () => {
  if( !logTxt.value )
    logs.value = 'fetching...';
  
  // change the date to local time and highlight if updated  
  logs.value = logTxt.value.replace(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) \+\d+$/mg,
    (m, $1) => {
      const commitDate = new Date(m);
      const commitTime = commitDate.getTime();
      const locTimeStr = commitDate.toLocaleString();
      let update = '';
      if( commitTime > UserSettings.changeLogCheckedDate ) {
        if( commitTime > changeLogLatestTime.value )
          changeLogLatestTime.value = commitTime;
        update = 'update';
      }
      return `<span class="date ${update}">${locTimeStr}</span>`;
    }
  );
});

onMounted(() => getChangeLog(props.url /*props.owner, props.repo*/));

async function getChangeLog(url: string) {
  const txt = await fetch(url, {
    headers: {
        'Accept': 'application/vnd.github.v3+json'
    },
    cache: 'no-cache',
  }).then(res => res.ok ? res.text() : null);

  if( txt ) {
    logTxt.value = txt;
    changeLogLatestTime.value = 1;
  }
}

function updateLastCheckedDate(show) {
  /*
  if( show )
    return;
  */
  if( changeLogLatestTime.value > UserSettings.changeLogCheckedDate ) {
    UserSettings.changeLogCheckedDate = changeLogLatestTime.value;
  }
}


</script>

<template>
<n-popover
  trigger="click" placement="bottom" arrow-point-to-center
  @update:show="updateLastCheckedDate"
  style="margin-left:-1em; max-width:80%; white-space:initial;"
>
  <template #trigger>
    <n-flex align="center" :size="1" style="cursor:pointer;">
      <n-icon
        size="1.5em"
        :color="updated ? 'blue' : 'silver'"
        style="transition: color 0.5s;"
      ><IonNotificationsCircleOutline/></n-icon>
      {{ $t('changelog') }}
    </n-flex>
  </template>
  <template #default>
    <div v-if="!logs" style="color:red">
      connection error
    </div>
    <pre v-else v-html="logs" class="commits"/>
  </template>
</n-popover>
</template>

<style lang="scss">
.commits {
  white-space: pre-wrap;
  line-height: 0.9em;
  margin-left: 1em;
  .date {
    color: gray;
    margin-left: -1em;
    margin-bottom: 0px;
    line-height: 1em;
    &.update {
      color: blue;
    }
  }
}
ul {
  margin: 0px;
  padding-left: 1em;
}
.message {
  list-style-type: none;
  margin-left: 1em;
}

</style>
