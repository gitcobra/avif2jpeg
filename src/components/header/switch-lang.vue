<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { GlobeOutline } from '@vicons/ionicons5';
import { useI18n } from "vue-i18n";
import { LANG_ID_LIST, LANG_NAMES, loadLocaleMessages, I18n } from '@/i18n';
import { GlobalValsKey } from "../../Avif2Jpeg.vue";
import { sleep } from '../util';





// injections
const INJ = inject(GlobalValsKey);


// common
const router = useRouter();
const { locale, t } = useI18n();



// properties
const props = defineProps<{
  // delay before applying a changed language
  delay: number
}>();

// emits
const emit = defineEmits<{
  'lang-ready': [string]
  'lang-change': [string]
}>();


// constants

// create language list
const langOptions = Object.entries( LANG_NAMES ).map( ([key, val]) => ({ label:val, value:key }) );
langOptions.sort((a, b) => {
  const c = a.label;
  const d = b.label;
  return c > d ? 1 : c < d ? -1 : 0;
});



// initialize on mounted 

onMounted(() => {
 
  // router settings
  // set locale when changing page path
  router.afterEach((to, from, next) => {
    setLocaleByCurrentPath();

    // show tooltips
    INJ.switchToolTipVisibility();
  });
});




// set language for SSG
await setLocaleByCurrentPath();

if( import.meta.env.SSR ) {
  // insert appropriate language title (for SSG)
  useHead({
    title: t('title'),

    meta: [
      {
        property: "og:title",
        content: t('title'),
      },
      {
        property: `og:description`,
        content: t('metaDescription'),
      }
    ],
  });
}










// general functions

async function setLocaleMessages(lang: string) {
  if( lang !== locale.value || I18n.global.availableLocales.indexOf(lang as any) === -1 ) {
    emit('lang-change', lang);
    await sleep( props.delay );
    await loadLocaleMessages(lang);
    locale.value = lang;

    // change page title
    document.title = t('title');

    await nextTick();
  }

  emit('lang-ready', lang);
}

async function setLocaleByCurrentPath() {
  const currentPath = router.currentRoute.value.path || '';
  const lang = String(currentPath.match(/(?<=^\/)[^/]+/) || '');

  if( import.meta.env.SSR )
    locale.value = lang;

  // change locale by the page path
  if( lang && LANG_ID_LIST.includes(lang) ) {
    await setLocaleMessages(lang);
    locale.value = lang;
  }
  else {
    await setLocaleByBrowserLanguage();
  }
}

async function setLocaleByBrowserLanguage() {
  const userlang = getBrowserLanguage().toLowerCase();
  const langhead = userlang.split(/[-_]/)[0];

  if( LANG_ID_LIST.includes(langhead) ) {
    let lang = langhead;
    
    // choose traditional or simplified chinese
    if( langhead === 'zh' ) {
      switch( userlang ) {
        case 'zh-hant':
        case 'zh-mo':
        case 'zh-hk':
        case 'zh-tw':
          lang = 'zh-hant';
      }
    }

    await setLocaleMessages(lang);
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
  <n-tooltip :to="false" display-directive="show" :show="INJ.showTooltipsBeforeMounted.value" trigger="hover" :keep-alive-on-hover="false" :placement="INJ.LANDSCAPE.value ? 'left' : 'bottom'" :duration="0" :delay="50">
    <template #trigger>
      <n-select
        ref="langselect"
        size="tiny"
        style="width: auto;"
        :consistent-menu-width="false"
        
        :options="langOptions"
        _v-model:value="locale"
        :value="locale"
        @update:value="changeRoute"
      >
        <template #arrow>
          <n-icon><GlobeOutline /></n-icon>
        </template>
      </n-select>
    </template>
    <div v-html="$t('selectLanguage')"></div>
  </n-tooltip>
</template>

