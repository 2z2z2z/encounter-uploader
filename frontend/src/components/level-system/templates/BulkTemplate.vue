<!--
  BulkTemplate - шаблон массового типа (Type100500)
  Реализация согласно плану рефакторинга (Фаза 1.3)
-->

<template>
  <MixedTemplate 
    :use-mixins="['bulk']"
    :config="bulkConfig"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MixedTemplate from './MixedTemplate.vue'
import type { TemplateConfig } from '../core/types/LevelType'

// ============================================================================
// PROPS
// ============================================================================

const props = withDefaults(defineProps<{
  config?: Partial<TemplateConfig['props']>
}>(), {
  config: () => ({})
})

// ============================================================================
// КОНФИГУРАЦИЯ TYPE100500 (из плана)
// ============================================================================

const bulkConfig = computed<TemplateConfig>(() => ({
  name: 'type_100500',
  label: '100500 секторов и бонусов',
  category: 'bulk',
  useMixins: ['bulk'],
  
  // Специфичные настройки Type100500
  props: {
    // Базовые настройки
    enableTabs: true,
    defaultTabName: 'Блок',
    allowTabReordering: true,
    maxTabs: 20,
    
    // Функционал секторов и бонусов
    supportsSectorNames: true,
    supportsBonusNames: true,
    supportsMultipleVariants: true,
    
    // Специфичный функционал Type100500
    enableDelay: true,
    enableLimits: true,
    enableLevels: true,
    supportsBonusTask: true,
    supportsBonusHints: true,
    supportsNegativeTime: true,
    
    // Генерация кодов
    supportsCodeGeneration: true,
    codeGenerationSettings: {
      minLength: 4,
      maxLength: 4,
      useNumbers: true,
      useLetters: false,
      allowDuplicates: false
    },
    
    // Импорт/экспорт
    supportsImportExport: true,
    exportFormats: ['json', 'csv'],
    
    // UI настройки
    showQuickTime: true,
    showPatterns: true,
    showBulkOperations: true,
    
    // Переопределяем настройки из props
    ...props.config
  },
  
  // Дополнительные возможности для Type100500
  extraCapabilities: [
    { type: 'custom', required: false, config: { allowTabCustomization: true } }
  ]
}))

// ============================================================================
// СПЕЦИФИЧНЫЕ МЕТОДЫ ДЛЯ TYPE100500
// ============================================================================

// Все методы наследуются от BulkMixin через MixedTemplate
// Но можем добавить специфичные для Type100500

function getDefaultTabStructure() {
  return {
    name: 'Блок 1',
    quickTime: { hours: 0, minutes: 0, seconds: 0 },
    sectorPattern: '',
    bonusPattern: '',
    rows: Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      variants: [''],
      inSector: false,
      inBonus: false,
      bonusTime: { hours: 0, minutes: 0, seconds: 0 },
      delay: { hours: 0, minutes: 0, seconds: 0 },
      relativeLimit: { hours: 0, minutes: 0, seconds: 0 },
      allLevels: true,
      targetLevels: []
    }))
  }
}

function getRecommendedRowsPerTab(): number {
  return 10 // Оптимальное количество строк для одного таба
}

function getMaxRecommendedRows(): number {
  return 200 // Максимальное рекомендуемое количество строк
}

function generateDefaultCodes(count: number, settings?: any): string[] {
  const finalSettings = {
    length: 4,
    useNumbers: true,
    useLetters: false,
    allowDuplicates: false,
    ...settings
  }
  
  const chars = []
  if (finalSettings.useNumbers) chars.push(...'0123456789'.split(''))
  if (finalSettings.useLetters) chars.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
  
  if (chars.length === 0) return []
  
  const codes = new Set<string>()
  
  while (codes.size < count && codes.size < Math.pow(chars.length, finalSettings.length)) {
    let code = ''
    for (let j = 0; j < finalSettings.length; j++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    codes.add(code)
  }
  
  return Array.from(codes)
}

function validateBulkData(tabs: any[]): { valid: boolean, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (tabs.length === 0) {
    errors.push('Необходимо создать хотя бы один блок')
    return { valid: false, errors, warnings }
  }
  
  const totalRows = tabs.reduce((sum, tab) => sum + tab.rows.length, 0)
  
  if (totalRows > getMaxRecommendedRows()) {
    warnings.push(`Общее количество строк (${totalRows}) превышает рекомендуемое (${getMaxRecommendedRows()})`)
  }
  
  tabs.forEach((tab, tabIndex) => {
    if (!tab.name.trim()) {
      warnings.push(`Блок ${tabIndex + 1} не имеет названия`)
    }
    
    if (tab.rows.length > 50) {
      warnings.push(`Блок "${tab.name}" содержит много строк (${tab.rows.length}), рекомендуется разделить`)
    }
    
    const activeRows = tab.rows.filter((row: any) => 
      row.inSector || row.inBonus || row.variants.some((v: string) => v.trim())
    )
    
    if (activeRows.length === 0) {
      warnings.push(`Блок "${tab.name}" не содержит активных строк`)
    }
    
    // Проверяем дубликаты кодов внутри таба
    const codes = tab.rows
      .filter((row: any) => row.variants.length > 0 && row.variants[0].trim())
      .map((row: any) => row.variants[0].trim().toLowerCase())
    
    const uniqueCodes = new Set(codes)
    if (codes.length > uniqueCodes.size) {
      warnings.push(`Блок "${tab.name}" содержит дубликаты кодов`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// EXPOSE
// ============================================================================

defineExpose({
  bulkConfig,
  getDefaultTabStructure,
  getRecommendedRowsPerTab,
  getMaxRecommendedRows,
  generateDefaultCodes,
  validateBulkData,
  
  // Параметры Type100500
  type: 'bulk',
  supportsTabs: true
})
</script>

<style scoped>
/* Специфичные стили для Type100500 */

:deep(.level-header) {
  border-left: 4px solid var(--bulk-color);
}

.bulk-type {
  --bulk-color: #f59e0b; /* amber */
}

/* Стили для табов */
:deep(.tabs-container) {
  margin-bottom: 1rem;
}

:deep(.tab-button) {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  margin-right: 0.25rem;
  cursor: pointer;
  border-radius: 0.375rem 0.375rem 0 0;
}

:deep(.tab-button.active) {
  background: white;
  border-bottom-color: white;
}

:deep(.tab-content) {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0 0.375rem 0.375rem 0.375rem;
  padding: 1rem;
}

/* Стили для quick controls */
:deep(.quick-controls) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

:deep(.bulk-operations) {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

:deep(.bulk-button) {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

:deep(.bulk-button:hover) {
  background: #2563eb;
}

:deep(.bulk-button:disabled) {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>

