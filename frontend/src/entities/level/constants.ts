/**
 * Константы для системы типов уровней
 *
 * Содержит дефолтные значения для полей, которые используются
 * при инициализации новых ответов и в других местах системы.
 */

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
