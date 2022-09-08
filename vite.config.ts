import { ViteSSG } from 'vite-ssg'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/avif2jpeg/dist/',
  plugins: [vue()],
  server: {
    port: 8080,
  },
  ssgOptions: {
    dirStyle: 'nested',
    
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
