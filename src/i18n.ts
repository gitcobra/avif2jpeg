import { nextTick, onServerPrefetch } from 'vue';
import { createI18n, type DefaultLocaleMessageSchema } from 'vue-i18n';
import en from './locales/en.json';

// language name list
export { default as LANG_FULL_NAMES } from './langlist.json';

// language id list
export const LANG_ID_LIST: string[] = [] as const;
// language name list
//export const LANG_NAMES: {[K: string]: string} = {} as const;



// prepare language files
const messages = { en };
const localeImports: Record<string, () => Promise<DefaultLocaleMessageSchema>> = {};
const messageImports = import.meta.glob('./locales/*.json');
//const localeUrls = import.meta.glob<string>('./locales/*.json', {query:'?url', import:'default'});
const messageGlobbedPath = {};
for(const path in messageImports) {
  const lang = ( path.match(/\/([a-z]{2}(?:-[a-z]+)?)\.json$/i) )?.[1];
  if( !lang )
    continue;
  
  LANG_ID_LIST.push(lang);
  
  if( lang in messages )
    continue;

  // locale promises
  localeImports[lang] = messageImports[path] as any;
  messageGlobbedPath[lang] = path;
}

// preload all languages when generating static htmls
if( import.meta.env.SSR ) {
  const messageImports = import.meta.glob('./locales/*.json', {eager: true});
  for(const path in messageImports) {
    const lang = ( path.match(/\/([a-z]{2}(?:-[a-z]+)?)\.json$/i) )?.[1];
    if( !lang || lang in messages )
      continue;
    messages[lang] = messageImports[path];
  }
}




// determine default language by current path
let defaultLang = getCurrentLangPath();
if( !(defaultLang in localeImports) )
  defaultLang = 'en';



/*
const messages: Record<string, DefaultLocaleMessageSchema> = {
  //en: await localeImports.en(), // ERROR: Top-level await is not available in the configured target environment
  en,
  //[defaultLang]: message,
};
*/


export const I18n = createI18n({
  legacy: false,
  globalInjection: true,

  locale: defaultLang,
  fallbackLocale: 'en',
  
  messages,

  // suppress the warning "XSS: [intlify] Detected HTML in '...' message. Recommend not using HTML messages to avoid XSS."
  warnHtmlMessage: false,
  missingWarn: false,
  fallbackWarn: false,
});

export async function loadLocaleMessages(locale) {
  if( I18n.global.availableLocales.indexOf(locale) >= 0 )
    return true;

  // load locale messages with dynamic import
  console.log(localeImports[locale], messageGlobbedPath[locale]);
  /*
  console.log(messageGlobbedPath[locale], localeUrls[messageGlobbedPath[locale]], localeUrls);
  const url: string = await localeUrls[messageGlobbedPath[locale]]();
  console.log(url);
  fetch(url).then(response => response.text()).then(txt => {
    console.log(txt);
  }).catch(err => {
    console.error(messageGlobbedPath[locale], err);
  });
  */
  const message = await localeImports[locale]().catch(err => console.error(err));
  if( !message ) {
    return false;
  }

  // set locale and locale message
  I18n.global.setLocaleMessage(locale, message);

  await nextTick();

  return true;
}

function getCurrentLangPath() {
  const currentPath = location.pathname;
  const langPath = String(currentPath.match(/[^/]+(?=\/?$)/) || '').toLowerCase();
  return langPath;
}
