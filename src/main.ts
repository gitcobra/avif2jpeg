//import { createApp } from "vue";
import { RouterOptions, ViteSSG } from 'vite-ssg'
import { RouteRecordRaw } from 'vue-router'
import App from "./App.vue";
import { createI18n } from './i18n'

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: App,
  },
  {
    path: "/ja",
    name: "Japanese",
    component: App,
    meta: {title: 'jpn',}
  },
  {
    path: "/en",
    name: "English",
    component: App,
    meta: {title: 'eng',}
  },
];

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
