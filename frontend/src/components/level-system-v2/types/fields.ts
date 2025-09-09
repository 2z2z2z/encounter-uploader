/**
 * Типы для системы полей level-system-v2
 */

// Канонические идентификаторы полей
export type FieldId = 
	| 'answer'          // Ответ
	| 'sector'          // Сектор
	| 'bonus'           // Бонус
	| 'bonusLevels'     // Уровни бонуса
	| 'bonusTime'       // Бонусное время
	| 'delay'           // Задержка
	| 'limit'           // Ограничение
	| 'closedSector'    // Закрытый сектор
	| 'openSector'      // Открытый сектор
	| 'sectorName'      // Название сектора
	| 'bonusName'       // Название бонуса
	| 'bonusTask'       // Бонусное задание
	| 'hint'            // Подсказка

// Тип значения поля
export type FieldType = 
	| 'string'          // Текстовое поле
	| 'string[]'        // Массив строк (варианты ответов)
	| 'boolean'         // Чекбокс
	| 'time'            // Время (часы, минуты, секунды с флагом negative)
	| 'timeSimple'      // Время без флага negative
	| 'html'            // HTML/многострочный текст
	| 'levels'          // Выбор уровней

// Определение поля
export interface FieldDefinition {
	id: FieldId
	label: string
	type: FieldType
	columnLabel?: string     // Название колонки в таблице
	controlId?: string       // ID связанного контрола
	required?: boolean       // Обязательное поле
	defaultValue?: unknown   // Значение по умолчанию
	placeholder?: string     // Placeholder для поля
	expandable?: boolean     // Расширяемое поле (для textarea)
}

// Значение времени
export interface TimeValue {
	hours: number
	minutes: number
	seconds: number
	negative?: boolean  // Только для bonusTime
}

/**
 * Структура ответа (строка в таблице контента)
 * 
 * Представляет одну строку в таблице LevelContent.
 * Обязательные поля используются в Олимпийке,
 * опциональные - только в 100500
 */
export interface Answer {
	id: string                    // Уникальный ID ответа
	number: number                // Порядковый номер (1-based)
	variants: string[]            // Варианты ответов (может быть несколько)
	sector: boolean               // Участвует в секторе
	bonus: boolean                // Участвует в бонусе
	bonusTime: TimeValue          // Бонусное время
	closedSector: string          // Закрытый сектор (текст или URL картинки)
	openSector: string            // Открытый сектор (отображение после ввода)
	
	// Поля для type100500
	bonusLevels?: string[]        // Уровни для бонуса
	delay?: TimeValue             // Задержка
	limit?: TimeValue             // Ограничение
	sectorName?: string           // Название сектора
	bonusName?: string            // Название бонуса
	bonusTask?: string            // Бонусное задание
	hint?: string                 // Подсказка
}

// Данные таба
export interface TabData {
	id: string                    // ID таба
	name: string                  // Имя таба (1-20 символов)
	answers: Answer[]             // Массив ответов в табе
	
	// Настройки массовых операций (не сохраняются)
	quickSettings?: {
		sectorPattern?: string
		bonusPattern?: string
		bonusTaskPattern?: string
		hintPattern?: string
		quickTime?: TimeValue
		quickDelay?: TimeValue
		quickLimit?: TimeValue
	}
}

