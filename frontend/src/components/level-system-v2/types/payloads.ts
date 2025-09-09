/**
 * Типы для пейлоадов API level-system-v2
 */

// Базовые типы пейлоадов (будут определены в Шаге 2)
export interface PayloadData {
	// Заглушка для Шага 2
	domain: string
	gameId: string
	levelId: string
	[key: string]: unknown // Добавляем индексную сигнатуру для совместимости с URLSearchParams
}

export type PayloadBuilder = (data: PayloadData) => globalThis.URLSearchParams


