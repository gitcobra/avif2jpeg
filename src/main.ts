//import { createApp } from "vue";
import { RouterOptions, ViteSSG } from 'vite-ssg'
import { RouteRecordRaw } from 'vue-router'
import App from "./App.vue";
//import naive from "naive-ui";
import { I18n, LANG_ID_LIST, preloadAllLocaleMessages } from './i18n';


const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: App,
  }
];

// add path for each language
for(const lang of LANG_ID_LIST) {
  routes.push({
    path: '/' + lang + '/',
    strict: true,
    name: lang,
    component: App,
  });
}

export const createApp = ViteSSG(
  App,
  // vue-router options
  {
    routes,
    base: import.meta.env.BASE_URL,
  },
  // function to have custom setups
  async ({ app, router, routes, initialState }) => {
    // install plugins etc.
    if( import.meta.env.SSR )
      await preloadAllLocaleMessages();

    app.use(I18n);
    //app.use(naive);

  },
);
