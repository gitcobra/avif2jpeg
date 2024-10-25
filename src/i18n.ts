
import { createI18n } from 'vue-i18n';

// language id list
export const LANG_ID_LIST: string[] = [] as const;
// language name list
export const LANG_NAMES: {[K: string]: string} = {} as const;
// language json list
export const LANG_JSONS: {[K: string]: object} = {} as const;

// load language files
const messages: {[K: string]: any} = {};
const messageImports = import.meta.glob<any>('./locales/*.json', { eager: true });
for(const path in messageImports) {
  const raw = messageImports[path];
  const lang = (path.match(/([^/]+)\.json$/) || [])[1];
  if( typeof lang !== 'string' )
    throw new Error();

  const json = raw; //JSON.parse(raw);
  
  messages[lang] = json;
  LANG_ID_LIST.push(lang);
  LANG_NAMES[lang] = json['lang'];
  LANG_JSONS[lang] = json;
}

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
