<script setup lang="ts">
import { useThemeVars } from 'naive-ui';
import { Checkmark } from '@vicons/ionicons5';

const props = defineProps<{
  processing: boolean
  interval: number
  statusColor: string
  
  success: number // synched value
  successTo: number
  successFrom: number
  index: number
  length: number
  failure: number
  retried: number
  
  successPercTo: number
  successPercFrom: number
}>();

const c = useThemeVars();
const mainColor = ref(c.value.successColor);
const completedAll = ref(false)

// end of process
watch(() => props.processing, (val) => {
  if( !val ) {
    if( props.success === props.length ) {
      completedAll.value = true;
    }
    else {
      mainColor.value = c.value.errorColor;
    }
  }
});

</script>

<template>
  <n-progress
    type="multiple-circle"
    :stroke-width="2"
    :percentage="[
      successTo / length * 100 |0,
      index / length * 100 |0,
    ]"
    :color="[
      c.successColor,
      statusColor,
    ]"
    :rail-style="[
      {stroke: mainColor, opacity:0.3},
      //{stroke: statusColor, opacity:0.3},
    ]"
  >
    <!-- content in the center circle -->
    <n-flex vertical align="center" justify="center" :size="0" style="font-family:v-mono; white-space: nowrap;" :wrap="false" :wrap-item="false">
      <!-- percent -->
      <n-flex :size="0" align="center" :style="{color: processing ? statusColor : mainColor, fontSize: '1.4em'}" :wrap="false">
        <n-icon v-if="completedAll"><Checkmark/></n-icon>
        <n-number-animation
          :duration="interval * 3 | 0"
          :from="successPercFrom |0"
          :to="successPercTo |0"
          :active="true"
        />%
      </n-flex>
      
      <!-- progress counter -->          
      <table class="status-table">
      <tbody>
      <tr class="started">
        <td>{{ $t('status.started') }}:</td>
        <td>
          <!-- started -->
          <n-popover trigger="hover" :style="{color:c.infoColor}" placement="left">
            <template #trigger>
              <span :style="{fontSize:'xx-small', color:statusColor, lineHeight:'0'}">
                {{index.toLocaleString('en-us')}}
              </span>
            </template>
            {{$t('status.progressStarted')}} ({{ index.toLocaleString('en-us') }})
          </n-popover>
          
          <!-- retry -->
          <n-popover v-if="retried > 0" trigger="hover" :style="{color:c.warningColor}" placement="left">
            <template #trigger>
              <span :style="{fontSize:'xx-small', color:c.warningColor,lineHeight:'0'}">
                ({{retried.toLocaleString('en-us')}})
              </span>
            </template>
            {{$t('status.progressRetries')}} ({{ retried.toLocaleString('en-us') }})
          </n-popover>
          
          <!-- failure -->
          <n-popover v-if="failure > 0" trigger="hover" :style="{color:c.errorColor}" placement="left">
            <template #trigger>
              <span :style="{fontSize:'xx-small', color:c.errorColor,lineHeight:'0'}">
                ({{failure.toLocaleString('en-us')}})
              </span>
            </template>
            {{$t('status.progressErrors')}} ({{ failure.toLocaleString('en-us') }})
          </n-popover>
        </td>
      </tr>
      <tr class="completed">
        <td>{{ $t('status.success') }}:</td>
        <td style="font-size: medium;">
          <n-popover trigger="hover" :duration="0" :delay="0" :style="{color:c.successColor}" placement="bottom">
            <template #trigger>
              <span :style="{color:c.successColor}">
              <n-number-animation
                :duration="interval * 3 | 0"
                :from="successFrom"
                :to="successTo"
                :active="true"
                :show-separator="true"
              />
              </span>
            </template>
            {{$t('status.progressSuccess')}} ({{ successTo.toLocaleString('en-us') }})
          </n-popover>
        </td>
      </tr>
      <tr class="total">
        <td>{{ $t('status.files') }}:</td>
        <td style="font-size: medium;">
          <n-popover trigger="hover" :duration="0" :delay="0" placement="bottom">
            <template #trigger>
              {{length.toLocaleString('en-us')}}
            </template>
            {{$t('status.progressTotal')}} ({{ length.toLocaleString('en-us') }})
          </n-popover>
        </td>
      </tr>
      </tbody>
      </table>

    </n-flex>


  </n-progress>
</template>

<style scoped lang="scss">
.status-table {
  border-collapse: collapse;
  border-spacing: 0px;

  font-size: x-small;
  padding: 0px;
  margin: 0px;
  tr, td {
    padding: 0px;
    margin: 0px;
  }
  tr>*:first-child {
    text-align: right;
    padding-right: 0.2em;
  }
}

</style>