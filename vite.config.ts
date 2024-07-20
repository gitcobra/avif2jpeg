import { ViteSSG } from 'vite-ssg'
import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import generateSitemap from 'vite-ssg-sitemap'
import {replaceInFile} from 'replace-in-file'


const basePath = '/avif2jpeg/dist';

export default defineConfig({
  base: basePath,
  plugins: [
    vue(),
    splitVendorChunkPlugin(),
    
  ],
  server: {
    port: 8080,
    host: true,
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
      // append a slash each url in sitemap.xml
      replaceInFile({
        files: './dist/sitemap.xml',
        from: /(<loc>\s+http[^\s]+)(?=\s)(?<!\/)/g,
        to: '$1/',
      });
    },
    
    // build error issue
    // The requested module 'naive-ui' is a CommonJS module, which may not support all module.exports as named exports.
    // https://github.com/antfu/vite-ssg/issues/150#issuecomment-1114006208
    mock: true,
    format: 'cjs',
  },

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
});
