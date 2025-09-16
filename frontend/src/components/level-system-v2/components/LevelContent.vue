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
          <template v-if="field.id === 'bonusLevels'">
            <Button
              type="button"
              icon="pi pi-list"
              size="small"
              variant="outlined"
              severity="secondary"
              :label="getButtonLabel(slotProps.data)"
              :badge="getBadgeValue(slotProps.data)"
              :badge-severity="getBadgeSeverity(slotProps.data)"
              v-tooltip.top="formatAnswerLevels(slotProps.data)"
              @click="openLevelsModalForAnswer(slotProps.data)"
            />
          </template>
          <component 
            v-else-if="getFieldRenderer(field.id)"
            :is="getFieldRenderer(field.id)"
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

    <LevelsModal
      :model-value="isRowModalOpen"
      :current-level="store.levelId"
      :initial-selection="rowModalSelection"
      @update:model-value="isRowModalOpen = $event"
      @apply="applyRowLevels"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, type VNode } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

import { useLevelV2Store } from '../store'
import { useBonusLevelsStore } from '../store/bonusLevels'
import LevelsModal from '@/components/common/modals/LevelsModal.vue'
import { fieldDefinitions } from '../bases/fields/fieldDefinitions'
import { fieldRenderers, type FieldRenderer } from '../bases/fields/tableRenderers'
import { getLevelTypeConfig } from '../configs'
import type { FieldDefinition, Answer } from '../types'
import {
  buildInitialSelection,
  applyLevelsToAnswer,
  type LevelsSelection
} from '../composables/useBonusLevelsSelection'

const store = useLevelV2Store()
const bonusLevelsStore = useBonusLevelsStore()

const tableData = computed<Answer[]>(() => {
  return store.activeTab?.answers || []
})

const visibleFields = computed<FieldDefinition[]>(() => {
  const config = getLevelTypeConfig(store.levelType)
  
  if (config?.fields && config.fields.length > 0) {
    return fieldDefinitions.filter(field => 
      config.fields.includes(field.id)
    )
  }
  
  return fieldDefinitions.filter(field => 
    ['answer', 'sector', 'bonus'].includes(field.id)
  )
})

const showDeleteColumn = computed<boolean>(() => {
  const config = getLevelTypeConfig(store.levelType)
  return config?.manualCodeAddition === true
})

const getFieldRenderer = (fieldId: string): FieldRenderer | VNode | undefined => {
  return fieldRenderers[fieldId]
}

const getColumnWidth = (fieldId: string): string => {
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

const deleteRow = (index: number): void => {
  if (!store.activeTab) return
  const config = getLevelTypeConfig(store.levelType)
  if (config?.manualCodeAddition !== true) return
  store.activeTab.answers.splice(index, 1)
  store.markDirty()
}

const isRowModalOpen = ref(false)
const rowAnswerId = ref<string>('')
const rowModalSelection = reactive<LevelsSelection>({
  allLevels: true,
  targetLevels: []
})

const currentLevel = computed(() => String(store.levelId || '').trim())

const openLevelsModalForAnswer = (answer: Answer): void => {
  rowAnswerId.value = answer.id
  const selection = buildInitialSelection([answer], store.levelId)
  rowModalSelection.allLevels = selection.allLevels
  rowModalSelection.targetLevels = [...(selection.targetLevels || [])]
  isRowModalOpen.value = true
  void bonusLevelsStore.loadLevels({
    domain: store.domain,
    gameId: store.gameId,
    levelId: store.levelId
  }).catch(() => undefined)
}

const applyRowLevels = (selection: LevelsSelection): void => {
  const answers = store.activeTab?.answers
  if (!answers) {
    isRowModalOpen.value = false
    return
  }

  const target = answers.find(item => item.id === rowAnswerId.value)
  if (!target) {
    isRowModalOpen.value = false
    return
  }

  const hasChanges = applyLevelsToAnswer(selection, target)
  if (hasChanges) {
    store.markDirty()
  }

  isRowModalOpen.value = false
  rowAnswerId.value = ''
}

const getButtonLabel = (answer: Answer): string => {
  return Array.isArray(answer.bonusLevels) && answer.bonusLevels.length > 0
    ? 'Выбранные'
    : 'Все уровни'
}

const getBadgeValue = (answer: Answer): string | undefined => {
  if (!Array.isArray(answer.bonusLevels) || answer.bonusLevels.length === 0) {
    return undefined
  }
  return answer.bonusLevels.length.toString()
}

const getBadgeSeverity = (answer: Answer): string | undefined => {
  return Array.isArray(answer.bonusLevels) && answer.bonusLevels.length > 0
    ? 'contrast'
    : undefined
}

const formatAnswerLevels = (answer: Answer): string => {
  if (!Array.isArray(answer.bonusLevels) || answer.bonusLevels.length === 0) {
    return 'Все уровни'
  }

  // Показываем только реально выбранные пользователем уровни
  const unique = new Set<string>()
  answer.bonusLevels.forEach(level => {
    const normalized = String(level || '').trim()
    if (normalized) {
      unique.add(normalized)
    }
  })
  const values = Array.from(unique)
  if (values.length <= 5) {
    return `Уровни: ${values.join(', ')}`
  }
  return `Уровни: ${values.slice(0, 5).join(', ')} …`
}

watch(isRowModalOpen, (open) => {
  if (!open) {
    rowAnswerId.value = ''
  }
})
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

