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
    <!-- Показываем обычный интерфейс загрузки -->
    <component :is="currentComponent" v-bind="currentProps" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
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

const route = useRoute()
const uploadStore = useUploadStore()
const authStore = useAuthStore()
const { isLoading, error, loadTestConfig, getTestCredentials } = useTestConfig()

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