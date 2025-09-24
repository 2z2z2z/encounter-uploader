import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import SettingsForm from '../components/SettingsForm.vue'
import LevelUploadPage from '../components/level-system/components/LevelUploadPage.vue'
import TestUploadPage from '../components/level-system/TestUploadPage.vue'
import { useLevelStore } from '../components/level-system/store'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginForm },
  { path: '/settings', name: 'settings', component: SettingsForm },
  {
    path: '/upload',
    redirect: () => {
      try {
        const levelStore = useLevelStore()
        const typeId = levelStore.levelType || 'olymp'
        const subtype = levelStore.subtypeId || (typeId === 'olymp' ? '15' : undefined)
        return subtype ? `/${typeId}/${subtype}` : `/${typeId}`
      } catch (error) {
        console.warn('[router] Fallback redirect from /upload:', error)
        return '/settings'
      }
    },
  },
  {
    path: '/:levelType/:subtype?',
    name: 'level-upload',
    component: LevelUploadPage,
  },
  {
    path: '/test/:levelType',
    name: 'level-upload-test',
    component: TestUploadPage,
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
