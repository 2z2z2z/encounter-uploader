<template>
  <div class="level-content">
    <DataTable 
      :value="tableData"
      responsive-layout="scroll"
      :selection-mode="undefined"
      :reorderable-columns="false"
      class="p-datatable-sm"
      style-class="p-datatable-striped"
      scrollable
      scroll-height="600px"
    >
      <!-- Техническая колонка: Номер строки -->
      <Column header="#" frozen :style="{ width: '60px' }">
        <template #body="slotProps">
          <span class="text-sm text-gray-500">{{ slotProps.index + 1 }}</span>
        </template>
      </Column>

      <!-- Динамические колонки на основе полей -->
      <Column 
        v-for="field in visibleFields" 
        :key="field.id"
        :header="field.columnLabel"
        :style="{ minWidth: getColumnWidth(field.id) }"
      >
        <template #body="slotProps">
          <component 
            :is="getFieldRenderer(field.id)"
            v-if="getFieldRenderer(field.id)"
            :data="slotProps.data"
            :index="slotProps.index"
          />
          <span v-else class="text-gray-400 text-sm">
            Нет рендера для {{ field.id }}
          </span>
        </template>
      </Column>

      <!-- Техническая колонка: Удаление строки (только если ручное добавление) -->
      <Column 
        v-if="showDeleteColumn"
        header=""
        frozen
        align-frozen="right"
        :style="{ width: '50px' }"
      >
        <template #body="slotProps">
          <Button
            @click="deleteRow(slotProps.index)"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            variant="text"
            :title="`Удалить строку ${slotProps.index + 1}`"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Информация о состоянии -->
    <div v-if="tableData.length === 0" class="text-center text-gray-500 py-8">
      <p>Нет данных для отображения</p>
      <p class="text-sm mt-2">
        Данные будут отображены после настройки типа уровня
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type VNode } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

import { useLevelV2Store } from '../store'
import { fieldDefinitions } from '../bases/fields/fieldDefinitions'
import { fieldRenderers, type FieldRenderer } from '../bases/fields/tableRenderers'
import { getLevelTypeConfig } from '../configs'
import type { FieldDefinition, Answer } from '../types'

/**
 * Компонент таблицы контента для отображения данных уровня
 * 
 * Особенности:
 * - Динамические колонки на основе конфига типа уровня
 * - Техническая колонка номера строки (всегда первая)
 * - Техническая колонка удаления (только при ручном добавлении)
 * - Отключены выбор строк и reordering
 * - Данные только из активного таба
 */

// ===== Store =====
const store = useLevelV2Store()

// ===== Вычисляемые свойства =====

/**
 * Данные активного таба для таблицы
 */
const tableData = computed<Answer[]>(() => {
  return store.activeTab?.answers || []
})

/**
 * Видимые поля на основе конфига типа уровня
 */
const visibleFields = computed<FieldDefinition[]>(() => {
  const config = getLevelTypeConfig(store.levelType)
  
  if (config?.fields && config.fields.length > 0) {
    return fieldDefinitions.filter(field => 
      config.fields.includes(field.id)
    )
  }
  
  // Fallback: если конфиг не найден, показываем базовые поля
  return fieldDefinitions.filter(field => 
    ['answer', 'sector', 'bonus'].includes(field.id)
  )
})

/**
 * Показывать ли колонку удаления строки
 * На основе флага ручного добавления кодов
 */
const showDeleteColumn = computed<boolean>(() => {
  const config = getLevelTypeConfig(store.levelType)
  return config?.manualCodeAddition === true
})

// ===== Методы =====

/**
 * Получить функцию рендеринга для поля
 */
const getFieldRenderer = (fieldId: string): FieldRenderer | VNode | undefined => {
  return fieldRenderers[fieldId]
}

/**
 * Получить ширину колонки для поля
 */
const getColumnWidth = (fieldId: string): string => {
  // Разные ширины для разных типов полей
  switch (fieldId) {
    case 'answer': return '250px'
    case 'sector':
    case 'bonus': return '80px'
    case 'bonusTime':
    case 'delay':
    case 'limit': return '200px'
    case 'bonusLevels': return '180px'
    case 'bonusTask':
    case 'hint': return '300px'
    default: return '150px'
  }
}

/**
 * Удаление строки (только для типов с ручным добавлением)
 */
const deleteRow = (index: number): void => {
  if (!store.activeTab) return
  
  // Проверяем что действительно разрешено удаление
  const config = getLevelTypeConfig(store.levelType)
  if (config?.manualCodeAddition !== true) return
  
  // Удаляем строку из активного таба
  store.activeTab.answers.splice(index, 1)
  // store.markDirty() - будет добавлено после реализации метода в store
}
</script>

<style scoped>
/**
 * Стили для таблицы контента
 * Используем минимальные стили без @apply для совместимости с TW v4
 */
.level-content {
  width: 100%;
}
</style>