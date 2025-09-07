import { readFileSync, globSync } from 'fs';
import { ViteSSG } from 'vite-ssg';
import { defineConfig, loadEnv, PluginOption } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import generateSitemap from 'vite-ssg-sitemap'
import { htmlInjectionPlugin } from "vite-plugin-html-injection";
import { fileURLToPath, URL } from "url";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import beautify from 'js-beautify';
import Ver from './src/version.json';
import { VitePWA } from 'vite-plugin-pwa';
import strip from '@rollup/plugin-strip';

//import vueDevTools from 'vite-plugin-vue-devtools';


console.log('==== run vite.config.ts ====');
console.log("VER", Ver);


export default defineConfig(({mode}) => {
  // load environment variables
  const env = loadEnv(mode, process.cwd() + '/env');
  const SSG = !!env.VITE_SSG;
  console.log('mode:', mode);
  console.log('env:', env);
  console.log('SSG', SSG);

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
  

  const PWA_TEST = env.VITE_PWA_TEST;
  const precacheGlob = [
    'index.html',
    'unsupported.js',
    '**/*.css',
    '**/app-*.js',
    '**/vendor-*.js',
    '**/workbox-*.js',
    '**/worker*.js',
    'pwa-64x64.png'
  ];

  // create cache target list for PWA App installation
  const plugin_cacheListForPWA: PluginOption = {
    name: 'cacheListForPWA',
    config() {
      const files = globSync(
        [
          '**/*.{js,ttf,woff2,png}'
        ],
        {
          cwd: './dist',
          exclude: precacheGlob.concat([
            'sw.js'
          ])
        }
      ).map(path => basePath + path.replace(/\\/g, '/'));
      //console.log(files);

      return {
        define: {
          'import.meta.env.__DIST_FILES__': JSON.stringify(files),
        },
      };
    },
  };

  const vitePWAPlugin = VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: 'prompt',
    
    injectManifest: {
      globPatterns: precacheGlob,
      minify: !PWA_TEST,
      enableWorkboxModulesLogs: PWA_TEST ? true : undefined,
    },
    
    //pwaAssets,
    manifest: {
      name: 'AVIF2JPEG',
      short_name: 'Avif2Jpeg',
      description: 'Convert AVIF to JPEG',
      start_url: basePath,
      display: 'standalone',
      
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
    },

    devOptions: {
      enabled: true,
      //suppressWarnings: true,
      type: 'module',
    },
  });
  
  return ({
    base: basePath,
    build: {
      outDir,
      rollupOptions: {
        plugins: [
          strip(process.env.NODE_ENV !== 'development' && !PWA_TEST && mode !== 'test' ? {
            include: ['**/*.js'],
            functions: ['console.*'],
          } : {}),
        ]
      }
    },
    envDir: './env',
    define: {
      'import.meta.env.__APP_VERSION__': JSON.stringify(Ver),
    },
    plugins: [
      vue(),
          
      vitePWAPlugin,
      
      AutoImport({
        // targets to transform
        include: [
          /\.vue$/,
          /\.vue\?vue/, // .vue
          /\.ts$/,
        ],
        imports: [
          'vue',
          'vue-router',
          {
            'naive-ui': [
              'useDialog',
              'useModal',
              'useMessage',
              //'useNotification',
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

      plugin_cacheListForPWA,

      //vueDevTools(),
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
    },


    // options for vite-ssg
    ssgOptions: {
      dirStyle: 'nested',
      
      /*
      onBeforePageRender(root: string, html: string, c) {
        if( !disabledPWA ) {
          Object.defineProperty(vitePWAPlugin[0].api, 'disabled', {
            value: true,
          });
          disabledPWA = true;
        }
        return html;
      },
      */

      // beautify HTML
      // NOTE: the reason to use it is that the option {formatting:'prettify'} in ssgOptions output terrible html
      onPageRendered(route: string, html: string) {
        html = beautify.html(html);
        html = html.replace(/<!--.*?-->|\s(style|data-v-[^=]+|role)="[^"]*?"|<svg\s[\s\S]+?<\/svg>|\sclass="(?![^"]*avif2jpeg hide)[^"]+"/g, '');
        return Promise.resolve(html);
      },
      
      onFinished() {
        // create sitemap.xml
        console.log('generate sitemap');
        generateSitemap({
          hostname: 'https://gitcobra.github.io/avif2jpeg/dist/',
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
  });
});
