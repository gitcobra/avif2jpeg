<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { ref, onMounted } from 'vue';
import { AppsSharp } from '@vicons/ionicons5';

const deferredPrompt = ref(null);
const beforeinstallpromptFired = ref(false);
const isPWAInstalled = ref(undefined);
const refreshPageCancelled = ref(false);

const newVersion = ref('unknown');



// fire "beforeinstallprompt" event if the PWA is not installed as APP
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt.value = e;

  beforeinstallpromptFired.value = true;
  isPWAInstalled.value = false;
});

// installed as PWA
window.addEventListener('appinstalled', (evt) => {
  console.log('fired appinstalled');
  notifySWOnInstallationComplete();

  try {
    // @ts-ignore
    gtag('event', 'pwa_installed', {
      event_category: 'PWA',
      event_label: 'User installed PWA',
    });
  } catch(e) {}
});


const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  onOfflineReady() {
  },
  async onNeedRefresh() {
    const res = await fetch(
      location.origin + import.meta.env.BASE_URL + 'version.txt',
      { cache: 'no-store' }
    );
    if( res.status !== 200 )
      return;
    
    const vtxt = await res.text();
    if( vtxt )
      newVersion.value = vtxt;
  },
  onRegisterError(error) {
    console.log("registSWerror", error)
  }
});



onMounted(async () => {
  setTimeout(initPWAStatus, 100);
});


async function initPWAStatus() {
  // do nothing for non-Chromium browsers
  if( !(await isChromiumBrowser()) )
    return;
  
  // if "beforeinstallprompt" event has not fired, set the installed flag.
  isPWAInstalled.value = !!( isRunningAsPWA() || !beforeinstallpromptFired.value );

  if( isPWAInstalled.value ) {
    console.log('PWA is installed as APP.');
    try {
      // @ts-ignore
      gtag('event', 'pwa_launch', {
        event_category: 'PWA',
        event_label: 'App opened as PWA',
      });
    } catch(e) {}
  }
  else
    console.log('PWA is NOT installed as APP');
}

/**
 * Check if the current browser is Chromium-based
 */
async function isChromiumBrowser() {
  // @ts-ignore
  const flag = await navigator.userAgentData?.getHighEntropyValues(['brands']).then(vals => {
    return vals.brands.some(b =>
      b.brand.includes('Chromium') ||
      b.brand.includes('Google Chrome') ||
      b.brand.includes('Microsoft Edge')
    );
  });

  // fallback for older browsers
  return flag || /Chrome|Chromium|Edg\//.test(navigator.userAgent);
}

/**
 * Check if the PWA is running in standalone mode
 */
function isRunningAsPWA() {
  return window.matchMedia('(display-mode: standalone)').matches
    // @ts-ignore
    || window.navigator.standalone === true;
}

// PWA installation prompt
async function showPWAInstallationPrompt() {
  if( deferredPrompt.value ) {
    deferredPrompt.value.prompt();

    const result = await deferredPrompt.value.userChoice
    console.log('User choice:', result)
    deferredPrompt.value = null;

    // PWA installation started
    if( result.outcome === 'accepted' ) {
      console.log('user chose to install');
      setTimeout(notifySWOnInstallationComplete, 500);
    }
  }
}

// notify SW that PWA installation has been completed.
function notifySWOnInstallationComplete() {
  navigator.serviceWorker?.ready.then((registration) => {
    if( isPWAInstalled.value )
      return;
    
    console.log('postMessage("app-installed")');
    registration.active?.postMessage('app-installed');
    isPWAInstalled.value = true;
  });
}

function onUpdateAlertClosed() {
  refreshPageCancelled.value = true;
  setTimeout(() => refreshPageCancelled.value = false, 60 * 60 * 1000);
  //offlineReady.value = false;
  //isPWAInstalled.value = undefined;
  //deferredPrompt.value = null;
}

async function updateSW() {
  needRefresh.value = false;
  await updateServiceWorker();
}


//needRefresh.value = true;

</script>

<template>
  <div style="line-height: 0px;">
  
  <!-- installed label -->
  <n-tooltip v-if="isPWAInstalled === true" placement="bottom">
    <template #trigger>
      <n-flex id="app-installed" align="center" :size="1">
        <n-icon :component="AppsSharp"/>PWA
      </n-flex>
    </template>
    <template #default>
      {{$t('PWAInstalledTooltip')}}
    </template>
  </n-tooltip>
  <!-- install button -->
  <n-tooltip v-else-if="isPWAInstalled === false && deferredPrompt && !needRefresh"
    placement="bottom" :keep-alive-on-hover="true" style="max-width: 40vw;"
    :delay="300" :duration="150" :z-index="10"
  >
    <template #trigger>
      <n-button @click="showPWAInstallationPrompt" size="tiny">
        <template #icon>
          <n-icon :component="AppsSharp"/>
        </template>
        {{$t('installAsApp')}}
      </n-button>
    </template>
    <template #default>
      <div id="pwa-tooltip" v-html="$t('PWAinstallAsAppTooltip')"/>
    </template>
  </n-tooltip>

  <!-- request page reload to update Service Worker -->
  <transition>
  <n-alert
    v-if="needRefresh && !refreshPageCancelled"
    @close="onUpdateAlertClosed"
    type="info"
    closable
  >
    <n-flex justify="space-between" align="center">
      <n-flex vertical class="message" :size="1">
        <span>{{newVersion}}</span>
        <span>{{$t('PWAUpdateMessage')}}</span>
      </n-flex>

      <n-flex :size="8">
        <n-button @click="updateSW" round type="primary" size="small">
          {{$t('Reload')}}
        </n-button>
        <n-button @click="onUpdateAlertClosed" round size="small">
          {{$t('close')}}
        </n-button>
      </n-flex>
    </n-flex>
  </n-alert>
  </transition>
  
  </div>
</template>

<style lang="scss">
#pwa-tooltip {
  a {
    color: red;
  }
}
#app-installed {
  width: max-content;
  font-weight: bolder;
  font-size: 0.8em;
  opacity: 0.5;
  user-select: none;
}
</style>