<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { ref, onMounted } from 'vue';
import { AppsSharp } from '@vicons/ionicons5';

const deferredPrompt = ref(null);
const newVersion = ref('unknown');

const isPWAInstalled = ref();
const isOnline = ref(navigator.onLine);




// fire "beforeinstallprompt" event if the PWA is not installed as APP
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt.value = e;

  isPWAInstalled.value = false;
});
window.addEventListener('appinstalled', (evt) => {
  console.log('fired appinstalled');
  notifySWOnInstallComplete();
});

// observe online status
window.addEventListener('online', () => {
    isOnline.value = true;
});
window.addEventListener('offline', () => {
    isOnline.value = false;
});


const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  onOfflineReady() {
  },
  async onNeedRefresh() {
    const res = await fetch(location.origin + import.meta.env.BASE_URL + 'version.txt', { cache: 'no-store' });
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



onMounted(() => {
  setTimeout(() => {
    // if "beforeinstallprompt" event has not fired, set the installed flag.
    if( isPWAInstalled.value === undefined ) {
      isPWAInstalled.value = true;
    }
    
    if( isPWAInstalled.value )
      console.log('PWA is installed as APP.');
    else
      console.log('PWA is NOT installed as APP');
  }, 100);
});

function notifySWOnInstallComplete() {
  navigator.serviceWorker?.ready.then((registration) => {
    if( isPWAInstalled.value )
      return;
    
    console.log('postMessage("app-installed")');
    registration.active?.postMessage('app-installed');
    isPWAInstalled.value = true;
  });
}

async function installApp() {
  if( deferredPrompt.value && isOnline ) {
    deferredPrompt.value.prompt();
    console.log(deferredPrompt.value);
    const result = await deferredPrompt.value.userChoice
    console.log('User choice:', result)
    deferredPrompt.value = null;
    // notify PWA that the installation has been completed.
    if( result.outcome === 'accepted' ) {
      //if( window.matchMedia('(display-mode: standalone)').matches ) {
      console.log('user chose to install');
      notifySWOnInstallComplete();
      //}
    }
  }
}

async function close() {
  offlineReady.value = false;
  needRefresh.value = false;
  deferredPrompt.value = null;
}

async function updateSW() {
  close();
  await updateServiceWorker();
}

//needRefresh.value = true;

</script>

<template>
  <div style="line-height: 0px;">
  
  <!-- installed label -->
  <n-tooltip v-if="isPWAInstalled" placement="bottom">
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
  <n-tooltip v-else-if="!!deferredPrompt && !needRefresh"
    placement="bottom" :keep-alive-on-hover="true" style="max-width: 40vw;"
    :delay="300" :duration="150" :z-index="10"
  >
    <template #trigger>
      <n-button @click="installApp" size="tiny">
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

  <!-- refresh button -->
  <transition>
  <n-alert v-if="needRefresh" :title="newVersion" type="info" closable class="pwa-toast">
    <p class="message">
      {{$t('PWAUpdateMessage')}}
      <span v-if="needRefresh">        
      </span>
    </p>

    <n-flex :size="8">
      <n-button v-if="needRefresh" @click="updateSW" round type="primary" size="small">
        {{$t('Reload')}}
      </n-button>
      <n-button @click="close" round size="small">
        {{$t('close')}}
      </n-button>
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