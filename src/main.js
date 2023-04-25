import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
console.log(import.meta.env, process.env, "env")
import './assets/main.css'
const myVar1 = import.meta.env.VITE_MY_VAR_1;
const myVar2 = import.meta.env.VITE_MY_VAR_2;
console.log("var", myVar1, myVar2);
const app = createApp(App)

app.use(createPinia())

app.mount('#app')
