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



/*
// move the app script tag to the end of the body tag to make unsupported.js work
const appScriptToEndOfBody = () => {
  return {
    name: 'no-attribute',
    transformIndexHtml(html) {
      const scriptTag = (/<script [^>]*type="module" crossorigin[^>]*src="[^>]*assets\/app.+?<\/script>/.exec(html) || [''])[0];
      html = html.replace(scriptTag, '');
      html = html.replace(/(?=<\/body>)/, scriptTag);
      
      //console.log(`\nappScriptToEndOfBody: ${scriptTag}`)
      return html;
    }
  };
};
*/


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
    //appScriptToEndOfBody(),
    
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
      { find: '@assets', replacement: fileURLToPath(new URL('./src/shared/assets', import.meta.url)) },
      { find: '@cmp', replacement: fileURLToPath(new URL('./src/shared/cmp', import.meta.url)) },
      { find: '@stores', replacement: fileURLToPath(new URL('./src/shared/stores', import.meta.url)) },
      { find: '@use', replacement: fileURLToPath(new URL('./src/shared/use', import.meta.url)) },
    ]
  },

  ssgOptions: {
    dirStyle: 'nested',
    onFinished() {
      
      // create sitemap.xml
      generateSitemap({
        hostname: 'https://gitcobra.github.io',
        basePath: basePath,
        readable: true,
      });
    },
    
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

  /*
  // build error issue
  // TypeError: createApp is not a function · Issue #112 · antfu/vite-ssg · GitHub
  // https://github.com/antfu/vite-ssg/issues/112
  build: {
    //minify: false,
    rollupOptions: {
      //...(process.env.VITE_SSG ? { treeshake: false } : {}),
      output: {
        ...(process.env.VITE_SSG
          ? {
              footer:
                "if (typeof createApp !== 'undefined') module.exports = { createApp }",
            }
          : {}),
      },
    },
  },
  */

  // remove console.log
  esbuild: process.env.NODE_ENV !== 'development' ? {
    drop: ['console', 'debugger'],
  } : {},
});
