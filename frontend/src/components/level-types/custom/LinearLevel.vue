<!--
  LinearLevel - линейный тип: базовая структура олимпийки + кастомные поля
  Реализация согласно плану рефакторинга (Фаза 1.4)
-->

<template>
  <MixedTemplate 
    :use-mixins="['olymp', 'custom']"
    :config="linearConfig"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MixedTemplate from '../../level-system/templates/MixedTemplate.vue'
import type { TemplateConfig, CustomFieldDefinition } from '../../level-system/core/types/LevelType'
import { z } from 'zod'

// ============================================================================
// PROPS
// ============================================================================

const props = withDefaults(defineProps<{
  sectors?: number
  allowSkips?: boolean
  enforceOrder?: boolean
  showProgress?: boolean
}>(), {
  sectors: 31,
  allowSkips: false,
  enforceOrder: true,
  showProgress: true
})

// ============================================================================
// КОНФИГУРАЦИЯ ЛИНЕЙНОГО ТИПА (из плана)
// ============================================================================

const linearConfig = computed<TemplateConfig>(() => ({
  name: 'linear-level',
  label: 'Линейный уровень',
  category: 'custom',
  useMixins: ['olymp', 'custom'],
  
  // Базовые настройки олимпийки + линейные расширения
  props: {
    // Олимпийская основа
    sectors: props.sectors,
    allowSectorMode: false, // Отключаем выбор режима - только линейная последовательность
    generateLayout: true,
    supportsBonuses: true,
    supportsTask: true,
    
    // Линейные особенности
    allowSkips: props.allowSkips,
    enforceOrder: props.enforceOrder,
    showProgress: props.showProgress,
    linearNavigation: true,
    
    // UI настройки
    supportsSectorNames: true, // Названия шагов
    supportsImportExport: true,
    supportsBulkOperations: false // Отключаем для сохранения линейности
  },
  
  // Кастомные поля для линейного типа (из плана)
  customFields: {
    stepOrder: {
      type: 'number',
      label: 'Порядок шага',
      default: 1,
      validation: z.number().min(1).max(props.sectors)
    } as CustomFieldDefinition,
    
    allowSkips: {
      type: 'boolean',
      label: 'Разрешить пропуски',
      default: props.allowSkips,
      validation: z.boolean()
    } as CustomFieldDefinition,
    
    stepNames: {
      type: 'text',
      label: 'Название шага',
      default: '',
      validation: z.string().max(100)
    } as CustomFieldDefinition,
    
    stepDescription: {
      type: 'textarea',
      label: 'Описание шага',
      default: '',
      validation: z.string().max(500)
    } as CustomFieldDefinition,
    
    requiredForProgress: {
      type: 'boolean',
      label: 'Обязателен для прогресса',
      default: true,
      validation: z.boolean()
    } as CustomFieldDefinition,
    
    estimatedTime: {
      type: 'number',
      label: 'Ожидаемое время (мин)',
      default: 5,
      validation: z.number().min(1).max(180)
    } as CustomFieldDefinition,
    
    difficulty: {
      type: 'select',
      label: 'Сложность',
      default: 'normal',
      options: ['easy', 'normal', 'hard'],
      validation: z.enum(['easy', 'normal', 'hard'])
    } as CustomFieldDefinition,
    
    hints: {
      type: 'textarea',
      label: 'Подсказки для шага',
      default: '',
      validation: z.string().max(1000)
    } as CustomFieldDefinition
  },
  
  // Дополнительные возможности линейного типа
  extraCapabilities: [
    { type: 'custom', required: true, config: {
      customFields: [
        'stepOrder',      // Порядок шагов
        'allowSkips',     // Разрешить пропуски
        'stepNames',      // Названия шагов
        'stepDescription', // Описания шагов
        'requiredForProgress', // Обязательность
        'estimatedTime',  // Время
        'difficulty',     // Сложность
        'hints'          // Подсказки
      ]
    }}
  ]
}))

// ============================================================================
// СПЕЦИАЛИЗИРОВАННЫЕ МЕТОДЫ ДЛЯ ЛИНЕЙНОГО ТИПА
// ============================================================================

function getLinearStructure(data: any[]) {
  // Сортируем шаги по порядку
  const sortedSteps = data
    .map(item => ({
      ...item,
      stepOrder: item.customFields?.stepOrder || parseInt(item.id.toString()) || 1,
      stepName: item.customFields?.stepNames || item.sectorName || `Шаг ${item.id}`,
      required: item.customFields?.requiredForProgress !== false,
      difficulty: item.customFields?.difficulty || 'normal',
      estimatedTime: item.customFields?.estimatedTime || 5
    }))
    .sort((a, b) => a.stepOrder - b.stepOrder)
  
  return {
    steps: sortedSteps,
    totalSteps: sortedSteps.length,
    requiredSteps: sortedSteps.filter(step => step.required).length,
    optionalSteps: sortedSteps.filter(step => !step.required).length,
    totalEstimatedTime: sortedSteps.reduce((sum, step) => sum + step.estimatedTime, 0),
    difficultyDistribution: {
      easy: sortedSteps.filter(step => step.difficulty === 'easy').length,
      normal: sortedSteps.filter(step => step.difficulty === 'normal').length,
      hard: sortedSteps.filter(step => step.difficulty === 'hard').length
    }
  }
}

function validateLinearData(data: any[]): { valid: boolean, errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (data.length === 0) {
    errors.push('Линейный уровень должен содержать хотя бы один шаг')
    return { valid: false, errors, warnings }
  }
  
  // Проверяем порядок шагов
  const stepOrders = data.map(item => item.customFields?.stepOrder || parseInt(item.id.toString()) || 1)
  const uniqueOrders = new Set(stepOrders)
  
  if (uniqueOrders.size !== stepOrders.length) {
    errors.push('Найдены дублирующиеся номера шагов')
  }
  
  // Проверяем последовательность
  const sortedOrders = Array.from(uniqueOrders).sort((a, b) => a - b)
  for (let i = 0; i < sortedOrders.length - 1; i++) {
    if (sortedOrders[i + 1] - sortedOrders[i] > 1) {
      warnings.push(`Пропуск в последовательности шагов между ${sortedOrders[i]} и ${sortedOrders[i + 1]}`)
    }
  }
  
  // Проверяем названия шагов
  const stepsWithoutNames = data.filter(item => 
    !item.customFields?.stepNames && !item.sectorName
  )
  if (stepsWithoutNames.length > 0) {
    warnings.push(`${stepsWithoutNames.length} шагов не имеют названий`)
  }
  
  // Проверяем наличие обязательных шагов
  const requiredSteps = data.filter(item => item.customFields?.requiredForProgress !== false)
  if (requiredSteps.length === 0) {
    warnings.push('Нет обязательных шагов - возможно, уровень слишком легкий')
  }
  
  // Проверяем время выполнения
  const totalTime = data.reduce((sum, item) => 
    sum + (item.customFields?.estimatedTime || 5), 0
  )
  if (totalTime < 10) {
    warnings.push(`Общее время уровня (${totalTime} мин) может быть слишком коротким`)
  } else if (totalTime > 120) {
    warnings.push(`Общее время уровня (${totalTime} мин) может быть слишком длинным`)
  }
  
  // Проверяем сложность
  const hardSteps = data.filter(item => item.customFields?.difficulty === 'hard').length
  const totalSteps = data.length
  if (hardSteps > totalSteps * 0.5) {
    warnings.push('Много сложных шагов - возможно, уровень слишком трудный')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

function generateLinearPreview(data: any[]): any {
  const structure = getLinearStructure(data)
  
  return {
    type: 'linear-level',
    structure,
    progression: generateProgressionMap(structure.steps),
    summary: `Линейный уровень: ${structure.totalSteps} шагов, ${structure.totalEstimatedTime} мин`,
    visualization: generateLinearVisualization(structure.steps)
  }
}

function generateProgressionMap(steps: any[]) {
  return steps.map((step, index) => ({
    order: step.stepOrder,
    name: step.stepName,
    required: step.required,
    difficulty: step.difficulty,
    estimatedTime: step.estimatedTime,
    canSkip: step.customFields?.allowSkips && props.allowSkips,
    prerequisites: index > 0 ? [steps[index - 1].stepOrder] : [],
    unlocks: index < steps.length - 1 ? [steps[index + 1].stepOrder] : []
  }))
}

function generateLinearVisualization(steps: any[]) {
  // Простая ASCII-визуализация линейного прогресса
  return steps.map((step, index) => {
    const connector = index < steps.length - 1 ? ' → ' : ''
    const difficultyIcon = {
      easy: '🟢',
      normal: '🟡', 
      hard: '🔴'
    }[step.difficulty] || '⚪'
    
    return `${difficultyIcon} ${step.stepName}${connector}`
  }).join('')
}

function autoGenerateStepOrder(data: any[]): any[] {
  return data.map((item, index) => ({
    ...item,
    customFields: {
      ...item.customFields,
      stepOrder: index + 1,
      stepNames: item.customFields?.stepNames || item.sectorName || `Шаг ${index + 1}`,
      requiredForProgress: item.customFields?.requiredForProgress !== false
    }
  }))
}

function optimizeLinearFlow(data: any[]): { optimized: any[], suggestions: string[] } {
  const suggestions: string[] = []
  let optimized = [...data]
  
  // Сортируем по сложности - легкие в начале
  const easySteps = optimized.filter(item => item.customFields?.difficulty === 'easy')
  const normalSteps = optimized.filter(item => item.customFields?.difficulty === 'normal')
  const hardSteps = optimized.filter(item => item.customFields?.difficulty === 'hard')
  
  if (hardSteps.length > 0 && easySteps.length > 0) {
    suggestions.push('Рекомендуется начать с легких шагов, затем перейти к сложным')
  }
  
  // Проверяем время
  const longSteps = optimized.filter(item => (item.customFields?.estimatedTime || 5) > 15)
  if (longSteps.length > 0) {
    suggestions.push(`${longSteps.length} шагов занимают много времени, рекомендуется разделить их`)
  }
  
  return {
    optimized,
    suggestions
  }
}

// ============================================================================
// EXPOSE
// ============================================================================

defineExpose({
  linearConfig,
  getLinearStructure,
  validateLinearData,
  generateLinearPreview,
  generateProgressionMap,
  generateLinearVisualization,
  autoGenerateStepOrder,
  optimizeLinearFlow,
  
  // Параметры линейного типа
  type: 'linear',
  isLinear: true,
  baseType: 'olymp',
  extensions: ['custom'],
  supportedFields: Object.keys(linearConfig.value.customFields || {})
})
</script>

<style scoped>
/* Стили для линейного типа */

:deep(.level-header) {
  border-left: 4px solid var(--linear-color);
}

.linear-type {
  --linear-color: #06b6d4; /* cyan */
}

/* Индикатор линейного прогресса */
:deep(.linear-progress) {
  margin: 1rem 0;
  padding: 1rem;
  background: linear-gradient(90deg, #ecfeff 0%, #f0f9ff 100%);
  border-radius: 0.5rem;
  border: 1px solid #cffafe;
}

:deep(.progress-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

:deep(.progress-title) {
  font-weight: 600;
  color: #0c4a6e;
}

:deep(.progress-stats) {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #0369a1;
}

:deep(.progress-visualization) {
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  background: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e0f2fe;
  overflow-x: auto;
  white-space: nowrap;
}

/* Стили для шагов в таблице */
:deep(.step-row) {
  position: relative;
}

:deep(.step-row::before) {
  content: '';
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--step-difficulty-color);
}

:deep(.step-row.easy::before) {
  --step-difficulty-color: #10b981;
}

:deep(.step-row.normal::before) {
  --step-difficulty-color: #f59e0b;
}

:deep(.step-row.hard::before) {
  --step-difficulty-color: #ef4444;
}

:deep(.step-order) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--linear-color);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

:deep(.step-name) {
  font-weight: 500;
  color: #1f2937;
}

:deep(.step-info) {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

:deep(.step-meta) {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

:deep(.step-difficulty) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
}

:deep(.step-difficulty.easy) {
  background: #d1fae5;
  color: #065f46;
}

:deep(.step-difficulty.normal) {
  background: #fef3c7;
  color: #92400e;
}

:deep(.step-difficulty.hard) {
  background: #fee2e2;
  color: #991b1b;
}

:deep(.step-time) {
  color: #4b5563;
}

:deep(.step-required) {
  color: #dc2626;
  font-weight: 500;
}

:deep(.step-optional) {
  color: #059669;
}

/* Linear controls */
:deep(.linear-controls) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

:deep(.linear-control-group) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.linear-control-label) {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

:deep(.linear-checkbox) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.optimization-panel) {
  margin-top: 1rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
}

:deep(.optimization-suggestions) {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

:deep(.optimization-suggestions li) {
  padding: 0.25rem 0;
  color: #92400e;
  font-size: 0.875rem;
}

:deep(.optimization-suggestions li::before) {
  content: '💡 ';
  margin-right: 0.5rem;
}
</style>

