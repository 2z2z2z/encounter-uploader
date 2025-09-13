<template>
  <div class="min-h-screen flex items-start justify-center bg-surface-50 p-4">
    <div class="w-full max-w-[1920px]">
      <Card>
        <template #content>
          <!-- Слот 1: LevelHeader - шапка с названием и мета-данными -->
          <LevelHeader v-if="typeId" :type-id="typeId" :subtype="subtype" />

          <!-- Слот 2: LevelTabs - блоки/табы (новый слот) -->  
          <LevelTabs />

          <!-- Слот 3: LevelControlPanel - контрол-панель -->
          <LevelControlPanel />

          <!-- Слот 4: LevelContent - таблица с данными -->
          <LevelContent />

          <!-- Слот 5: LevelFooter - подвал с кнопками -->
          <LevelFooter />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLevelV2Store } from '../store'
import { parseRouteParams } from '../configs'
import type { LevelTypeId } from '../types'

// PrimeVue components
import Card from 'primevue/card'

// Level system v2 components
import LevelHeader from './LevelHeader.vue'
import LevelTabs from './LevelTabs.vue'
import LevelControlPanel from './LevelControlPanel.vue'
import LevelContent from './LevelContent.vue'
import LevelFooter from './LevelFooter.vue'

const route = useRoute()
const levelV2Store = useLevelV2Store()

/**
 * Получаем параметр levelType из роута
 */
const levelType = computed(() => route.params.levelType as string)

/**
 * Универсальный парсинг levelType через реестр конфигов
 * Работает с любыми зарегистрированными типами и подтипами
 */
const parsedRoute = computed(() => {
  if (!levelType.value) {
    return { typeId: undefined }
  }
  return parseRouteParams(levelType.value)
})

const typeId = computed(() => parsedRoute.value.typeId)
const subtype = computed(() => parsedRoute.value.subtypeId)
const config = computed(() => parsedRoute.value.config)
const subtypeConfig = computed(() => parsedRoute.value.subtypeConfig)

/**
 * Инициализация store при монтировании компонента (универсальная логика)
 */
onMounted(() => {
  // Инициализируем store если удалось распарсить роут
  if (typeId.value && config.value) {
    // Инициализируем мета-данные для тестового режима
    if (!levelV2Store.domain) {
      levelV2Store.domain = 'test'
    }
    if (!levelV2Store.gameId) {
      levelV2Store.gameId = 'test'
    }
    if (!levelV2Store.levelId) {
      levelV2Store.levelId = '1'
    }
    
    levelV2Store.initializeLevelType(
      typeId.value as LevelTypeId,
      subtypeConfig.value || subtype.value,
      true // загружать из localStorage
    )
  } else {
    console.error(`[LevelUploadPage] Unknown route parameter: ${levelType.value}`)
  }
})
</script>


