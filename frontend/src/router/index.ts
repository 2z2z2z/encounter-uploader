import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import SettingsForm from '../components/SettingsForm.vue'
import UploadForm from '../components/UploadForm.vue'

// Динамическая загрузка типов уровней (из плана рефакторинга Фаза 5.1)
import { loadTypeComponent, preloadComponents } from './dynamic-loader'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginForm },
  { path: '/settings', component: SettingsForm },
  { path: '/upload', component: UploadForm },
  
  // Динамический маршрут для типов уровней (из плана)
  {
    path: '/upload/:type',
    name: 'upload-type',
    component: () => import('../components/shared/DynamicTypeLoader.vue'),
    props: true,
    meta: {
      title: 'Загрузка уровня',
      requiresAuth: true
    }
  },
  
  // Тестовые маршруты с динамической загрузкой
  { path: '/isolated-test', component: () => import('../components/IsolatedTypeTest.vue') },
  { path: '/test-editor', component: () => loadTypeComponent('test-editor') || (() => import('../components/shared/ErrorComponent.vue')) },
  { path: '/test-olymp', component: () => loadTypeComponent('test-olymp') || (() => import('../components/shared/ErrorComponent.vue')) },
  { path: '/test-type100500', component: () => loadTypeComponent('test-type100500') || (() => import('../components/shared/ErrorComponent.vue')) },
  { path: '/test-configurable', component: () => loadTypeComponent('test-configurable') || (() => import('../components/shared/ErrorComponent.vue')) },
  { path: '/test-api', component: () => loadTypeComponent('test-api') || (() => import('../components/shared/ErrorComponent.vue')) },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Предзагрузка критически важных компонентов (из плана)
router.beforeEach(async (to, from, next) => {
  // Предзагружаем основные типы при первом переходе
  if (!from.name) {
    preloadComponents(['olymp_15', 'olymp_31', 'olymp_63', 'olymp_127', 'type_100500'])
      .catch(error => console.warn('⚠️ Ошибка предзагрузки:', error))
  }
  
  next()
})

export default router
