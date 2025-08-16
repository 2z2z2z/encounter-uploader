<!--
  CustomTemplate - шаблон для полностью кастомных типов
  Реализация согласно плану рефакторинга (Фаза 1.3)
-->

<template>
  <MixedTemplate 
    :use-mixins="mixinsToUse"
    :config="customConfig"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MixedTemplate from './MixedTemplate.vue'
import type { TemplateConfig, CustomFieldDefinition } from '../core/types/LevelType'

// ============================================================================
// PROPS
// ============================================================================

const props = withDefaults(defineProps<{
  name: string
  label: string
  category?: 'olymp' | 'bulk' | 'custom'
  useMixins?: ('olymp' | 'bulk' | 'custom')[]
  customFields?: Record<string, CustomFieldDefinition>
  props?: Record<string, any>
  extraCapabilities?: any[]
}>(), {
  category: 'custom',
  useMixins: () => ['custom'],
  customFields: () => ({}),
  props: () => ({}),
  extraCapabilities: () => ([])
})

// ============================================================================
// COMPUTED
// ============================================================================

const mixinsToUse = computed(() => {
  // Всегда включаем custom миксин для кастомных типов
  const mixins = [...props.useMixins]
  if (!mixins.includes('custom')) {
    mixins.push('custom')
  }
  return mixins
})

// ============================================================================
// КОНФИГУРАЦИЯ КАСТОМНОГО ТИПА
// ============================================================================

const customConfig = computed<TemplateConfig>(() => ({
  name: props.name,
  label: props.label,
  category: props.category,
  useMixins: mixinsToUse.value,
  
  // Объединяем настройки из всех используемых миксинов
  props: {
    // Базовые настройки для кастомного типа
    allowDynamicFields: true,
    supportFieldValidation: true,
    supportFieldTemplates: true,
    
    // Настройки олимпийского миксина (если включен)
    ...(mixinsToUse.value.includes('olymp') && {
      sectors: props.props.sectors || 31,
      allowSectorMode: props.props.allowSectorMode !== false,
      generateLayout: props.props.generateLayout !== false
    }),
    
    // Настройки массового миксина (если включен)
    ...(mixinsToUse.value.includes('bulk') && {
      enableTabs: props.props.enableTabs !== false,
      enableDelay: props.props.enableDelay || false,
      enableLimits: props.props.enableLimits || false,
      supportsCodeGeneration: props.props.supportsCodeGeneration || false,
      defaultTabName: props.props.defaultTabName || 'Блок'
    }),
    
    // Пользовательские настройки
    ...props.props
  },
  
  // Кастомные поля
  customFields: props.customFields,
  
  // Дополнительные возможности
  extraCapabilities: [
    // Базовые возможности кастомного типа
    { type: 'custom', required: true, config: { allowDynamicFields: true } },
    
    // Пользовательские возможности
    ...props.extraCapabilities
  ]
}))

// ============================================================================
// МЕТОДЫ ДЛЯ РАБОТЫ С КАСТОМНЫМИ ПОЛЯМИ
// ============================================================================

function addCustomField(
  fieldName: string, 
  fieldType: CustomFieldDefinition['type'], 
  fieldConfig: Partial<CustomFieldDefinition> = {}
) {
  const newField: CustomFieldDefinition = {
    type: fieldType,
    label: fieldConfig.label || fieldName,
    default: fieldConfig.default ?? getDefaultValueForType(fieldType),
    options: fieldConfig.options,
    validation: fieldConfig.validation
  }
  
  customConfig.value.customFields![fieldName] = newField
  
  return newField
}

function removeCustomField(fieldName: string) {
  if (customConfig.value.customFields && customConfig.value.customFields[fieldName]) {
    delete customConfig.value.customFields[fieldName]
    return true
  }
  return false
}

function getCustomFieldValue(data: any, fieldName: string, defaultValue?: any) {
  return data.customFields?.[fieldName] ?? defaultValue
}

function setCustomFieldValue(data: any, fieldName: string, value: any) {
  if (!data.customFields) {
    data.customFields = {}
  }
  data.customFields[fieldName] = value
}

function validateCustomFields(data: any[]): { valid: boolean, errors: string[] } {
  const errors: string[] = []
  
  if (!customConfig.value.customFields) {
    return { valid: true, errors }
  }
  
  Object.entries(customConfig.value.customFields).forEach(([fieldName, fieldDef]) => {
    data.forEach((item, index) => {
      const value = getCustomFieldValue(item, fieldName)
      
      // Проверяем обязательные поля
      if (fieldDef.validation) {
        try {
          fieldDef.validation.parse(value)
        } catch (error) {
          errors.push(`Строка ${index + 1}, поле "${fieldDef.label || fieldName}": некорректное значение`)
        }
      }
      
      // Проверяем значения select полей
      if (fieldDef.type === 'select' && fieldDef.options && value) {
        if (!fieldDef.options.includes(value)) {
          errors.push(`Строка ${index + 1}, поле "${fieldDef.label || fieldName}": недопустимое значение "${value}"`)
        }
      }
    })
  })
  
  return { valid: errors.length === 0, errors }
}

// ============================================================================
// ШАБЛОНЫ КАСТОМНЫХ ПОЛЕЙ
// ============================================================================

const fieldTemplates = {
  // Шаблон для сюжетных уровней
  story: {
    storyText: {
      type: 'textarea' as const,
      label: 'Текст истории',
      default: ''
    },
    characterName: {
      type: 'text' as const,
      label: 'Имя персонажа',
      default: ''
    },
    plotTwist: {
      type: 'boolean' as const,
      label: 'Включить поворот сюжета',
      default: false
    }
  },
  
  // Шаблон для линейных уровней
  linear: {
    stepOrder: {
      type: 'number' as const,
      label: 'Порядок шага',
      default: 1
    },
    allowSkips: {
      type: 'boolean' as const,
      label: 'Разрешить пропуски',
      default: false
    },
    stepNames: {
      type: 'text' as const,
      label: 'Название шага',
      default: ''
    }
  },
  
  // Шаблон для квестовых уровней
  quest: {
    questType: {
      type: 'select' as const,
      label: 'Тип квеста',
      default: 'main',
      options: ['main', 'side', 'hidden', 'bonus']
    },
    difficulty: {
      type: 'select' as const,
      label: 'Сложность',
      default: 'normal',
      options: ['easy', 'normal', 'hard', 'extreme']
    },
    rewards: {
      type: 'textarea' as const,
      label: 'Награды',
      default: ''
    },
    prerequisites: {
      type: 'text' as const,
      label: 'Требования',
      default: ''
    }
  }
}

function applyFieldTemplate(templateName: keyof typeof fieldTemplates) {
  const template = fieldTemplates[templateName]
  if (template) {
    Object.entries(template).forEach(([fieldName, fieldDef]) => {
      addCustomField(fieldName, fieldDef.type, fieldDef)
    })
  }
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function getDefaultValueForType(type: CustomFieldDefinition['type']): any {
  switch (type) {
    case 'text':
    case 'textarea':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'select':
      return ''
    default:
      return null
  }
}

function getFieldTypeIcon(type: CustomFieldDefinition['type']): string {
  switch (type) {
    case 'text':
      return '📝'
    case 'textarea':
      return '📄'
    case 'number':
      return '🔢'
    case 'boolean':
      return '☑️'
    case 'select':
      return '📋'
    default:
      return '❓'
  }
}

function exportCustomFieldsSchema(): any {
  return {
    name: props.name,
    label: props.label,
    category: props.category,
    mixins: mixinsToUse.value,
    customFields: customConfig.value.customFields,
    props: customConfig.value.props,
    version: '1.0',
    createdAt: new Date().toISOString()
  }
}

// ============================================================================
// EXPOSE
// ============================================================================

defineExpose({
  customConfig,
  mixinsToUse,
  
  // Методы для работы с кастомными полями
  addCustomField,
  removeCustomField,
  getCustomFieldValue,
  setCustomFieldValue,
  validateCustomFields,
  
  // Шаблоны и утилиты
  fieldTemplates,
  applyFieldTemplate,
  getFieldTypeIcon,
  exportCustomFieldsSchema,
  
  // Параметры кастомного типа
  type: 'custom',
  isCustom: true,
  supportsDynamicFields: true
})
</script>

<style scoped>
/* Стили для кастомных типов */

:deep(.level-header) {
  border-left: 4px solid var(--custom-color);
}

.custom-type {
  --custom-color: #8b5cf6; /* purple */
}

/* Стили для кастомных полей */
:deep(.custom-fields-section) {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

:deep(.custom-field-group) {
  margin-bottom: 1rem;
}

:deep(.custom-field-label) {
  display: block;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #374151;
}

:deep(.custom-field-input) {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

:deep(.custom-field-input:focus) {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.custom-field-textarea) {
  min-height: 80px;
  resize: vertical;
}

:deep(.custom-field-select) {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

:deep(.custom-field-checkbox) {
  width: auto;
  margin-right: 0.5rem;
}

/* Стили для управления кастомными полями */
:deep(.custom-fields-manager) {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
}

:deep(.custom-field-controls) {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

:deep(.add-field-button) {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

:deep(.remove-field-button) {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
}

/* Стили для шаблонов полей */
:deep(.field-templates) {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

:deep(.template-button) {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
}

:deep(.template-button:hover) {
  background: #4f46e5;
}
</style>

