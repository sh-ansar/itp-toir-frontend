import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './styles/tokens.css'
import './styles/global.css'
import './styles/app.css'
import './styles/toir-modules.css'

createApp(App).use(createPinia()).use(router).mount('#app')
