import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import SettingsForm from '../components/SettingsForm.vue'
import UploadForm from '../components/UploadForm.vue'
import TestUploadPage from '../components/TestUploadPage.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginForm },
  { path: '/settings', component: SettingsForm },
  { path: '/upload', component: UploadForm },
  { path: '/test/:levelType', component: TestUploadPage },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
