import { readFileSync } from 'fs';
import { ViteSSG } from 'vite-ssg'
import { defineConfig, loadEnv } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import generateSitemap from 'vite-ssg-sitemap'
import { htmlInjectionPlugin } from "vite-plugin-html-injection";
import { fileURLToPath, URL } from "url";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import beautify from 'js-beautify';



export default defineConfig(({mode}) => {
  // load environment variables
  const env = loadEnv(mode, process.cwd() + '/env');
  console.log('mode:', mode);
  console.log('env:', env);

  let basePath = env.VITE_BASE_PATH;
  let outDir = env.VITE_OUTDIR;
  
  // create version directory
  if( env.VITE_OUTPUT_VERDIR ) {
    // read current version
    const path = './src/version.json';
    const jsontxt = readFileSync(path, 'utf-8');
    const Ver = JSON.parse(jsontxt);
    const vpath = `${Ver.major}.${Ver.minor}.${Ver.build}`;
    basePath += vpath + '/';
    outDir += `/` + vpath;
  }

  console.log(`basePath`, basePath);
  console.log('outDir', outDir);
  
  return ({
    base: basePath,
    build: {
      outDir,
    },
    envDir: './env',
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
          ...env.VITE_INJECT_GA ? [{
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
      
      // beautify HTML
      // NOTE: the reason to use it is that the option {formatting:'prettify'} in ssgOptions output terrible html
      onPageRendered(route: string, html: string) {
        html = beautify.html(html);
        html = html.replace(/<!--.*?-->|\s(style|data-v-[^=]+|role)="[^"]*?"|<svg\s[\s\S]+?<\/svg>/g, '');
        return Promise.resolve(html);
      },

      onFinished() {
        // create sitemap.xml
        generateSitemap({
          hostname: 'https://gitcobra.github.io',
          basePath: basePath.replace(/\/$/, ''),
          readable: true,
          outDir: outDir,
        });
      },
      
      formatting: 'none',

      // without this, each static language htmls would be applied the same language,
      // because of asynchronous import of lang files probably.
      concurrency: 1,
      
      // build error issue
      // The requested module 'naive-ui' is a CommonJS module, which may not support all module.exports as named exports.
      // https://github.com/antfu/vite-ssg/issues/150#issuecomment-1114006208
      mock: true,
      //format: 'cjs',
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
    esbuild: process.env.NODE_ENV !== 'development' && mode !== 'test' ? { drop: ['console', 'debugger'] } : {},


    // Build error when using vite-ssg/使用vite-ssg进行构建时出错 #4225 
    // https://github.com/tusen-ai/naive-ui/issues/4225#issuecomment-2072791151
    ssr: {
      // Add these three values ​​to the original configuration.
      noExternal: ['naive-ui', 'date-fns', 'vueuc'],
    }
  });
});
