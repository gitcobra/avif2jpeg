//import { createApp } from "vue";
import { RouterOptions, ViteSSG } from 'vite-ssg'
import App from "./App.vue";

const routes: any[] = [
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

export const createApp = ViteSSG(
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  ({ app, router, routes, isClient, initialState }) => {
    // install plugins etc.
  }
);
//createApp(App).use(router).mount("#app");
