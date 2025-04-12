//import { createApp } from "vue";
import { RouterOptions, ViteSSG } from 'vite-ssg'
import { RouteRecordRaw } from 'vue-router'
import App from "./App.vue";
//import naive from "naive-ui";
import { I18n, LANG_ID_LIST } from './i18n';


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

//console.log(import.meta.env)

export const createApp = ViteSSG(
  App,
  // vue-router options
  {
    routes,
    base: import.meta.env.BASE_URL,
  },
  // function to have custom setups
  ({ app, router, routes, isClient, initialState }) => {
    // install plugins etc.
    app.use(I18n);
    //app.use(naive);

  },
);
