<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <i class="pi pi-spinner pi-spin text-4xl text-primary mb-4"></i>
      <p class="text-lg">Загрузка тестовой конфигурации...</p>
    </div>
  </div>
  
  <div v-else-if="error" class="min-h-screen flex items-center justify-center">
    <Card class="w-full max-w-lg">
      <template #title>Ошибка загрузки</template>
      <template #content>
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
        <div class="mt-4">
          <Button 
            label="Попробовать снова" 
            @click="initializeTestData"
            class="mr-2"
          />
          <Button 
            label="На главную" 
            severity="secondary" 
            @click="$router.push('/')"
          />
        </div>
      </template>
    </Card>
  </div>
  
  <div v-else>
    <!-- Отладочная панель -->
    <div class="bg-yellow-50 border border-yellow-200 p-4 mb-4 mx-4">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-yellow-800">🔧 Отладочная информация</h3>
        <Button 
          :label="showDebugInfo ? 'Скрыть' : 'Показать'"
          size="small"
          severity="secondary"
          @click="showDebugInfo = !showDebugInfo"
        />
      </div>
      
      <div v-if="showDebugInfo" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <!-- Test Mode Status -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Test Mode</h4>
          <div>Status: <span :class="debugInfo.testMode ? 'text-green-600' : 'text-red-600'">{{ debugInfo.testMode ? 'Активен' : 'Неактивен' }}</span></div>
          <div>Path: {{ debugInfo.currentPath }}</div>
          <div>User Agent: {{ debugInfo.userAgent.substring(0, 50) }}...</div>
        </div>
        
        <!-- LocalStorage Info -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">LocalStorage</h4>
          <div>Доступен: <span :class="debugInfo.localStorage.available ? 'text-green-600' : 'text-red-600'">{{ debugInfo.localStorage.available ? 'Да' : 'Нет' }}</span></div>
          <div>Ключи: {{ debugInfo.localStorage.keys.length }}</div>
          <div v-if="debugInfo.localStorage.keys.length > 0" class="mt-1">
            <details class="cursor-pointer">
              <summary>Список ключей ({{ debugInfo.localStorage.keys.length }})</summary>
              <div class="mt-1 ml-2 text-xs">
                <div v-for="key in debugInfo.localStorage.keys" :key="key">{{ key }}</div>
              </div>
            </details>
          </div>
        </div>
        
        <!-- Session Info -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Session</h4>
          <div>SessionStorage: <span :class="debugInfo.session.sessionStorage ? 'text-green-600' : 'text-red-600'">{{ debugInfo.session.sessionStorage ? 'Доступен' : 'Недоступен' }}</span></div>
          <div>Cookies: <span :class="debugInfo.session.cookiesEnabled ? 'text-green-600' : 'text-red-600'">{{ debugInfo.session.cookiesEnabled ? 'Разрешены' : 'Заблокированы' }}</span></div>
          <div>Document cookies: {{ debugInfo.session.documentCookies.length > 0 ? debugInfo.session.documentCookies.length + ' шт.' : 'Нет' }}</div>
        </div>
        
        <!-- Store State -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Store State</h4>
          <div>Auth logged in: <span :class="debugInfo.stores.auth.loggedIn ? 'text-green-600' : 'text-red-600'">{{ debugInfo.stores.auth.loggedIn ? 'Да' : 'Нет' }}</span></div>
          <div>Upload type: {{ debugInfo.stores.upload.uploadType }}</div>
          <div>Domain: {{ debugInfo.stores.upload.domain || 'Не задан' }}</div>
          <div>Game ID: {{ debugInfo.stores.upload.gameId || 'Не задан' }}</div>
        </div>
      </div>
    </div>
    
    <!-- Показываем обычный интерфейс загрузки -->
    <component :is="currentComponent" v-bind="currentProps" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Button from 'primevue/button'
import OlympBase from './types/OlympBase.vue'
import Type100500 from './types/Type100500/index.vue'
import { getTypeConfig } from './level-system/registry/types'
import { useUploadStore } from '../store'
import { useAuthStore } from '../store/auth'
import { useTestConfig } from '../composables/useTestConfig'
import { isTestUrlMode } from '../utils/testMode'

const route = useRoute()
const uploadStore = useUploadStore()
const authStore = useAuthStore()
const { isLoading, error, loadTestConfig, getTestCredentials } = useTestConfig()

// Отладочная информация
const showDebugInfo = ref(false)

/**
 * Собираем отладочную информацию для диагностики
 */
const debugInfo = computed(() => {
  // LocalStorage info
  const localStorageInfo = {
    available: false,
    keys: [] as string[]
  }
  
  try {
    if (typeof Storage !== 'undefined' && localStorage) {
      localStorageInfo.available = true
      localStorageInfo.keys = Object.keys(localStorage).sort()
    }
  } catch (_e) {
    // localStorage может быть недоступен в приватном режиме
  }
  
  // Session info
  const sessionInfo = {
    sessionStorage: false,
    cookiesEnabled: false,
    documentCookies: [] as string[]
  }
  
  try {
    sessionInfo.sessionStorage = typeof Storage !== 'undefined' && !!globalThis.sessionStorage
  } catch (_e) {
    // sessionStorage может быть недоступен
  }
  
  try {
    sessionInfo.cookiesEnabled = globalThis.navigator.cookieEnabled
    sessionInfo.documentCookies = document.cookie ? document.cookie.split(';').map(c => c.trim()) : []
  } catch (_e) {
    // cookies могут быть недоступны
  }
  
  return {
    testMode: isTestUrlMode(),
    currentPath: window.location.pathname,
    userAgent: globalThis.navigator.userAgent,
    localStorage: localStorageInfo,
    session: sessionInfo,
    stores: {
      auth: {
        loggedIn: authStore.loggedIn,
        username: authStore.username,
        isTestMode: authStore.isTestMode
      },
      upload: {
        uploadType: uploadStore.uploadType,
        domain: uploadStore.domain,
        gameId: uploadStore.gameId,
        levelId: uploadStore.levelId
      }
    }
  }
})

/**
 * Определяем какой компонент показывать в зависимости от типа уровня
 */
const currentComponent = computed(() => {
  switch (uploadStore.uploadType) {
    case 'olymp15':
    case 'olymp31':
    case 'olymp63':
    case 'olymp127':
      return OlympBase
    case '100500':
      return Type100500
    default:
      return OlympBase
  }
})

/**
 * Модифицированный заголовок для тестового режима
 */
const testModeTitle = computed(() => {
  const cfg = getTypeConfig(uploadStore.uploadType)
  const originalTitle = cfg?.name || 'Неизвестный тип'
  return `${originalTitle} - ТЕСТОВЫЕ ДАННЫЕ`
})

/**
 * Пропсы для компонента загрузки с модифицированным заголовком
 */
const currentProps = computed(() => {
  const cfg = getTypeConfig(uploadStore.uploadType)
  const baseProps: Record<string, any> = {}
  
  if (cfg && cfg.category === 'olymp' && typeof cfg.totalSectors === 'number') {
    baseProps.totalSectors = cfg.totalSectors
  }
  
  // Для OlympBase передаем модифицированный заголовок
  if (currentComponent.value === OlympBase) {
    baseProps.customTitle = testModeTitle.value
  }
  
  return baseProps
})

/**
 * Инициализация тестовых данных
 */
const initializeTestData = async () => {
  const levelType = route.params.levelType as string
  
  // Загружаем тестовую конфигурацию
  const testData = await loadTestConfig(levelType)
  if (!testData) return
  
  // Получаем credentials из .env
  const credentials = getTestCredentials()
  
  // Инициализируем AuthStore
  authStore.setCredentials(credentials.login, credentials.password)
  authStore.loggedIn = true // В тестовом режиме сразу авторизуемся
  
  // Дополнительно устанавливаем username для отображения в UI
  // (так как setCredentials может не обновить отображаемое имя)
  authStore.username = credentials.login
  
  // Инициализируем UploadStore с данными из .env и JSON
  // В тестовом URL режиме значения не сохраняются в localStorage
  uploadStore.domain = credentials.domain
  uploadStore.gameId = credentials.gameId  
  uploadStore.levelId = credentials.levelId
  uploadStore.uploadType = testData.uploadType
  
  // Устанавливаем данные уровня (не сохраняем в localStorage)
  Object.assign(uploadStore.config, testData.config)
  uploadStore.closedPattern = testData.closedPattern
  uploadStore.answers = testData.answers
}

onMounted(() => {
  initializeTestData()
})
</script>