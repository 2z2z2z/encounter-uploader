import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import SettingsForm from '../components/SettingsForm.vue'
import UploadForm from '../components/UploadForm.vue'
import TestUploadPage from '../components/TestUploadPage.vue'
import TestUploadPageV2 from '../components/level-system-v2/TestUploadPageV2.vue'
import LevelUploadPage from '../components/level-system-v2/components/LevelUploadPage.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginForm },
  { path: '/settings', component: SettingsForm },
  { path: '/upload', component: UploadForm },
  // Существующие роуты для старой архитектуры
  { path: '/test/:levelType', component: TestUploadPage },
  // Новые роуты для level-system-v2 (чистые, без тестовых данных)
  { path: '/v2/:typeId/:subtype?', component: LevelUploadPage },
  // Роуты level-system-v2 с тестовыми данными
  { path: '/v2/test/:levelType', component: TestUploadPageV2 },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
