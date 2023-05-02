import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import ViteImages from 'vite-plugin-vue-images'
import VueMacros from 'unplugin-vue-macros/vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueMacros({
      plugins: {
        vue: vue(),
      },
    }),
    // vue({}),
    //  vueJsx(),
  Components({
dirs:['./src/components'],
dts:true
  }),
  ViteImages({
    dirs: ['./src/assets'],
    dts:true

  }),
  AutoImport({ 
    imports:[
     'vue',
     'pinia',
    ],
    include: [
      /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
      /\.vue$/, /\.vue\?vue/, // .vue
      /\.md$/, // .md
    ],
    dirs: [
      './stores',
    ],
   }),],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  }
})
