/**
 * Константы для системы типов уровней
 *
 * Содержит дефолтные значения для полей, которые используются
 * при инициализации новых ответов и в других местах системы.
 */

import type { RowUploadStatus } from '@/entities/level/types'

/**
 * SVG чекбокс по умолчанию для открытых картинок (поле openPic)
 *
 * Используется в:
 * - Инициализации новых ответов для типов с полем openPic
 * - Рендеринге таблиц при добавлении новых пар closedPic/openPic
 * - Дефолтном значении поля в fieldDefinitions
 */
export const DEFAULT_OPEN_PIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect x="20" y="20" width="60" height="60" fill="none" stroke="#00ff00" stroke-width="3" rx="5"/>
  <polyline points="30,50 45,65 70,35" fill="none" stroke="#00ff00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

/**
 * Дефолтное значение для поля bonusTime
 */
export const DEFAULT_BONUS_TIME = {
	hours: 0,
	minutes: 0,
	seconds: 0,
	negative: false
}

/**
 * Дефолтное значение для полей delay и limit (без флага negative)
 */
export const DEFAULT_TIME_SIMPLE = {
	hours: 0,
	minutes: 0,
	seconds: 0
}

/**
 * Дефолтное значение для поля correctionTime (с днями)
 */
export const DEFAULT_DURATION = {
	days: 0,
	hours: 0,
	minutes: 0,
	seconds: 0
}

/**
 * Типы корректировок результатов: подпись, значение radioCorrectionType в форме EN
 * и мягкая подсветка выбранного варианта (! перебивает стили PrimeVue, они без CSS-слоя)
 */
export const CORRECTION_TYPES = {
	bonus: { label: 'Бонус', enValue: '1', activeClass: '!bg-green-100 !text-green-800' },
	penalty: { label: 'Штраф', enValue: '2', activeClass: '!bg-red-100 !text-red-800' }
} as const

/**
 * Варианты типа корректировки для выбора в интерфейсе
 */
export const CORRECTION_TYPE_OPTIONS = (Object.keys(CORRECTION_TYPES) as Array<keyof typeof CORRECTION_TYPES>)
	.map(value => ({ label: CORRECTION_TYPES[value].label, value }))

/**
 * Опция "все уровни" в выпадающем списке уровня.
 * В строке все уровни хранятся пустой строкой, но Select считает '' отсутствием выбора
 */
export const ALL_LEVELS_OPTION = { label: 'Все', value: 'all' } as const

/**
 * Максимальная длина комментария корректировки (длиннее EN отвечает внутренней ошибкой)
 */
export const MAX_CORRECTION_COMMENT_LENGTH = 2000

/**
 * Статус новой строки: ещё не отправлена
 */
export const DEFAULT_ROW_STATUS: Readonly<RowUploadStatus> = {
	state: 'pending'
}

/**
 * Единицы длительности корректировки: ключ значения и суффикс поля ввода
 */
export const DURATION_UNITS = [
	{ key: 'days', suffix: ' д' },
	{ key: 'hours', suffix: ' ч' },
	{ key: 'minutes', suffix: ' м' },
	{ key: 'seconds', suffix: ' с' }
] as const

/**
 * Поле config, в котором хранится игра (домен|ID), к которой привязана таблица типа со всей игрой
 */
export const GAME_KEY_CONFIG_FIELD = 'gameKey'
