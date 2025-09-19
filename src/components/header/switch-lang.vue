<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { GlobeOutline, Close } from '@vicons/ionicons5';
import { useI18n } from "vue-i18n";
import { LANG_ID_LIST, LANG_FULL_NAMES, loadLocaleMessages, I18n } from '@/i18n';
import { GlobalValsKey } from "../../Avif2Jpeg.vue";
import { sleep } from '../util';
import { SelectMixedOption } from 'naive-ui/es/select/src/interface';



// injections
const INJ = inject(GlobalValsKey);


// common
const router = useRouter();
const { locale, t } = useI18n();
const dialog = useDialog();


// properties
const props = defineProps<{
  // delay before applying a changed language
  delay: number
}>();

// emits
const emit = defineEmits<{
  'ready': []
  'lang-ready': [string]
  'lang-change': [string]
  'lang-change-by-user': [string]
}>();


// constants

// create language list
const langOptions: SelectMixedOption[] = Object.entries( LANG_FULL_NAMES ).map( ([key, val]) => ({ label:val, value:key }) );
langOptions.sort((a, b) => {
  const c = a.label;
  const d = b.label;
  return c > d ? 1 : c < d ? -1 : 0;
});


// variables
let lastUserSelectedLangId = '';


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



// change locale by current path
await setLocaleByCurrentPath();
insertHeadForSSG();

emit('ready');



function insertHeadForSSG() {
  // create <link rel="alternate" hreflang="...">
  const basepath = import.meta.env.BASE_URL;
  const linkset = [];
  for(const lang of LANG_ID_LIST) {
    if( router.currentRoute.value.path.includes(lang) )
      continue;
    
    const linkobj = {
      rel: 'alternate',
      hreflang: lang,
      href: basepath + lang,
    };
    linkset.push(linkobj);
  }
  linkset.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: basepath,
  });

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
      },
    ],

    link: [...linkset]
  });
}









// general functions

async function setLocaleMessages(lang: string) {
  if( lang !== locale.value || I18n.global.availableLocales.indexOf(lang as any) === -1 ) {
    emit('lang-change', lang);
    await sleep( props.delay );

    const success = await loadLocaleMessages(lang);
    if( !success ) {
      dialog.error({
        title: t('Failed to get language file'),
        positiveText: 'OK',
        content: () => h('div', [`lang: ${lang}`]),
      });
      //changeRoute('');
      emit('lang-ready', '');
      return false;
    }
    
    locale.value = lang;

    // change page title
    document.title = t('title');

    // change lang attribute of <html>
    document.documentElement.lang = lang;

    await nextTick();
  }

  emit('lang-ready', lang);
  return true;
}

async function setLocaleByCurrentPath() {
  const currentPath = router.currentRoute.value.path || '';
  const lang = currentPath.match(/([^/]+)\/?$/)?.[1] || '';
  //alert(lang)

  if( import.meta.env.SSR )
    locale.value = lang;

  // change locale by the page path
  if( lang && LANG_ID_LIST.includes(lang) ) {
    const success = await setLocaleMessages(lang);
    if( success ) {
      // emit 'lang-change-by-user' if it equils to last selected lang from the menu
      if( lastUserSelectedLangId === lang )
        emit('lang-change-by-user', lang);
    }
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
  lastUserSelectedLangId = val;
  const path = val ? val + '/' : '';
  router.push('/' + path);
}

</script>




<template>
  <n-flex align="center" :size="2">
    <n-tooltip
      v-if="router.currentRoute.value.path !== '/'"
      trigger="hover" :keep-alive-on-hover="false" placement="left" :duration="0" :delay="50"
    >
      <template #trigger>
        <router-link
          to="/"
          @click="emit('lang-change-by-user', '')"
          style="color: gray; line-height: 0px; font-size:1.2em;"
        >
          <n-icon :component="Close"/>
        </router-link>
      </template>
      <template #default>
        {{t('selectLangCloseTooltip')}}
      </template>
    </n-tooltip>

    <n-tooltip :to="false" trigger="hover" :keep-alive-on-hover="false" :placement="INJ.LANDSCAPE.value ? 'left' : 'bottom'" :duration="0" :delay="50">
      <template #trigger>
        <n-select
          ref="langselect"
          size="tiny"
          style="width: auto;"
          :consistent-menu-width="false"
          
          :options="langOptions"
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
  </n-flex>
</template>

