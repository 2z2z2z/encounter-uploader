import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import SettingsForm from '../components/SettingsForm.vue'
import UploadForm from '../components/UploadForm.vue'
import TestUploadPage from '../components/TestUploadPage.vue'
import LevelUploadPage from '../components/level-system-v2/components/LevelUploadPage.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginForm },
  { path: '/settings', component: SettingsForm },
  { path: '/upload', component: UploadForm },
  // Существующие роуты для старой архитектуры
  { path: '/test/:levelType', component: TestUploadPage },
  // Новые роуты для level-system-v2 (Шаг 4)
  { path: '/v2/test/:levelType', component: LevelUploadPage },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
