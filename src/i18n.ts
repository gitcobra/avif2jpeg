import { nextTick } from 'vue';
import { createI18n, type DefaultLocaleMessageSchema } from 'vue-i18n';
import en from './locales/en.json';

// language name list
export { default as LANG_NAMES } from './locales/langlist.json';

// language id list
export const LANG_ID_LIST: string[] = [] as const;
// language name list
//export const LANG_NAMES: {[K: string]: string} = {} as const;



// prepare language files in locale directory
const localeImports: Record<string, () => Promise<DefaultLocaleMessageSchema>> = {};
const messageImports = import.meta.glob('./locales/*.json');
for(const path in messageImports) {
  const lang = ( path.match(/\/([a-z]{2}(?:-[a-z]+)?)\.json$/i) )?.[1];
  if( !lang )
    continue;
  
  LANG_ID_LIST.push(lang);
  localeImports[lang] = messageImports[path] as any;
}



const messages: Record<string, DefaultLocaleMessageSchema> = {
  //en: await localeImports.en(), // ERROR: Top-level await is not available in the configured target environment
  en,
};

export const I18n = createI18n({
  legacy: false,
  globalInjection: true,

  locale: 'en',
  fallbackLocale: 'en',
  
  messages,

  // suppress the warning "XSS: [intlify] Detected HTML in '...' message. Recommend not using HTML messages to avoid XSS."
  warnHtmlMessage: false,
  missingWarn: false,
  fallbackWarn: false,
});


export async function loadLocaleMessages(locale) {
  
  // load locale messages with dynamic import
  const message = await localeImports[locale]();

  // set locale and locale message
  I18n.global.setLocaleMessage(locale, message);

  return nextTick();
}
