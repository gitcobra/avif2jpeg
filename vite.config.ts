import { ViteSSG } from 'vite-ssg'
import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import generateSitemap from 'vite-ssg-sitemap'
import { replaceInFile } from 'replace-in-file'
import { htmlInjectionPlugin } from "vite-plugin-html-injection";
import { fileURLToPath, URL } from "url";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'




const basePath = '/avif2jpeg/dist/';
export default defineConfig({
  base: basePath,
  plugins: [
    vue(),
    AutoImport({
      // targets to transform
      include: [
        /\.vue$/,
        /\.vue\?vue/, // .vue
      ],
      imports: [
        'vue',
        'vue-router',
        {
          'naive-ui': [
            'useDialog',
            'useModal',
            'useMessage',
            'useNotification',
            'useLoadingBar'
          ]
        },
        {
          'vue-i18n': [
            'useI18n',
          ]
        }
      ],
      eslintrc: {
        enabled: true,
      },
      dts: true, // or a custom path
    }),
    Components({
      resolvers: [NaiveUiResolver()]
    }),

    splitVendorChunkPlugin(),
    
    htmlInjectionPlugin({
      injections: [
        ...process.env.INJECT_GA ? [{
          name: "Google analytics",
          path: "./ga.html",
          type: "raw",
          injectTo: "head",
          buildModes: "prod",
        }] : [] as any
      ],
    }),
  ],
  server: {
    port: 8080,
    host: true,
  },
  
  //javascript - `Vue3 - Vite` project alias src to @ not working - Stack Overflow
  //https://stackoverflow.com/questions/66043612/vue3-vite-project-alias-src-to-not-working#comment133501676_67676242
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ]
  },

  ssgOptions: {
    dirStyle: 'nested',
    onFinished() {
      // create sitemap.xml
      generateSitemap({
        hostname: 'https://gitcobra.github.io',
        basePath: '/avif2jpeg/dist',
        readable: true,
      });
    },

    // without this, each static language htmls would be applied the same language,
    // because of asynchronous import of lang files probably.
    concurrency: 1,
    
    // build error issue
    // The requested module 'naive-ui' is a CommonJS module, which may not support all module.exports as named exports.
    // https://github.com/antfu/vite-ssg/issues/150#issuecomment-1114006208
    mock: true,
    format: 'cjs',
  },

  //Deprecation Warning: The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.
  //More info: https://sass-lang.com/d/legacy-js-api
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },

  // remove console.log
  //esbuild: process.env.NODE_ENV !== 'development' ? { drop: ['console', 'debugger'] } : {},
});
