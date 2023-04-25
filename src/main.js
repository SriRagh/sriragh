import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
console.log(import.meta.env, window, "env")
console.log(window.process)
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
