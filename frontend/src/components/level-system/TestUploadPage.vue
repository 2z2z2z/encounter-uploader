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
    <div class="bg-blue-50 border border-blue-200 p-4 mb-4 mx-4">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-blue-800">🔧 Отладочная информация</h3>
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
          <div>Status: <span class="text-green-600">Активен (level-system)</span></div>
          <div>Route: {{ debugInfo.currentPath }}</div>
          <div>Config Path: {{ debugInfo.testConfigPath }}</div>
          <div>Store ID: {{ debugInfo.storeId }}</div>
        </div>
        
        <!-- Store Info -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Level Store</h4>
          <div>Type ID: {{ debugInfo.store.typeId || 'Не задан' }}</div>
          <div>Subtype: {{ debugInfo.store.subtype || 'Нет' }}</div>
          <div>Tabs: {{ debugInfo.store.tabsCount }}</div>
          <div>Active Tab: {{ debugInfo.store.activeTabName || 'Нет' }}</div>
          <div>Answers in Active: {{ debugInfo.store.activeTabAnswersCount }}</div>
        </div>
        
        <!-- Environment -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Environment</h4>
          <div>Domain: {{ debugInfo.env.domain }}</div>
          <div>Game ID: {{ debugInfo.env.gameId }}</div>
          <div>Level ID: {{ debugInfo.env.levelId }}</div>
          <div>Source: Переменные окружения</div>
        </div>
        
        <!-- Test Data Source -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Test Data Source</h4>
          <div>Source: <span class="text-green-600">JSON файлы</span></div>
          <div>localStorage: <span class="text-red-600">НЕ используется</span></div>
          <div>Tabs Format: {{ debugInfo.dataFormat }}</div>
          <div>Loaded At: {{ debugInfo.loadedAt }}</div>
        </div>
      </div>
    </div>
    
    <!-- Основной компонент level-system -->
    <LevelUploadPage />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Button from 'primevue/button'
import { useTestConfig } from '@/composables/useTestConfig'
import { useAuthStore } from '@/store/auth'
import { useLevelStore } from './store'
import LevelUploadPage from './components/LevelUploadPage.vue'
import type { TabData, Answer } from './types'

const route = useRoute()
const { isLoading, error, loadTestConfig, getTestTypeInfo } = useTestConfig()
const authStore = useAuthStore()
const levelStore = useLevelStore()

// Отладочная информация
const showDebugInfo = ref(false)
const loadedAt = ref<string>('')

/**
 * Собираем отладочную информацию для диагностики
 */
const debugInfo = computed(() => {
  const levelType = route.params.levelType as string
  const typeInfo = getTestTypeInfo(levelType)
  
  return {
    currentPath: globalThis.location?.pathname || 'N/A',
    testConfigPath: typeInfo.testConfigPath,
    storeId: 'level',
    dataFormat: 'TabData[] format',
    loadedAt: loadedAt.value,
    store: {
      typeId: levelStore.levelType,
      subtype: levelStore.subtypeId,
      tabsCount: levelStore.tabs.length,
      activeTabName: levelStore.activeTab?.name,
      activeTabAnswersCount: levelStore.activeTab?.answers.length || 0
    },
    env: typeInfo.envVars
  }
})

/**
 * Инициализация тестовых данных
 * ВАЖНО: Работает только с JSON файлами и переменными окружения
 */
const initializeTestData = async (): Promise<void> => {
  const levelType = route.params.levelType as string
  
  try {
    // Загружаем тестовую конфигурацию (из JSON файлов)
    const testData = await loadTestConfig(levelType)
    if (!testData) return

    // Получаем credentials из переменных окружения (НЕ localStorage)
    const typeInfo = getTestTypeInfo(levelType)
    const { typeId, subtype, credentials } = typeInfo

    // Настраиваем AuthStore для работы с API
    authStore.setCredentials(credentials.login, credentials.password)
    authStore.loggedIn = true
    authStore.username = credentials.login

    // Инициализируем useLevelStore  
    levelStore.initializeLevelType(typeId as 'olymp' | 'type100500', subtype || undefined, false)
    
    // Загружаем данные напрямую в store (НЕ через localStorage)
    levelStore.domain = credentials.domain
    levelStore.gameId = credentials.gameId
    levelStore.levelId = credentials.levelId
    
    // Загружаем конфиг
    Object.assign(levelStore.config, testData.config)
    
    // Загружаем табы и ответы из JSON
    levelStore.tabs = testData.tabs.map((tab: TabData) => ({
      ...tab,
      // Гарантируем наличие всех полей
      answers: tab.answers.map((answer: Answer) => ({
        ...answer,
        // Добавляем отсутствующие поля со значениями по умолчанию
        bonusLevels: answer.bonusLevels || [],
        delay: answer.delay || { hours: 0, minutes: 0, seconds: 0 },
        limit: answer.limit || { hours: 0, minutes: 0, seconds: 0 },
        sectorName: answer.sectorName || '',
        bonusName: answer.bonusName || '',
        bonusTask: answer.bonusTask || '',
        hint: answer.hint || ''
      }))
    }))

    // Устанавливаем активный таб
    if (levelStore.tabs.length > 0) {
      levelStore.setActiveTab(0)
    }

    loadedAt.value = new Date().toLocaleTimeString()
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
    error.value = message
  }
}

onMounted(() => {
  initializeTestData()
})
</script>

<style scoped>
/* Стили специфичные для тестовой страницы */
.debug-info {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
}
</style>
