<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <i class="pi pi-spinner pi-spin text-4xl text-primary mb-4"></i>
      <p class="text-lg">Загрузка тестовой конфигурации v2...</p>
    </div>
  </div>
  
  <div v-else-if="error" class="min-h-screen flex items-center justify-center">
    <Card class="w-full max-w-lg">
      <template #title>Ошибка загрузки v2</template>
      <template #content>
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
        <div class="mt-4">
          <Button 
            label="Попробовать снова" 
            @click="initializeTestDataV2"
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
    <!-- Отладочная панель v2 -->
    <div class="bg-blue-50 border border-blue-200 p-4 mb-4 mx-4">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-blue-800">🔧 Отладочная информация v2</h3>
        <Button 
          :label="showDebugInfo ? 'Скрыть' : 'Показать'"
          size="small"
          severity="secondary"
          @click="showDebugInfo = !showDebugInfo"
        />
      </div>
      
      <div v-if="showDebugInfo" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <!-- Test Mode Status v2 -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Test Mode v2</h4>
          <div>Status: <span class="text-green-600">Активен (level-system-v2)</span></div>
          <div>Route: {{ debugInfo.currentPath }}</div>
          <div>Config Path: {{ debugInfo.testConfigPath }}</div>
          <div>Store ID: {{ debugInfo.storeId }}</div>
        </div>
        
        <!-- v2 Store Info -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Level v2 Store</h4>
          <div>Type ID: {{ debugInfo.store.typeId || 'Не задан' }}</div>
          <div>Subtype: {{ debugInfo.store.subtype || 'Нет' }}</div>
          <div>Tabs: {{ debugInfo.store.tabsCount }}</div>
          <div>Active Tab: {{ debugInfo.store.activeTabName || 'Нет' }}</div>
          <div>Answers in Active: {{ debugInfo.store.activeTabAnswersCount }}</div>
        </div>
        
        <!-- Environment v2 -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Environment v2</h4>
          <div>Domain: {{ debugInfo.env.domain }}</div>
          <div>Game ID: {{ debugInfo.env.gameId }}</div>
          <div>Level ID: {{ debugInfo.env.levelId }}</div>
          <div>Source: Переменные окружения</div>
        </div>
        
        <!-- Test Data Source -->
        <div class="bg-white p-3 rounded border">
          <h4 class="font-semibold mb-2">Test Data Source</h4>
          <div>Source: <span class="text-green-600">JSON файлы v2</span></div>
          <div>localStorage: <span class="text-red-600">НЕ используется</span></div>
          <div>Tabs Format: {{ debugInfo.dataFormat }}</div>
          <div>Loaded At: {{ debugInfo.loadedAt }}</div>
        </div>
      </div>
    </div>
    
    <!-- Основной компонент level-system-v2 -->
    <LevelUploadPage />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Button from 'primevue/button'
import { useTestConfigV2 } from '@/composables/useTestConfigV2'
import { useLevelV2Store } from './store'
import LevelUploadPage from './components/LevelUploadPage.vue'

const route = useRoute()
const { isLoading, error, loadTestConfigV2, getTestTypeInfo } = useTestConfigV2()
const levelV2Store = useLevelV2Store()

// Отладочная информация
const showDebugInfo = ref(false)
const loadedAt = ref<string>('')

/**
 * Собираем отладочную информацию для диагностики v2
 */
const debugInfo = computed(() => {
  const levelType = route.params.levelType as string
  const typeInfo = getTestTypeInfo(levelType)
  
  return {
    currentPath: globalThis.location?.pathname || 'N/A',
    testConfigPath: typeInfo.testConfigPath,
    storeId: 'level-v2',
    dataFormat: 'TabData[] (v2 format)',
    loadedAt: loadedAt.value,
    store: {
      typeId: levelV2Store.levelType,
      subtype: levelV2Store.subtypeId,
      tabsCount: levelV2Store.tabs.length,
      activeTabName: levelV2Store.activeTab?.name,
      activeTabAnswersCount: levelV2Store.activeTab?.answers.length || 0
    },
    env: typeInfo.envVars
  }
})

/**
 * Инициализация тестовых данных v2
 * ВАЖНО: Работает только с JSON файлами и переменными окружения
 */
const initializeTestDataV2 = async (): Promise<void> => {
  const levelType = route.params.levelType as string
  
  try {
    // Загружаем тестовую конфигурацию v2 (из JSON файлов)
    const testData = await loadTestConfigV2(levelType)
    if (!testData) return

    // Получаем credentials из переменных окружения (НЕ localStorage)
    const typeInfo = getTestTypeInfo(levelType)
    const { typeId, subtype, credentials } = typeInfo

    // Инициализируем useLevelV2Store  
    levelV2Store.initializeLevelType(typeId as 'olymp' | 'type100500', subtype || undefined, false)
    
    // Загружаем данные напрямую в store (НЕ через localStorage)
    levelV2Store.domain = credentials.domain
    levelV2Store.gameId = credentials.gameId
    levelV2Store.levelId = credentials.levelId
    
    // Загружаем конфиг
    Object.assign(levelV2Store.config, testData.config)
    
    // Загружаем табы и ответы из JSON
    levelV2Store.tabs = testData.tabs.map((tab: any) => ({
      ...tab,
      // Гарантируем наличие всех полей
      answers: tab.answers.map((answer: any) => ({
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
    if (levelV2Store.tabs.length > 0) {
      levelV2Store.setActiveTab(0)
    }

    loadedAt.value = new Date().toLocaleTimeString()
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка v2'
    error.value = message
  }
}

onMounted(() => {
  initializeTestDataV2()
})
</script>

<style scoped>
/* Стили специфичные для тестовой страницы v2 */
.debug-info-v2 {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
}
</style>