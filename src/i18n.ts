import { createI18n as _createI18n } from 'vue-i18n'
/*
import en from './locales/en.json'
import ja from './locales/ja.json'
*/

export const LANG_LIST = [];
export const LANGUAGES_JSON = [];

// load language files
const messages = {};
const messageImports = import.meta.glob('./locales/*.json', { eager: true });
for(const path in messageImports) {
  const raw = messageImports[path];
  const lang = path.match(/([^/]+)\.json$/)[1];
  const json = raw; //JSON.parse(raw);
  
  messages[lang] = json;
  LANG_LIST.push(lang);
  LANGUAGES_JSON[lang] = json['lang'];
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

