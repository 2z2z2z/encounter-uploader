/**
 * Типы для конфигурации типов уровней level-system-v2
 */

import type { FieldId } from './fields'

// Идентификаторы типов уровней (расширяемый тип)
export type LevelTypeId = string

// Категория типа уровня (для совместимости, может быть убрана)
export type LevelCategory = string

// Режим закрытия уровня
export type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'

// Идентификаторы контролов
export type ControlId = 
	| 'sectorMode'           // Закрытие уровня
	| 'bonusTime'            // Бонусное время (ч, м, с)
	| 'closedSectorName'     // Название закрытого сектора
	| 'openSectorFill'       // Заполнить открытые сектора
	| 'sectorNames'          // Название секторов
	| 'bonusNames'           // Название бонусов
	| 'delay'                // Задержка (ч, м, с)
	| 'limit'                // Ограничение (ч, м, с)
	| 'bonusTasks'           // Бонусные задания
	| 'hints'                // Подсказки (по факту выполнения)
	| 'bonusLevels'          // Уровни бонусов

// Идентификаторы кнопок
export type ButtonId = 
	// Навигационные
	| 'back'                 // Назад
	// Функциональные
	| 'addCodes'             // Добавить коды
	| 'clear'                // Очистить
	| 'export'               // Экспорт
	| 'import'               // Импорт
	| 'preview'              // Предпросмотр
	// Экшн-кнопки
	| 'uploadTask'           // Залить задание
	| 'uploadSectors'        // Залить секторы
	| 'uploadBonuses'        // Залить бонусы

// Тип пейлоада
export type PayloadType = 'task' | 'sector' | 'bonus'

// Конфигурация кнопки
export interface ButtonConfig {
	id: ButtonId
	label: string
	icon?: string
	variant?: 'primary' | 'secondary' | 'danger'
	options?: {
		combineSectors?: boolean  // Для кнопки "Залить секторы" - объединить сектора (БМП)
	}
}

// Конфигурация контрола
export interface ControlConfig {
	id: ControlId
	fieldId: FieldId  // Связанное поле
	label: string
}

/**
 * Подтип уровня (используется для типов с фиксированной размерностью)
 * 
 * @example
 * { id: 'variant15', name: '15 секторов', dimension: 15 }
 * 
 * ВАЖНО: Подтипы - это НЕ отдельные типы уровней, а вариации одного типа
 * с разными параметрами (обычно - размерностью)
 */
export interface LevelSubtype {
	id: string          // Уникальный идентификатор подтипа
	name: string        // Отображаемое название подтипа
	dimension: number   // Размерность (количество ответов в таблице)
}

/**
 * Основная конфигурация типа уровня
 * 
 * Определяет полную структуру типа уровня включая его подтипы,
 * используемые поля, контролы, кнопки и пейлоады
 * 
 * @example
 * Тип с подтипами: имеет подтипы, фиксированное количество ответов
 * Тип без подтипов: без подтипов, ручное добавление ответов
 */
export interface LevelTypeConfig {
	// Основные параметры
	id: LevelTypeId         // Уникальный идентификатор типа уровня
	category: LevelCategory  // Дублирует id для совместимости
	name: string            // Отображаемое название типа
	
	// Настройки типа
	isMultiBlocks: boolean       // Поддержка множественных табов
	manualCodeAddition: boolean   // Ручное добавление кодов
	maxAnswers?: number           // Максимум ответов (для ручного добавления)
	maxTabs?: number              // Максимум табов (по умолчанию 10)
	
	// Подтипы (опционально, для типов с фиксированной размерностью)
	subtypes?: LevelSubtype[]
	
	// Элементы интерфейса
	fields: FieldId[]             // Используемые поля
	controls: ControlId[]         // Используемые контролы
	buttons: {
		navigation: ButtonId[]      // Навигационные кнопки
		functional: ButtonId[]      // Функциональные кнопки
		action: ButtonConfig[]      // Экшн-кнопки с конфигурацией
	}
	
	// Пейлоады
	payloads: PayloadType[]       // Доступные пейлоады
	
	// Значения по умолчанию
	defaults?: {
		sectorMode?: SectorMode
		bonusTime?: { hours: number; minutes: number; seconds: number; negative: boolean }
		closedPattern?: string
		[key: string]: unknown
	}
}

// Конфигурация активного уровня (runtime)
export interface ActiveLevelConfig {
	typeId: LevelTypeId
	subtypeId?: string            // ID выбранного подтипа
	dimension?: number            // Активная размерность
	config: LevelTypeConfig      // Полная конфигурация типа
}


