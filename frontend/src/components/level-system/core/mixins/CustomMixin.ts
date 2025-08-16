/**
 * CustomMixin - миксин для кастомных полей
 * Реализация согласно плану рефакторинга (Фаза 1.2)
 */

import type { MixinDefinition, LevelCapability, CustomFieldDefinition, UniversalAnswer } from '../types/LevelType'
import { z, validateCustomField } from '../../../../utils/validation'

// Типы для кастомных полей
interface CustomFieldValue {
  fieldName: string
  value: any
  type: CustomFieldDefinition['type']
}

export function useCustomMixin(): MixinDefinition {
  return {
    name: 'custom',
    
    // Capabilities для кастомных полей
    capabilities: [
      { type: 'custom', required: true, config: { allowDynamicFields: true } }
    ] as LevelCapability[],
    
    // Универсальные компоненты (из плана) - TODO: создать компоненты
    components: {
      // CustomFieldInput: () => import('../../../shared/forms/CustomFieldInput.vue'), // TODO: создать
      // FlexibleTable: () => import('../../../shared/tables/FlexibleTable.vue') // TODO: создать
    },
    
    // Логика для кастомных полей (из плана)
    methods: {
      // Добавление кастомного поля (из плана)
      addCustomField: (name: string, type: CustomFieldDefinition['type'], config?: Partial<CustomFieldDefinition>): CustomFieldDefinition => {
        const field: CustomFieldDefinition = {
          type,
          label: config?.label || name,
          default: config?.default || getDefaultValue(type),
          options: config?.options,
          validation: config?.validation || createValidationForType(type)
        }
        
        return field
      },
      
      // Удаление кастомного поля (из плана)
      removeCustomField: (answers: UniversalAnswer[], fieldName: string) => {
        answers.forEach(answer => {
          if (answer.customFields && answer.customFields[fieldName] !== undefined) {
            delete answer.customFields[fieldName]
          }
        })
      },
      
      // Валидация кастомного поля (из плана)
      validateCustomField: (fieldName: string, value: any, fieldDef: CustomFieldDefinition) => {
        try {
          if (fieldDef.validation) {
            fieldDef.validation.parse(value)
          } else {
            // Базовая валидация по типу
            const schema = createValidationForType(fieldDef.type)
            schema.parse(value)
          }
          
          return { valid: true, errors: [] }
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              valid: false,
              errors: error.errors.map(e => `${fieldName}: ${e.message}`)
            }
          }
          
          return {
            valid: false,
            errors: [`${fieldName}: Ошибка валидации`]
          }
        }
      },
      
      // Применение кастомного поля ко всем строкам
      applyCustomFieldToAll: (answers: UniversalAnswer[], fieldName: string, value: any) => {
        answers.forEach(answer => {
          if (!answer.customFields) {
            answer.customFields = {}
          }
          answer.customFields[fieldName] = value
        })
      },
      
      // Получение значения кастомного поля
      getCustomFieldValue: (answer: UniversalAnswer, fieldName: string, defaultValue?: any) => {
        return answer.customFields?.[fieldName] ?? defaultValue
      },
      
      // Установка значения кастомного поля
      setCustomFieldValue: (answer: UniversalAnswer, fieldName: string, value: any) => {
        if (!answer.customFields) {
          answer.customFields = {}
        }
        answer.customFields[fieldName] = value
      },
      
      // Получение всех кастомных полей строки
      getAllCustomFields: (answer: UniversalAnswer): Record<string, any> => {
        return answer.customFields || {}
      },
      
      // Создание кастомного поля с автоматической валидацией
      createValidatedCustomField: (name: string, type: CustomFieldDefinition['type'], options?: string[]) => {
        const field: CustomFieldDefinition = {
          type,
          label: name,
          default: getDefaultValue(type),
          options,
          validation: createValidationForType(type, options)
        }
        
        return field
      },
      
      // Экспорт кастомных полей
      exportCustomFields: (answers: UniversalAnswer[]) => {
        const customFieldsData: Record<string, any[]> = {}
        
        answers.forEach((answer, index) => {
          if (answer.customFields) {
            Object.entries(answer.customFields).forEach(([fieldName, value]) => {
              if (!customFieldsData[fieldName]) {
                customFieldsData[fieldName] = []
              }
              customFieldsData[fieldName][index] = value
            })
          }
        })
        
        return customFieldsData
      },
      
      // Импорт кастомных полей
      importCustomFields: (answers: UniversalAnswer[], customFieldsData: Record<string, any[]>) => {
        Object.entries(customFieldsData).forEach(([fieldName, values]) => {
          values.forEach((value, index) => {
            if (index < answers.length) {
              if (!answers[index].customFields) {
                answers[index].customFields = {}
              }
              answers[index].customFields[fieldName] = value
            }
          })
        })
      },
      
      // Создание схемы для сложного кастомного типа
      createCustomSchema: (baseSchema: z.ZodType, customFields: Record<string, CustomFieldDefinition>) => {
        let extendedSchema = baseSchema
        
        if (Object.keys(customFields).length > 0) {
          const customFieldsSchema: Record<string, z.ZodType> = {}
          
          Object.entries(customFields).forEach(([fieldName, fieldDef]) => {
            customFieldsSchema[fieldName] = fieldDef.validation || createValidationForType(fieldDef.type)
          })
          
          // Расширяем базовую схему кастомными полями
          if (extendedSchema instanceof z.ZodObject) {
            extendedSchema = extendedSchema.extend({
              customFields: z.object(customFieldsSchema).optional()
            })
          }
        }
        
        return extendedSchema
      }
    }
  }
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function getDefaultValue(type: CustomFieldDefinition['type']): any {
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

function createValidationForType(type: CustomFieldDefinition['type'], options?: string[]): z.ZodType {
  switch (type) {
    case 'text':
    case 'textarea':
      return z.string()
    case 'number':
      return z.number()
    case 'boolean':
      return z.boolean()
    case 'select':
      if (options && options.length > 0) {
        return z.enum(options as [string, ...string[]])
      }
      return z.string()
    default:
      return z.any()
  }
}

// Экспорт типов для использования в других компонентах
export type { CustomFieldValue }
