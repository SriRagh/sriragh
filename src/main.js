import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
console.log(import.meta.env, window, "env")
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
