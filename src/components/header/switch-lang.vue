<script setup lang="ts">
import { useHead } from '@vueuse/head';
import { GlobeOutline, Close } from '@vicons/ionicons5';
import { useI18n } from "vue-i18n";
import { LANG_ID_LIST, LANG_FULL_NAMES, loadLocaleMessages, I18n } from '@/i18n';
import { GlobalValsKey } from "../../Avif2Jpeg.vue";
import { invertRef, sleep, useTimeoutRef } from '../util';
import { SelectMixedOption } from 'naive-ui/es/select/src/interface';


// injections
const INJ = inject(GlobalValsKey);


// common
const router = useRouter();
const { locale, t } = useI18n();
const dialog = useDialog();


// properties
const props = defineProps<{
  initialLang?: string;
  // delay before applying a changed language
  delay: number;
}>();


// emits
const emit = defineEmits<{
  'mounted': [];
  'ready': [];
  'lang-ready': [string];
  'lang-change': [string];
  'lang-change-by-user': [string];
}>();

// reactive values
const noticedLang = ref('');
const langNoticeFlag = ref(false);



// constants

// create language list
const langOptions: SelectMixedOption[] = Object.entries( LANG_FULL_NAMES ).map(
  ([key, val]) => ({ label:val, value:key })
);
langOptions.sort((a, b) => {
  const c = a.label;
  const d = b.label;
  return c > d ? 1 : c < d ? -1 : 0;
});


// variables
let lastUserSelectedLangId = '';



insertHeadForSSG();
await initializeLanguage();
emit('ready');

// initialize on mounted 
onMounted(async () => {
 
  // router settings
  // set locale when changing page path
  router.afterEach((to, from, next) => {
    setLocaleByCurrentPath();

    // show tooltips
    INJ.switchToolTipVisibility();
  });

  emit('mounted');
});



async function initializeLanguage() {
  // check language
  const route = useRoute();
  const pathlang = route.path.match(/[^/]+(?=\/?$)/)?.[0];
  
  // set language by settings
  let ulang = props.initialLang;
  if( !pathlang && ulang ) {
    const router = useRouter();
    console.log('change lang by root', ulang);
    await router.push('/' + ulang + '/');
  }

  // change locale by current path
  await setLocaleByCurrentPath();

  if( !import.meta.env.SSR ) {
    checkAppropriateLang();
  }

}

async function checkAppropriateLang() {
  const currentPath = router.currentRoute.value.path || '';
  const clang = currentPath.match(/([^/]+)\/?$/)?.[1] || '';
  if( !clang ) {
    return;
  }

  const blangs = getBrowserLanguages();
  let prior = 0;
  for(; prior < blangs.length; prior++ ) {
    const lang = blangs[prior];
    if( clang === lang ) {
      break;
    }
  }

  if( prior === 0 ) {
    return;
  }

  const len = Math.max(prior, blangs.length);
  for( let i = 0; i < len; i++ ) {
    const lang = blangs[i];
    if( await loadLocaleMessages(lang) ) {
      noticedLang.value = lang;
      langNoticeFlag.value = true;
      invertRef(langNoticeFlag, 15000);
      break;
    }
  }
}


function insertHeadForSSG() {
  /*
  if( !import.meta.env.SSR ) {
    return;
  }
  */
  
  // create <link rel="alternate" hreflang="...">
  const basepath = import.meta.env.BASE_URL;
  // insert appropriate language title (for SSG)
  useHead({
    title: computed(() => t('title')),

    meta: [
      {
        property: "og:title",
        content: computed(() => t('title')),
      },
      {
        property: `og:description`,
        content: computed(() => t('metaDescription')),
      },
    ],

    link: computed(() => {
      const linkset = [];
      for(const lang of LANG_ID_LIST) {
        if( router.currentRoute.value.path.includes(lang) )
          continue;

        linkset.push({
          rel: 'alternate',
          hreflang: lang,
          href: basepath + lang + '/',
        });
      }
      linkset.push({
        rel: 'alternate',
        hreflang: 'x-default',
        href: basepath,
      });
      return linkset;
    }),
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
  const lang = currentPath.match(/([a-z\-]{2,})\/? *$/)?.[1] || '';

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
  for(const userlang of getBrowserLanguages()) {

    if( LANG_ID_LIST.includes(userlang) ) {
      return await setLocaleMessages(userlang);
    }

    const langhead = userlang.split('-')[0];
    if( LANG_ID_LIST.includes(langhead) ) {
      let lang = langhead;

      // choose traditional or simplified chinese
      if( langhead === 'zh' ) {
        switch( userlang ) {
          case 'zh-hant':
          case 'zh-mo':
            lang = 'zh-hant';
            break;
          case 'zh-hk':
            lang = 'zh-hk';
            break;
          case 'zh-tw':
            lang = 'zh-tw';
        }
      }

      return await setLocaleMessages(lang);
    }
  }

  return false;
}

function getBrowserLanguages(): string[] {
  const navigator = window.navigator as any;
  const languages = Array.isArray(navigator.languages) ? navigator.languages : [];
  const fallbackLanguages = [
    navigator.language,
    navigator.userLanguage,
    navigator.browserLanguage,
  ];
  const result = new Set<string>();

  for(const language of [...languages, ...fallbackLanguages]) {
    if( typeof language === 'string' && language )
      result.add(language.toLowerCase().replace(/_/g, '-'));
  }

  return [...result];
}

function changeRoute(val: string) {
  console.log(`changeRoute: ${router.currentRoute.value.fullPath} => ${val}`);
  lastUserSelectedLangId = val;
  const path = val ? val + '/' : '';
  router.push('/' + path);
}

</script>




<template>
  <n-popover
    trigger="manual"
    placement="left"
    :show="langNoticeFlag"
    @clickoutside="langNoticeFlag=false"
  >
    <template #trigger>
      
      
      <n-flex align="center" :size="2" :wrap="false">
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

        <n-tooltip :to="false" trigger="hover" :keep-alive-on-hover="false"
          :placement="INJ.LANDSCAPE.value ? 'left' : 'bottom'" :duration="0" :delay="50"
        >
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
    
    
    <span>
      {{ $t('langNotice', {}, {locale: noticedLang}) }}
      <n-button @click="changeRoute(noticedLang); langNoticeFlag = false;" type="primary">
        {{ $t('apply', {}, {locale: noticedLang}) }}
      </n-button>
    </span>
  </n-popover>
</template>

