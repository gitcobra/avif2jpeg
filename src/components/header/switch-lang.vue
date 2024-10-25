<script setup lang="ts">
import { GlobeOutline } from '@vicons/ionicons5';
import { useI18n } from "vue-i18n";
import { GlobalValsKey } from "../../Avif2Jpeg.vue";
import { LANG_ID_LIST, LANG_NAMES } from '../../i18n';




// injections
const INJ = inject(GlobalValsKey);

// common
const router = useRouter();
const { locale, t } = useI18n();


// constants

// create language list
const langList: {
  label: string,
  value: string,
}[] = [];
const langOptions = ref(langList);

for( const lang of LANG_ID_LIST ) {
  langList.push({
    label: LANG_NAMES[lang],
    value: lang,
  });
}

langList.sort((a, b) => {
  const c = a.label;
  const d = b.label;
  return c > d ? 1 : c < d ? -1 : 0;
});



// initialize on mounted 
onMounted(() => {
  //console.log("mounted switchlang.vue", locale.value);
 
  // router settings
  // set locale when changing page path
  router.afterEach((to, from, next) => {
    //console.log('onbeforeroute', from.fullPath, to.fullPath, locale.value)
    
    setLocaleByCurrentPath();
    
    // change page title
    document.title = t('title');
    // show tooltips
    INJ.switchToolTipVisibility();
  });

});


setLocaleByCurrentPath();





// general functions

function setLocaleByCurrentPath() {
  const currentPath = router.currentRoute.value.path || '';
  const langPath = String(currentPath.match(/(?<=^\/)[^/]+/) || '');

  if( locale.value === langPath )
    return;

  // change locale by the page path
  if( langPath && LANG_ID_LIST.includes(langPath) ) {
    console.log(`setLocaleByPath: ${langPath}`)
    locale.value = langPath;
  }
  else {
    setLocaleByBrowserLanguage();
  }
}

function setLocaleByBrowserLanguage() {
  const userlang = getBrowserLanguage().toLowerCase();
  const langhead = userlang.split(/[-_]/)[0];
  
  $LANG:
  if( LANG_ID_LIST.includes(langhead) ) {
    // choose traditional or simplified chinese
    if( langhead === 'zh' ) {
      switch( userlang ) {
        case 'zh-hant':
        case 'zh-mo':
        case 'zh-hk':
        case 'zh-tw':
          locale.value = 'zh-hant';
          break $LANG;
      }
    }

    locale.value = langhead;
  }
}

function getBrowserLanguage(): string {
  const navigator = window.navigator as any;
  return navigator.language || navigator.userLanguage || navigator.browserLanguage;
}

function changeRoute(val: string) {
  console.log(`changeRoute: ${router.currentRoute.value.fullPath} => ${val}`);
  router.push('/' + val + '/');
}

</script>




<template>
  <n-tooltip :to="false" display-directive="show" :show="INJ.showBeforeMounted.value" trigger="hover" :keep-alive-on-hover="false" :placement="INJ.LANDSCAPE.value ? 'left' : 'bottom'" :duration="0" :delay="50">
    <template #trigger>
      <n-select ref="langselect" size="tiny" v-model:value="locale" :options="langOptions" :consistent-menu-width="false" @update:value="changeRoute" style="width: 100%;">
        <template #arrow>
          <n-icon><GlobeOutline /></n-icon>
        </template>
      </n-select>
    </template>
    <div v-html="$t('selectLanguage')"></div>
  </n-tooltip>
</template>

