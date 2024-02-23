//import { createApp } from "vue";
import { RouterOptions, ViteSSG } from 'vite-ssg'
import { RouteRecordRaw } from 'vue-router'
import App from "./App.vue";
import { createI18n, LANG_LIST } from './i18n'

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: App,
  }
];

// add path for each language
for(const lang of LANG_LIST) {
  routes.push({
    path: '/' + lang + '/',
    strict: true,
    name: lang,
    component: App,
  });
}



//createApp(App).use(router).mount("#app");
export const createApp = ViteSSG(
  App,
  // vue-router options
  {
    routes,
    base: '/avif2jpeg/dist/'
  },
  // function to have custom setups
  ({ app, router, routes, isClient, initialState }) => {
    // install plugins etc.
    const i18n = createI18n();
    app.use(i18n);
  }
);
