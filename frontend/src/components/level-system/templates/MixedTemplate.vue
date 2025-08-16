<!--
  MixedTemplate - шаблон для комбинирования функционала
  Реализация согласно плану рефакторинга (Фаза 1.3)
-->

<template>
  <BaseLevelType :level-type="mixedType" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseLevelType from '../core/BaseLevelType.vue'
import type { TemplateConfig, LevelTypeDefinition } from '../core/types/LevelType'
// TODO: import { UniversalAnswerSchema } from '../core/types/LevelType' когда Zod будет установлен

// Миксины (из плана)
import { useOlympMixin } from '../core/mixins/OlympMixin'
import { useBulkMixin } from '../core/mixins/BulkMixin'
import { useCustomMixin } from '../core/mixins/CustomMixin'

// ============================================================================
// PROPS
// ============================================================================

const props = defineProps<{
  useMixins: ('olymp' | 'bulk' | 'custom')[]
  config: TemplateConfig
}>()

// ============================================================================
// ДИНАМИЧЕСКОЕ ПОДКЛЮЧЕНИЕ МИКСИНОВ (из плана)
// ============================================================================

const mixins = computed(() => {
  
  const result: any = {
    capabilities: [],
    components: {},
    methods: {},
    computedProperties: {}
  }
  
  // Подключаем олимпийский миксин
  if (props.useMixins.includes('olymp')) {
    const olympMixin = useOlympMixin()
    result.capabilities.push(...olympMixin.capabilities)
    Object.assign(result.components, olympMixin.components)
    Object.assign(result.methods, olympMixin.methods)
    Object.assign(result.computedProperties, olympMixin.computedProperties || {})
  }
  
  // Подключаем массовый миксин (Type100500)
  if (props.useMixins.includes('bulk')) {
    const bulkMixin = useBulkMixin()
    result.capabilities.push(...bulkMixin.capabilities)
    Object.assign(result.components, bulkMixin.components)
    Object.assign(result.methods, bulkMixin.methods)
    Object.assign(result.computedProperties, bulkMixin.computedProperties || {})
  }
  
  // Подключаем кастомный миксин
  if (props.useMixins.includes('custom')) {
    const customMixin = useCustomMixin()
    result.capabilities.push(...customMixin.capabilities)
    Object.assign(result.components, customMixin.components)
    Object.assign(result.methods, customMixin.methods)
    Object.assign(result.computedProperties, customMixin.computedProperties || {})
  }
  
  return result
})

// ============================================================================
// ОБЪЕДИНЕННЫЙ ТИП УРОВНЯ (из плана)
// ============================================================================

const mixedType = computed<LevelTypeDefinition>(() => ({
  name: props.config.name,
  label: props.config.label,
  category: props.config.category,
  
  // Объединяем capabilities из миксинов и дополнительные из конфигурации
  capabilities: [
    ...mixins.value.capabilities,
    ...(props.config.extraCapabilities || [])
  ],
  
  // Конфигурация по умолчанию
  defaultConfig: {
    // Базовые настройки
    initialRowsCount: 5,
    
    // Настройки из олимпийского миксина
    ...(props.useMixins.includes('olymp') && {
      sectors: props.config.props?.sectors || 31,
      allowSectorMode: true,
      sectorModes: ['all', 'initialAndFinal', 'finalOnly', 'custom']
    }),
    
    // Настройки из массового миксина
    ...(props.useMixins.includes('bulk') && {
      enableTabs: props.config.props?.allowTabs !== false,
      enableDelay: props.config.props?.enableDelay || false,
      enableLimits: props.config.props?.enableLimits || false,
      defaultTabName: props.config.props?.defaultTabName || 'Блок'
    }),
    
    // Кастомные настройки
    ...(props.config.props || {}),
    
    // Кастомные поля
    customFields: props.config.customFields || {}
  },
  
  // Валидатор - объединяет валидаторы всех миксинов
  validator: (data: any) => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Базовая валидация
    if (!Array.isArray(data)) {
      errors.push('Данные должны быть массивом')
      return { valid: false, errors, warnings }
    }
    
    if (data.length === 0) {
      warnings.push('Нет данных для проверки')
    }
    
    // Валидация олимпийского миксина
    if (props.useMixins.includes('olymp') && mixins.value.methods.validateOlympData) {
      const olympValidation = mixins.value.methods.validateOlympData(
        data, 
        props.config.props?.sectors || 31
      )
      errors.push(...olympValidation.errors)
      warnings.push(...(olympValidation.warnings || []))
    }
    
    // Валидация массового миксина
    if (props.useMixins.includes('bulk') && mixins.value.methods.validateBulkData) {
      // Для bulk валидации нужна структура табов, адаптируем
      const tabs = [{ name: 'Главный', rows: data }]
      const bulkValidation = mixins.value.methods.validateBulkData(tabs)
      errors.push(...bulkValidation.errors)
      warnings.push(...(bulkValidation.warnings || []))
    }
    
    // Валидация кастомных полей
    if (props.useMixins.includes('custom') && props.config.customFields) {
      Object.entries(props.config.customFields).forEach(([fieldName, fieldDef]) => {
        data.forEach((item: any, index: number) => {
          if (item.customFields && item.customFields[fieldName] !== undefined) {
            const validation = mixins.value.methods.validateCustomField(
              fieldName, 
              item.customFields[fieldName], 
              fieldDef
            )
            if (!validation.valid) {
              errors.push(`Строка ${index + 1}: ${validation.errors.join(', ')}`)
            }
          }
        })
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  // Загрузчик - использует объединенную логику
  uploader: async (data: any) => {
    try {
      // Здесь будет логика загрузки с использованием unified API
      // В зависимости от подключенных миксинов
      
      return {
        success: true,
        data: { uploaded: data.length },
        metrics: {
          duration: 0,
          elementsCount: data.length,
          dataSize: JSON.stringify(data).length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки'
      }
    }
  },
  
  // Схема - объединяет схемы всех миксинов
  schema: (() => {
    // TODO: Временная заглушка до установки Zod
    // let schema = UniversalAnswerSchema.array()
    let schema = {
      parse: (data: any) => data, // Заглушка для схемы
      safeParse: (data: any) => ({ success: true, data }),
      array: () => schema
    }
    
    // Расширяем схему кастомными полями если есть
    if (props.useMixins.includes('custom') && props.config.customFields) {
      // Логика расширения схемы будет здесь
      if (mixins.value.methods.createCustomSchema) {
        schema = mixins.value.methods.createCustomSchema(schema, props.config.customFields)
      }
    }
    
    return schema
  })(),
  
  // Компоненты для рендеринга
  tableComponent: determineTableComponent(),
  controlsComponent: 'LevelControls'
}))

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function determineTableComponent(): string {
  // Определяем компонент таблицы на основе подключенных миксинов
  if (props.useMixins.includes('bulk')) {
    return 'BulkTable'
  } else if (props.useMixins.includes('olymp')) {
    return 'OlympTable'
  } else {
    return 'FlexibleTable'
  }
}

// ============================================================================
// EXPOSE ДЛЯ ДОСТУПА К МИКСИНАМ
// ============================================================================

defineExpose({
  mixins,
  mixedType,
  
  // Методы всех подключенных миксинов
  ...mixins.value.methods,
  
  // Computed properties всех миксинов
  ...mixins.value.computedProperties
})
</script>

<style scoped>
/* Стили будут наследоваться от BaseLevelType */
</style>
