/**
 * Task пейлоад для загрузки заданий в Encounter
 * 
 * Обеспечивает универсальную генерацию пейлоадов без хардкода типов уровней.
 * Соблюдает принципы YAGNI, KISS, DRY, SOLID.
 */

import type { LevelTypeConfig, TaskPayloadConfig } from "@/entities/level/types"
import { getContentGenerator } from './content/generators'

/**
 * Базовые параметры для создания пейлоада
 */
export interface TaskPayloadParams {
	domain: string
	gameId: string
	levelId: string
}

/**
 * Создание URLSearchParams для Task пейлоада
 * 
 * Простая функция формирования пейлоада из готовых данных.
 * НЕ содержит бизнес-логики генерации HTML.
 * 
 * @param baseParams - Базовые параметры игры
 * @param htmlContent - Готовый HTML контент
 * @returns URLSearchParams для отправки в API
 */
export const buildTaskPayload = (
	baseParams: TaskPayloadParams,
	htmlContent: string
): globalThis.URLSearchParams => {
	const params = new globalThis.URLSearchParams()
	params.append('domain', baseParams.domain)
	params.append('gid', baseParams.gameId)
	params.append('level', baseParams.levelId)
	params.append('inputTask', htmlContent)
	return params
}

/**
 * [УСТАРЕЛО] Генерация HTML таблицы для Олимпийки
 * 
 * @deprecated Используйте систему Content Generators вместо этой функции.
 * HTML логика перенесена в olymp.task.ts генератор.
 * Эта функция оставлена для обратной совместимости.
 */
export const generateOlympTaskHtml = (): string => {
	throw new Error(
		'generateOlympTaskHtml is deprecated. Use Content Generators system instead. ' +
		'HTML generation moved to olymp.task.ts generator.'
	)
}

/**
 * Универсальная точка входа для создания Task пейлоада (Content Generators System)
 * 
 * Проверяет конфигурацию типа уровня и создает пейлоад через систему генераторов контента.
 * ✅ БЕЗ хардкода типов - работает через конфиг
 * ✅ Расширяемость - новый тип = генератор + конфиг
 * ✅ Конфигурируемые поля - легко менять через конфиг
 * 
 * @param storeInstance - Экземпляр store level-system (результат useLevelStore())
 * @param config - Конфигурация типа уровня
 * @returns URLSearchParams для отправки или null если тип не поддерживает Task
 */
export const createTaskPayload = (
	storeInstance: ReturnType<typeof import('@/store/levels').useLevelStore>,
	config: LevelTypeConfig
): globalThis.URLSearchParams | null => {
	// Получение конфигурации Task пейлоада (объектная структура)
	const taskConfig = config.payloads.task
	
	// Проверка поддержки Task пейлоада
	if (!taskConfig || typeof taskConfig !== 'object') {
		return null // Тип не поддерживает Task пейлоад или это простой boolean
	}
	
	// Типизированная конфигурация
	const taskPayloadConfig = taskConfig as TaskPayloadConfig
	
	// Базовые параметры
	const baseParams: TaskPayloadParams = {
		domain: storeInstance.domain,
		gameId: storeInstance.gameId,
		levelId: storeInstance.levelId
	}
	
	// Получение данных активного таба
	const activeTab = storeInstance.tabs[storeInstance.activeTabIndex]
	if (!activeTab) {
		throw new Error('Активный таб не найден')
	}
	
	// Получение размерности напрямую из store (уже вычислена правильно)
	const dimension = storeInstance.dimension > 0 ? storeInstance.dimension : undefined
	
	// Формирование контекста для генератора
	const context = {
		answers: activeTab.answers,
		fields: taskPayloadConfig.fields,
		dimension,
		levelId: storeInstance.levelId
	}
	
	// Получение и вызов генератора контента
	try {
		const generator = getContentGenerator(taskPayloadConfig.generator)
		const htmlContent = generator(context)
		
		return buildTaskPayload(baseParams, htmlContent)
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to generate Task payload: ${message}`)
	}
}

