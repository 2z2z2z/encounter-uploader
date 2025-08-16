<!--
  HybridLevel - гибридный тип: олимпийка + возможности Type100500
  Реализация согласно плану рефакторинга (Фаза 1.4)
-->

<template>
  <MixedTemplate 
    :use-mixins="['olymp', 'bulk']"
    :config="hybridConfig"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MixedTemplate from '../../level-system/templates/MixedTemplate.vue'
import type { TemplateConfig } from '../../level-system/core/types/LevelType'

// ============================================================================
// PROPS
// ============================================================================

const props = withDefaults(defineProps<{
  sectors?: number
  enableDelay?: boolean
  enableLimits?: boolean
  enableLevels?: boolean
  allowTabs?: boolean
}>(), {
  sectors: 31,
  enableDelay: true,
  enableLimits: true,
  enableLevels: true,
  allowTabs: false // Отключаем табы, оставляем олимпийскую структуру
})

// ============================================================================
// КОНФИГУРАЦИЯ ГИБРИДНОГО ТИПА (из плана)
// ============================================================================

const hybridConfig = computed<TemplateConfig>(() => ({
  name: 'hybrid-olymp',
  label: 'Олимпийка с расширениями',
  category: 'custom',
  useMixins: ['olymp', 'bulk'],
  
  // Объединяем настройки олимпийки и Type100500
  props: {
    // Базовые настройки олимпийки
    sectors: props.sectors,
    allowSectorMode: true,
    sectorModes: ['all', 'initialAndFinal', 'finalOnly', 'custom'],
    generateLayout: true,
    supportsBonuses: true,
    supportsTask: true,
    
    // Расширения из Type100500 (из плана)
    enableDelay: props.enableDelay,        // Задержки из Type100500
    enableLimits: props.enableLimits,      // Ограничения из Type100500
    enableLevels: props.enableLevels,      // Выбор уровней из Type100500
    
    // UI настройки
    allowTabs: props.allowTabs,            // По умолчанию отключены для сохранения олимпийской структуры
    supportsSectorNames: true,             // Расширенные возможности секторов
    supportsBonusTask: true,               // HTML задания для бонусов
    supportsBonusHints: true,              // HTML подсказки для бонусов
    supportsNegativeTime: true,            // Отрицательное время (штрафы)
    
    // Дополнительные возможности
    supportsImportExport: true,
    supportsBulkOperations: true,
    supportsCodeGeneration: false         // Отключаем для сохранения олимпийского характера
  },
  
  // Дополнительные возможности гибридного типа (из плана)
  extraCapabilities: [
    { type: 'delay', required: false },    // Из Type100500
    { type: 'limit', required: false },    // Из Type100500
    { type: 'levels', required: false }    // Из Type100500
  ]
}))

// ============================================================================
// СПЕЦИАЛИЗИРОВАННЫЕ МЕТОДЫ ДЛЯ ГИБРИДНОГО ТИПА
// ============================================================================

function getHybridFeatures() {
  return {
    // Возможности олимпийки
    olympFeatures: {
      sectors: props.sectors,
      sectorModes: ['all', 'initialAndFinal', 'finalOnly', 'custom'],
      olympLayout: true,
      traditionalBonuses: true
    },
    
    // Расширения из Type100500
    bulkExtensions: {
      delaySupport: props.enableDelay,
      limitSupport: props.enableLimits,
      levelSelection: props.enableLevels,
      htmlBonusTask: true,
      htmlBonusHints: true,
      negativeTime: true
    },
    
    // Уникальные возможности гибрида
    hybridFeatures: {
      combinedValidation: true,
      extendedExport: true,
      smartDefaults: true
    }
  }
}

function validateHybridData(data: any[]): { valid: boolean, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Олимпийская валидация
  const maxId = Math.max(...data.map(item => 
    typeof item.id === 'number' ? item.id : parseInt(item.id.toString())
  ))
  
  if (maxId > props.sectors) {
    errors.push(`Максимальный номер ответа (${maxId}) превышает количество секторов (${props.sectors})`)
  }
  
  // Проверяем наличие секторов
  const sectorAnswers = data.filter(item => item.inSector && !item.inBonus)
  if (sectorAnswers.length === 0) {
    warnings.push('Не выбрано ни одного сектора для загрузки')
  }
  
  // Валидация расширений Type100500
  if (props.enableDelay) {
    const itemsWithDelay = data.filter(item => 
      item.delay && (item.delay.hours > 0 || item.delay.minutes > 0 || item.delay.seconds > 0)
    )
    if (itemsWithDelay.length > 0) {
      warnings.push(`${itemsWithDelay.length} элементов имеют настроенные задержки`)
    }
  }
  
  if (props.enableLimits) {
    const itemsWithLimits = data.filter(item => 
      item.relativeLimit && (item.relativeLimit.hours > 0 || item.relativeLimit.minutes > 0 || item.relativeLimit.seconds > 0)
    )
    if (itemsWithLimits.length > 0) {
      warnings.push(`${itemsWithLimits.length} элементов имеют временные ограничения`)
    }
  }
  
  // Проверяем бонусы с HTML заданиями
  const bonusesWithTasks = data.filter(item => item.inBonus && item.bonusTask && item.bonusTask.trim())
  const bonusesWithHints = data.filter(item => item.inBonus && item.bonusHint && item.bonusHint.trim())
  
  if (bonusesWithTasks.length > 0) {
    warnings.push(`${bonusesWithTasks.length} бонусов имеют HTML задания`)
  }
  
  if (bonusesWithHints.length > 0) {
    warnings.push(`${bonusesWithHints.length} бонусов имеют HTML подсказки`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

function generateHybridPreview(data: any[]): any {
  const sectors = data.filter(item => item.inSector && !item.inBonus)
  const bonuses = data.filter(item => item.inBonus)
  
  return {
    type: 'hybrid-olymp',
    olympBase: {
      sectors: props.sectors,
      activeSectors: sectors.length,
      activeBonuses: bonuses.length
    },
    
    extensions: {
      delayedItems: props.enableDelay ? data.filter(item => 
        item.delay && (item.delay.hours > 0 || item.delay.minutes > 0 || item.delay.seconds > 0)
      ).length : 0,
      
      limitedItems: props.enableLimits ? data.filter(item => 
        item.relativeLimit && (item.relativeLimit.hours > 0 || item.relativeLimit.minutes > 0 || item.relativeLimit.seconds > 0)
      ).length : 0,
      
      htmlBonuses: bonuses.filter(item => 
        (item.bonusTask && item.bonusTask.trim()) || (item.bonusHint && item.bonusHint.trim())
      ).length,
      
      customLevels: props.enableLevels ? bonuses.filter(item => 
        !item.allLevels && item.targetLevels && item.targetLevels.length > 0
      ).length : 0
    },
    
    summary: `Гибрид: ${props.sectors} секторов + расширения Type100500`,
    recommendations: generateRecommendations(data)
  }
}

function generateRecommendations(data: any[]): string[] {
  const recommendations: string[] = []
  const sectors = data.filter(item => item.inSector && !item.inBonus)
  const bonuses = data.filter(item => item.inBonus)
  
  // Рекомендации по секторам
  if (sectors.length < props.sectors * 0.3) {
    recommendations.push(`Рекомендуется добавить больше секторов (текущее: ${sectors.length}, рекомендуемое: ${Math.ceil(props.sectors * 0.4)})`)
  }
  
  // Рекомендации по бонусам
  if (bonuses.length > props.sectors * 0.5) {
    recommendations.push(`Много бонусов для олимпийки (${bonuses.length}), рекомендуется не более ${Math.ceil(props.sectors * 0.3)}`)
  }
  
  // Рекомендации по расширениям
  if (props.enableDelay) {
    const delayedItems = data.filter(item => item.delay && (item.delay.hours > 0 || item.delay.minutes > 0 || item.delay.seconds > 0))
    if (delayedItems.length === 0) {
      recommendations.push('Функция задержек включена, но не используется')
    }
  }
  
  return recommendations
}

// ============================================================================
// EXPOSE
// ============================================================================

defineExpose({
  hybridConfig,
  getHybridFeatures,
  validateHybridData,
  generateHybridPreview,
  generateRecommendations,
  
  // Параметры гибридного типа
  type: 'hybrid',
  isHybrid: true,
  baseType: 'olymp',
  extensions: ['bulk']
})
</script>

<style scoped>
/* Стили для гибридного типа */

:deep(.level-header) {
  border-left: 4px solid var(--hybrid-color);
  background: linear-gradient(90deg, var(--olymp-color) 0%, var(--bulk-color) 100%);
  background-size: 100% 4px;
  background-position: bottom;
  background-repeat: no-repeat;
}

.hybrid-type {
  --hybrid-color: #6366f1; /* indigo */
  --olymp-color: #10b981; /* green */
  --bulk-color: #f59e0b; /* amber */
}

/* Индикаторы для гибридных возможностей */
:deep(.hybrid-indicators) {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #ecfdf5 0%, #fef3c7 100%);
  border-radius: 0.5rem;
  border: 1px solid #d1fae5;
}

:deep(.indicator) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

:deep(.indicator.olymp) {
  color: var(--olymp-color);
  border: 1px solid #bbf7d0;
}

:deep(.indicator.bulk) {
  color: var(--bulk-color);
  border: 1px solid #fef3c7;
}

/* Расширенные контролы для гибридных возможностей */
:deep(.hybrid-controls) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

:deep(.control-group) {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

:deep(.control-group h4) {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

:deep(.hybrid-checkbox) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

:deep(.hybrid-checkbox input) {
  width: 1rem;
  height: 1rem;
}

:deep(.hybrid-checkbox label) {
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
}

/* Специальные стили для таблицы гибридного типа */
:deep(.hybrid-table) {
  position: relative;
}

:deep(.hybrid-table::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--olymp-color) 0%, var(--bulk-color) 100%);
}

/* Подсветка строк с расширениями */
:deep(.table-row.has-delay) {
  border-left: 3px solid #fbbf24;
}

:deep(.table-row.has-limit) {
  border-left: 3px solid #f87171;
}

:deep(.table-row.has-custom-levels) {
  border-left: 3px solid #a78bfa;
}
</style>

