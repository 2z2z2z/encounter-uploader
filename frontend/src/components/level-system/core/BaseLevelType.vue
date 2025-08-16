<!--
  BaseLevelType - базовый компонент для всех типов уровней
  Реализация согласно плану рефакторинга (Фаза 1.3)
-->

<template>
  <div class="min-h-screen bg-blue-50 py-8">
    <div class="container mx-auto bg-white p-12 rounded-md shadow-sm">
      <!-- Унифицированный заголовок (из плана) -->
      <LevelHeader 
        :type="levelType.label"
        :author="authStore.username"
        :domain="uploadStore.domain || authStore.domain || ''"
        :game-id="uploadStore.gameId || ''"
        :level-id="uploadStore.levelId || ''"
      />
      
      <!-- Ошибки (из плана) -->
      <ErrorDisplay v-if="error" :error="error" />
      
      <!-- Динамические контролы на основе capabilities (из плана) -->
      <LevelControls 
        :capabilities="levelType.capabilities"
        :config="config"
        @update:config="updateConfig"
      />
      
      <!-- Основная таблица/интерфейс (из плана) -->
      <component 
        :is="levelType.tableComponent || 'DefaultTable'"
        :data="data"
        :config="config"
        :level-type="levelType"
        @update:data="updateData"
      />
      
      <!-- Унифицированные кнопки действий (из плана) -->
      <ActionButtons 
        :capabilities="levelType.capabilities"
        :can-upload-sectors="canUploadSectors"
        :can-upload-bonuses="canUploadBonuses"
        :can-upload-task="hasTask"
        :is-uploading="isUploading"
        :validation-result="validationResult"
        @export="handleExport"
        @import="handleImport"
        @upload-task="handleUploadTask"
        @upload-sectors="handleUploadSectors" 
        @upload-bonuses="handleUploadBonuses"
        @upload-all="handleUploadAll"
        @preview="handlePreview"
        @clear="handleClear"
      />
    </div>
    
    <!-- Универсальные модальные окна (из плана) -->
    <PreviewModal 
      v-if="showPreview"
      :data="data"
      :type="levelType"
      @close="showPreview = false"
    />
    
    <ExportModal
      v-if="showExport"
      :data="data"
      :type="levelType"
      :export-options="exportOptions"
      @close="showExport = false"
      @export="onExportConfirmed"
    />
    
    <ImportModal
      v-if="showImport"
      :level-type="levelType"
      @close="showImport = false"
      @import="onImportConfirmed"
    />
    
    <!-- Прогресс загрузки -->
    <UploadProgressModal
      v-if="isUploading"
      :progress="uploadProgress"
      @cancel="cancelUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect, defineAsyncComponent } from 'vue'
import type { LevelTypeDefinition } from './types/LevelType'

// Composables (из плана)
import { useLevelLogic } from './composables/useLevelLogic'
import { useExportImport } from './composables/useExportImport'
import { useUpload } from './composables/useUpload'

// Stores
import { useAuthStore } from '../../../store/auth'
import { useUploadStore } from '../../../store/index'

// Компоненты - динамическая загрузка
const LevelHeader = defineAsyncComponent(() => import('../../shared/layout/LevelHeader.vue'))
const ErrorDisplay = defineAsyncComponent(() => import('../../shared/layout/ErrorDisplay.vue'))
const LevelControls = defineAsyncComponent(() => import('../../shared/layout/LevelControls.vue'))
const ActionButtons = defineAsyncComponent(() => import('../../shared/layout/ActionButtons.vue'))

const DefaultTable = defineAsyncComponent(() => import('../../shared/tables/DefaultTable.vue'))
const PreviewModal = defineAsyncComponent(() => import('../../shared/modals/PreviewModal.vue'))
const ExportModal = defineAsyncComponent(() => import('../../shared/modals/ExportModal.vue'))
const ImportModal = defineAsyncComponent(() => import('../../shared/modals/ImportModal.vue'))
const UploadProgressModal = defineAsyncComponent(() => import('../../shared/modals/UploadProgressModal.vue'))

// ============================================================================
// PROPS
// ============================================================================

const props = defineProps<{
  levelType: LevelTypeDefinition
}>()

// ============================================================================
// STORES И COMPOSABLES
// ============================================================================

const authStore = useAuthStore()
const uploadStore = useUploadStore()

// Основная логика уровня (из плана)
const {
  data,
  config,
  error,
  isLoading,
  currentState,
  isValid,
  validationResult,
  hasData,
  updateData,
  updateConfig,
  handleClear
} = useLevelLogic(props.levelType)

// Экспорт/импорт (из плана)
const {
  showExport,
  showImport,
  isExporting,
  isImporting,
  exportOptions,
  handleExport,
  handleImport
} = useExportImport(data, props.levelType)

// Загрузка данных (из плана)
const {
  isUploading,
  uploadProgress,
  canUpload,
  sectorsToUpload,
  bonusesToUpload,
  hasTask,
  hasSectors,
  hasBonuses,
  handleUploadTask,
  handleUploadSectors,
  handleUploadBonuses,
  handleUploadAll,
  cancelUpload
} = useUpload(data, props.levelType)

// ============================================================================
// COMPUTED
// ============================================================================

const canUploadSectors = computed(() => hasSectors.value && canUpload.value)
const canUploadBonuses = computed(() => hasBonuses.value && canUpload.value)

const showPreview = computed(() => false) // TODO: Implement preview modal state

// ============================================================================
// МЕТОДЫ ОБРАБОТКИ СОБЫТИЙ
// ============================================================================

async function onExportConfirmed(options: any) {
  await handleExport(options)
  showExport.value = false
}

async function onImportConfirmed(file: File) {
  const result = await handleImport(file)
  if (result.success) {
    showImport.value = false
    // Можно показать уведомление об успехе
  } else {
    // Показываем ошибку, но модалку не закрываем
    alert(result.message)
  }
}

function handlePreview() {
  // TODO: Implement preview functionality
  console.log('Preview functionality not implemented yet')
}

// ============================================================================
// LIFECYCLE & WATCHERS
// ============================================================================

// Автоматическая валидация встроена в computed свойство validationResult
// Дополнительная логика может быть добавлена здесь при необходимости
</script>

<style scoped>
/* Базовые стили для всех типов уровней */
.container {
  max-width: 1400px;
}

.level-header {
  margin-bottom: 2rem;
}

.level-controls {
  margin-bottom: 1.5rem;
}

.level-table {
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.error-display {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
