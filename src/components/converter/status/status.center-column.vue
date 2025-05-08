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
const completedAll = ref(false);

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

      <!-- progress counter -->          
      <table class="status-table">
      <tbody>

        <!-- started, failure -->
        <tr class="started">
          <td>{{ $t('status.started') }}:</td>
          <td class="mini-counter">
            <!-- started -->
            <n-popover trigger="hover" :style="{color:c.infoColor}" placement="left">
              <template #trigger>
                <span :style="{color:c.infoColor}">
                  {{index.toLocaleString('en-us')}}
                </span>
              </template>
              {{$t('status.progressStarted')}} ({{ index.toLocaleString('en-us') }})
            </n-popover>
          </td>
        </tr>
        <tr class="failure">
          <td>{{ $t('status.failure') }}:</td>
          <td class="mini-counter">
      
            <!-- failure -->
            <n-popover trigger="hover" :style="{color:c.errorColor}" placement="left">
              <template #trigger>
                <span :style="{color:c.errorColor}">
                  {{failure.toLocaleString('en-us')}}
                </span>
              </template>
              {{$t('status.progressErrors')}} ({{ failure.toLocaleString('en-us') }})
            </n-popover>

            <!-- retry -->
            <n-popover v-if="retried > 0" trigger="hover" :style="{color:c.warningColor}" placement="left">
              <template #trigger>
                <span :style="{color:c.warningColor}">
                  ({{retried.toLocaleString('en-us')}})
                </span>
              </template>
              {{$t('status.progressRetries')}} ({{ retried.toLocaleString('en-us') }})
            </n-popover>
          </td>
        </tr>
        
        <!-- percent -->
        <tr>
          <td colspan="2">
            <n-flex :size="0" align="center" justify="center" :style="{color: processing ? statusColor : mainColor}" :wrap="false" class="perc">
              <n-icon v-if="completedAll" :component="Checkmark"></n-icon>
              <n-number-animation
                :duration="interval * 3 | 0"
                :from="successPercFrom |0"
                :to="successPercTo |0"
                :active="true"
              />%
            </n-flex>
        </td>
        </tr>
        
        <tr class="completed">
          <td>{{ $t('status.success') }}:</td>
          <td class="main-counter">
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
          <td>{{ $t('status.all') }}:</td>
          <td class="main-counter">
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

<style lang="scss">
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
  td * {
    vertical-align: middle;
  }
  tr >*:first-child {
    font-size: 0.7em;
    text-align: right;
    padding-right: 0.2em;
  }
  td.mini-counter {
    font-size: 0.9em;
    text-align: left;
    line-height: 1em;
  }
  .perc {
    font-size: 32px;
    width: 100%;
    height: 100%;
    line-height:1.2em;
  }
  td.main-counter {
    font-size: 1.4em;
    min-width:2em;
    text-align: left;
    line-height: 1em;
  }
}

</style>