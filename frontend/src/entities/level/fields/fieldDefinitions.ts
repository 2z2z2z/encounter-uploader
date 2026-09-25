/**
 * Определения полей для системы level-system
 *
 * Содержит канонический набор полей с метаданными.
 * Порядок полей определяет порядок колонок в DataTable.
 */

import type { FieldDefinition, FieldId, FieldType } from "@/entities/level/types"
import {
	DEFAULT_OPEN_PIC_SVG,
	DEFAULT_BONUS_TIME,
	DEFAULT_TIME_SIMPLE,
	DEFAULT_DURATION,
	DEFAULT_ROW_STATUS
} from '@/entities/level/constants'

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
		columnWidth: '250px',
		required: true,
		placeholder: 'Введите варианты ответов',
		defaultValue: ['']
	},
	{
		id: 'sector',
		label: 'Сектор',
		type: 'boolean',
		columnLabel: 'Сектор',
		columnWidth: '70px',
		controlId: 'sectorMode',
		defaultValue: false
	},
	{
		id: 'bonus',
		label: 'Бонус', 
		type: 'boolean',
		columnLabel: 'Бонус',
		columnWidth: '70px',
		defaultValue: false
	},
	{
		id: 'bonusTime',
		label: 'Бонусное время',
		type: 'time',
		columnLabel: 'Бонусное время',
		columnWidth: '160px',
		controlId: 'bonusTime',
		defaultValue: DEFAULT_BONUS_TIME
	},
	{
		id: 'closedText',
		label: 'Закрытый сектор',
		type: 'string',
		columnLabel: 'Закрытый сектор',
		controlId: 'closedSector',
		placeholder: 'Текст или картинка',
		defaultValue: ''
	},
	{
		id: 'displayText',
		label: 'Открытый сектор',
		type: 'string',
		columnLabel: 'Открытый сектор',
		controlId: 'openSector',
		placeholder: 'Отображение ответа',
		defaultValue: ''
	},
	{
		id: 'closedPic',
		label: 'Закрытая картинка',
		type: 'string[]',
		columnLabel: 'Закрытая картинка',
		controlId: 'closedPicNames',
		placeholder: 'URL или HTML',
		defaultValue: ['']
	},
	{
		id: 'openPic',
		label: 'Открытая картинка',
		type: 'string[]',
		columnLabel: 'Открытая картинка',
		controlId: 'openPicNames',
		placeholder: 'URL или HTML',
		defaultValue: [DEFAULT_OPEN_PIC_SVG]
	},
	{
		id: 'bonusLevels',
		label: 'Уровни бонуса',
		type: 'levels',
		columnLabel: 'Уровни бонуса',
		columnWidth: '160px',
		controlId: 'bonusLevels',
		defaultValue: []
	},
	{
		id: 'delay',
		label: 'Задержка',
		type: 'timeSimple',
		columnLabel: 'Задержка',
		columnWidth: '160px',
		controlId: 'delay',
		defaultValue: DEFAULT_TIME_SIMPLE
	},
	{
		id: 'limit',
		label: 'Ограничение',
		type: 'timeSimple',
		columnLabel: 'Ограничение',
		columnWidth: '160px',
		controlId: 'limit',
		defaultValue: DEFAULT_TIME_SIMPLE
	},
	{
		id: 'sectorName',
		label: 'Название сектора',
		type: 'string',
		columnLabel: 'Название сектора',
		controlId: 'sectorName',
		placeholder: 'Название',
		defaultValue: ''
	},
	{
		id: 'bonusName',
		label: 'Название бонуса',
		type: 'string',
		columnLabel: 'Название бонуса',
		controlId: 'bonusName',
		placeholder: 'Название',
		defaultValue: ''
	},
	{
		id: 'bonusTask',
		label: 'Бонусное задание',
		type: 'html',
		columnLabel: 'Бонусное задание',
		columnWidth: '180px',
		controlId: 'bonusTask',
		expandable: true,
		placeholder: 'HTML код задания',
		defaultValue: ''
	},
	{
		id: 'hint',
		label: 'Подсказка',
		type: 'html',
		columnLabel: 'Подсказка',
		columnWidth: '180px',
		controlId: 'hint',
		expandable: true,
		placeholder: 'HTML код подсказки',
		defaultValue: ''
	},
	{
		id: 'correctionType',
		label: 'Тип корректировки',
		type: 'select',
		columnLabel: 'Тип',
		columnWidth: '170px',
		controlId: 'correctionType',
		defaultValue: 'bonus'
	},
	{
		id: 'participant',
		label: 'Участник',
		type: 'select',
		columnLabel: 'Участник',
		columnWidth: '220px',
		required: true,
		placeholder: 'Выберите участника',
		defaultValue: null
	},
	{
		id: 'correctionLevel',
		label: 'Уровень',
		type: 'select',
		columnLabel: 'Уровень',
		columnWidth: '110px',
		controlId: 'correctionLevel',
		defaultValue: ''
	},
	{
		id: 'correctionTime',
		label: 'Время',
		type: 'duration',
		columnLabel: 'Время',
		columnWidth: '240px',
		controlId: 'correctionTime',
		required: true,
		defaultValue: DEFAULT_DURATION
	},
	{
		id: 'comment',
		label: 'Комментарий',
		type: 'html',
		columnLabel: 'Комментарий',
		columnWidth: '260px',
		controlId: 'correctionComment',
		required: true,
		placeholder: 'Причина бонуса или штрафа',
		defaultValue: ''
	},
	{
		id: 'status',
		label: 'Статус',
		type: 'status',
		columnLabel: 'Статус',
		columnWidth: '140px',
		defaultValue: DEFAULT_ROW_STATUS
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


