/**
 * Определения полей для системы level-system
 * 
 * Содержит канонический набор из 13 полей с метаданными.
 * Порядок полей определяет порядок колонок в DataTable.
 */

import type { FieldDefinition, FieldId, FieldType } from '../../types'

/**
 * Канонические определения полей
 * 
 * ВАЖНО: Порядок полей в этом массиве определяет порядок колонок 
 * в таблице LevelContent. Изменение порядка повлияет на UI.
 */
export const FIELD_DEFINITIONS: readonly FieldDefinition[] = [
	{
		id: 'answer',
		label: 'Ответ',
		type: 'string[]',
		columnLabel: 'Ответ',
		required: true,
		placeholder: 'Введите варианты ответов'
	},
	{
		id: 'sector',
		label: 'Сектор',
		type: 'boolean',
		columnLabel: 'Сектор',
		controlId: 'sectorMode',
		defaultValue: false
	},
	{
		id: 'bonus',
		label: 'Бонус', 
		type: 'boolean',
		columnLabel: 'Бонус',
		defaultValue: false
	},
	{
		id: 'bonusTime',
		label: 'Бонусное время',
		type: 'time',
		columnLabel: 'Бонусное время',
		controlId: 'bonusTime',
		defaultValue: { hours: 0, minutes: 0, seconds: 0, negative: false }
	},
	{
		id: 'closedText',
		label: 'Закрытый сектор',
		type: 'string',
		columnLabel: 'Закрытый сектор',
		controlId: 'closedSector',
		placeholder: 'Текст или картинка'
	},
	{
		id: 'displayText',
		label: 'Открытый сектор',
		type: 'string',
		columnLabel: 'Открытый сектор',
		controlId: 'openSector',
		placeholder: 'Отображение ответа'
	},
	{
		id: 'bonusLevels',
		label: 'Уровни бонуса',
		type: 'levels',
		columnLabel: 'Уровни бонуса',
		controlId: 'bonusLevels'
	},
	{
		id: 'delay',
		label: 'Задержка',
		type: 'timeSimple',
		columnLabel: 'Задержка',
		controlId: 'delay',
		defaultValue: { hours: 0, minutes: 0, seconds: 0 }
	},
	{
		id: 'limit',
		label: 'Ограничение',
		type: 'timeSimple',
		columnLabel: 'Ограничение',
		controlId: 'limit',
		defaultValue: { hours: 0, minutes: 0, seconds: 0 }
	},
	{
		id: 'sectorName',
		label: 'Название сектора',
		type: 'string',
		columnLabel: 'Название сектора',
		controlId: 'sectorName',
		placeholder: 'Название'
	},
	{
		id: 'bonusName',
		label: 'Название бонуса',
		type: 'string',
		columnLabel: 'Название бонуса', 
		controlId: 'bonusName',
		placeholder: 'Название'
	},
	{
		id: 'bonusTask',
		label: 'Бонусное задание',
		type: 'html',
		columnLabel: 'Бонусное задание',
		controlId: 'bonusTask',
		expandable: true,
		placeholder: 'HTML код задания'
	},
	{
		id: 'hint',
		label: 'Подсказка',
		type: 'html',
		columnLabel: 'Подсказка',
		controlId: 'hint',
		expandable: true,
		placeholder: 'HTML код подсказки'
	}
] as const

/**
 * Получить определение поля по ID
 */
export const getFieldDefinition = (fieldId: FieldId): FieldDefinition | undefined => {
	return FIELD_DEFINITIONS.find(field => field.id === fieldId)
}

/**
 * Получить все поля определенного типа
 */
export const getFieldsByType = (fieldType: FieldType): FieldDefinition[] => {
	return FIELD_DEFINITIONS.filter(field => field.type === fieldType)
}

/**
 * Получить поля, которые имеют связанные контролы
 */
export const getFieldsWithControls = (): FieldDefinition[] => {
	return FIELD_DEFINITIONS.filter(field => field.controlId)
}

/**
 * Получить порядковый индекс поля (для сортировки колонок)
 */
export const getFieldOrder = (fieldId: FieldId): number => {
	return FIELD_DEFINITIONS.findIndex(field => field.id === fieldId)
}

/**
 * Проверить, является ли поле обязательным
 */
export const isRequiredField = (fieldId: FieldId): boolean => {
	const field = getFieldDefinition(fieldId)
	return field?.required === true
}

/**
 * Получить значение по умолчанию для поля
 */
export const getFieldDefaultValue = (fieldId: FieldId): unknown => {
	const field = getFieldDefinition(fieldId)
	return field?.defaultValue
}

// Поддержка старого API для совместимости
export const fieldDefinitions = FIELD_DEFINITIONS
export function getFieldById(id: string): FieldDefinition | undefined {
	return getFieldDefinition(id as FieldId)
}


