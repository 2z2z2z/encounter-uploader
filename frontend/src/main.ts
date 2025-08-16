import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './index.css'

// Инициализируем новую систему хранения данных
import { useUniversalStore } from './store/universal'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)

// Инициализируем Universal Store для миграции данных
const universalStore = useUniversalStore()
console.log('🔄 Universal Store инициализирован для миграции данных')

app.mount('#app')
