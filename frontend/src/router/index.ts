import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import SettingsForm from '../components/SettingsForm.vue'
import LevelUploadPage from '../components/level-system-v2/components/LevelUploadPage.vue'
import TestUploadPageV2 from '../components/level-system-v2/TestUploadPageV2.vue'
import { useLevelV2Store } from '../components/level-system-v2/store'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginForm },
  { path: '/settings', name: 'settings', component: SettingsForm },
  {
    path: '/upload',
    redirect: () => {
      try {
        const levelStore = useLevelV2Store()
        const typeId = levelStore.levelType || 'olymp'
        const subtype = levelStore.subtypeId || (typeId === 'olymp' ? '15' : undefined)
        return subtype ? `/v2/${typeId}/${subtype}` : `/v2/${typeId}`
      } catch (error) {
        console.warn('[router] Fallback redirect from /upload:', error)
        return '/settings'
      }
    },
  },
  {
    path: '/test/:levelType',
    redirect: ({ params }: { params: Record<string, unknown> }) => {
      const value = params.levelType
      const levelType = Array.isArray(value) ? value[0] : value
      const safeValue = levelType ? String(levelType) : 'olymp15'
      return `/v2/test/${safeValue}`
    },
  },
  {
    path: '/v2/:levelType/:subtype?',
    name: 'level-upload',
    component: LevelUploadPage,
  },
  {
    path: '/v2/test/:levelType',
    name: 'level-upload-test',
    component: TestUploadPageV2,
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
