<template>
  <div class="level-upload-page min-h-screen bg-surface-0 p-6">
    <!-- Шаг 4: Базовая информация для тестирования роутинга -->
    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
      <h1 class="text-2xl font-bold text-blue-800 mb-2">
        🚀 Новая архитектура level-system-v2
      </h1>
      <div class="text-blue-700">
        <p><strong>Тип уровня:</strong> {{ typeId }}</p>
        <p v-if="subtype"><strong>Подтип:</strong> {{ subtype }} секторов</p>
        <p><strong>URL параметр:</strong> {{ levelType }}</p>
        <p><strong>Store ID:</strong> {{ storeId }}</p>
      </div>
    </div>

    <!-- TODO Шаг 5: LevelHeader - шапка с названием и мета-данными -->
    <div class="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300 mb-4">
      <p class="text-gray-600">📋 LevelHeader (Шаг 6)</p>
    </div>

    <!-- TODO Шаг 7: LevelTabs - блоки/табы -->
    <div class="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300 mb-4">
      <p class="text-gray-600">📑 LevelTabs (Шаг 7)</p>
    </div>

    <!-- TODO Шаг 18: LevelControlPanel - контрол-панель -->
    <div class="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300 mb-4">
      <p class="text-gray-600">🎛️ LevelControlPanel (Шаг 18)</p>
    </div>

    <!-- TODO Шаг 13: LevelContent - таблица с данными -->
    <div class="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300 mb-4">
      <p class="text-gray-600">📊 LevelContent (Шаг 13)</p>
    </div>

    <!-- TODO Шаг 22: LevelFooter - подвал с кнопками -->
    <div class="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300">
      <p class="text-gray-600">🔘 LevelFooter (Шаг 22)</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLevelV2Store } from '../store'

const route = useRoute()
const levelV2Store = useLevelV2Store()

/**
 * Получаем параметр levelType из роута
 */
const levelType = computed(() => route.params.levelType as string)

/**
 * Парсинг levelType на typeId и subtype
 * olymp15 -> typeId: 'olymp', subtype: '15'
 * type100500 -> typeId: 'type100500', subtype: undefined
 */
const typeId = computed(() => {
  if (levelType.value?.startsWith('olymp')) {
    return 'olymp'
  }
  if (levelType.value === 'type100500') {
    return 'type100500'
  }
  return levelType.value
})

const subtype = computed(() => {
  if (levelType.value?.startsWith('olymp')) {
    return levelType.value.replace('olymp', '')
  }
  return undefined
})

/**
 * ID store для демонстрации изоляции
 */
const storeId = computed(() => levelV2Store.$id)
</script>


