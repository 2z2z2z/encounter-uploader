/**
 * База полей - центральный экспорт
 * 
 * Основные сущности:
 * - FIELD_DEFINITIONS - канонический массив всех полей
 * - getFieldDefinition() - получение поля по ID
 * - getFieldsByType() - фильтрация полей по типу
 * - tableRenderers - рендер-функции для DataTable
 */

// Экспорт определений полей
export * from './fieldDefinitions'

// Экспорт рендер-функций для таблицы
export * from './tableRenderers'

// Re-export основных функций для удобства использования
export { 
	FIELD_DEFINITIONS as FIELDS,
	getFieldDefinition,
	getFieldsByType,
	getFieldsWithControls,
	getFieldOrder,
	isRequiredField,
	getFieldDefaultValue
} from './fieldDefinitions'


