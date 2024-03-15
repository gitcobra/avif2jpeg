import { createI18n as _createI18n } from 'vue-i18n'
/*
import en from './locales/en.json'
import ja from './locales/ja.json'
*/


// language id list
export const LANG_ID_LIST = [];
// language name list
export const LANG_NAMES = [];
// language json list
export const LANG_JSONS = [];

// load language files
const messages = {};
const messageImports = import.meta.glob('./locales/*.json', { eager: true });
for(const path in messageImports) {
  const raw = messageImports[path];
  const lang = path.match(/([^/]+)\.json$/)[1];
  const json = raw; //JSON.parse(raw);
  
  messages[lang] = json;
  LANG_ID_LIST.push(lang);
  LANG_NAMES[lang] = json['lang'];
  LANG_JSONS[lang] = json;
}




export function createI18n() {
  return _createI18n({
    legacy: false,
    globalInjection: true,

    locale: 'en',
    fallbackLocale: 'en',
    messages,
  });
}

