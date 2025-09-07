<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { ref, onMounted } from 'vue';




const deferredPrompt = ref(null)
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
  offlineReady.value = false
  needRefresh.value = false
}

async function updateSW() {
  await updateServiceWorker();
}

</script>

<template>
  <!-- install button -->
  <n-flex justify="start">
    <div v-if="!!deferredPrompt">
      <n-tooltip :to="false" display-directive="show" trigger="hover"
        placement="bottom" :keep-alive-on-hover="true" style="max-width: 40vw;"
        :delay="300" :duration="150" :z-index="10"
      >
        <template #trigger>
          <n-button @click="installApp" size="tiny">{{$t('installAsApp')}}</n-button>
        </template>
        <template #default>
          <div class="pwa-tooltip" v-html="$t('PWAinstallAsAppTooltip')"/>
        </template>
      </n-tooltip>
    </div>
  </n-flex>

  <!-- refresh button -->
  <div
    v-if="offlineReady || needRefresh"
    class="pwa-toast"
    role="alert"
  >
    <div class="message">
      <!--
      <span v-if="offlineReady">
        App ready to work offline
      </span>
      -->
      <span v-if="needRefresh">
        {{$t('PWAUpdateMessage')}}
        <p>{{ newVersion }}</p>
      </span>
    </div>
    <n-button v-if="needRefresh" @click="updateSW">
      {{$t('Reload')}}
    </n-button>
    <n-button @click="close">
      {{$t('close')}}
    </n-button>
  </div>
</template>

<style>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  background-color: white;
}
.pwa-toast .message {
  margin-bottom: 8px;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
.pwa-tooltip a {
  color: red;
}
</style>