import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    "process.env": {
      // replace these with your environment variable names
      VITE_MY_VAR_1: JSON.stringify(process.env),
      VITE_MY_VAR_2: JSON.stringify(process.env.VITE_SRI_TEST ),
      // add more variables as needed
    },
  },
})
