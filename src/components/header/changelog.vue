<script setup lang="ts">
import { UserSettings } from '@/user-settings';
import { NotificationsCircleOutline } from "@vicons/ionicons5";
import { sleep } from '../util';



// properties
const props = defineProps<{
  /*
  owner: string;
  repo: string;
  */
  url: string;
}>();

// reactives
/*
const logs = ref<{
  date: string,
  message: string,
}[] | null>([]);
*/
const logs = ref('fetching...');
const updated = ref(false);

onMounted(() => getChangeLog(props.url /*props.owner, props.repo*/));



let changeLogLatestTime = 0;
async function getChangeLog(url: string /*owner: string, repo: string*/) {
  //const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`;
  const txt = await fetch(url, {
    headers: {
        'Accept': 'application/vnd.github.v3+json'
    }
  }).then(res => res.ok ? res.text() : null);

  logs.value = '';
  if( !txt )
    return;

  console.log(txt);

  /*
  updated.value = txt[0]?.commit.author.date > UserSettings.changeLogCheckedDate;
  if( updated.value ) {
    UserSettings.changeLogCheckedDate = txt[0]?.commit.author.date;
  }

  logs.value = txt.map(commit => ({
    date: new Date(commit.commit.author.date).toLocaleString(),
    message: commit.commit.message
  }));
  */

  const date = txt.match(/^\d{4}.+/)?.[0];
  if( !date )
    return;
  changeLogLatestTime = new Date(date).getTime();
  if( changeLogLatestTime > UserSettings.changeLogCheckedDate ) {
    updated.value = true;
  }
  logs.value = txt.replace(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) \+\d+$/mg, (m) => new Date(m).toLocaleString());
}

function onClickChangelog() {
  UserSettings.changeLogCheckedDate = changeLogLatestTime;
  updated.value = false;
}


</script>

<template>
<n-popover trigger="click" placement="bottom" arrow-point-to-center @update:show="onClickChangelog" style="margin-left:-1em; max-width:80%; white-space:initial;">
  <template #trigger>
    <n-flex align="center" :size="1" style="cursor:pointer;">
      <n-icon :component="NotificationsCircleOutline" size="1.5em" :color="updated ? 'blue' : 'silver'" style="transition: color 0.5s;"></n-icon>
      {{ $t('changelog') }}
    </n-flex>
  </template>
  <template #default>
    <div v-if="!logs" style="color:red">
      connection error
    </div>
    <pre v-else v-html="logs" class="commits"/>
    <!--
    <ul v-else v-for="({date, message}) in logs" class="commits">
      <li class="date">{{date}}</li>
      <li class="message"><pre>{{message}}</pre></li>
    </ul>
    -->

    <!--
    <n-flex justify="end" style="font-size:0.7em;">
      <a href="https://github.com/gitcobra/avif2jpeg/commits/main/">Commitments</a>
    </n-flex>
    -->
  </template>
</n-popover>
</template>

<style lang="scss">
.commits {
  white-space: pre-wrap;
  line-height: 0.9em;

}
ul {
  margin: 0px;
  padding-left: 1em;
}
.date {

}
.message {
  list-style-type: none;
  margin-left: 1em;
}

</style>
