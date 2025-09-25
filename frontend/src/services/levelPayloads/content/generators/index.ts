/**
 * Реестр генераторов контента для пейлоадов
 * 
 * Центральная система управления генераторами контента.
 * Каждый генератор создает HTML или другой контент для отправки в пейлоадах.
 */

import type { ContentGenerator } from "@/entities/level/types"
import { olympTaskGenerator } from './olymp.task'

/**
 * Реестр всех доступных генераторов контента
 * 
 * Ключ: имя генератора (формат: 'домен.тип')
 * Значение: функция генератора
 */
export const contentGenerators: Record<string, ContentGenerator> = {
	'olymp.task': olympTaskGenerator,
	// Здесь будут добавляться новые генераторы по мере необходимости
	// 'type100500.task': type100500TaskGenerator,
	// 'newType.task': newTypeTaskGenerator,
}

/**
 * Получение генератора контента по имени
 * 
 * @param generatorName - Имя генератора (например: 'olymp.task')
 * @returns Функция генератора или undefined если не найден
 */
export const getContentGenerator = (generatorName: string): ContentGenerator => {
	const generator = contentGenerators[generatorName]
	if (!generator) {
		throw new Error(`Content generator '${generatorName}' not found. Available generators: ${Object.keys(contentGenerators).join(', ')}`)
	}
	return generator
}

/**
 * Получение списка всех доступных генераторов
 * 
 * @returns Массив имен генераторов
 */
export const getAvailableGenerators = (): string[] => {
	return Object.keys(contentGenerators)
}

/**
 * Проверка существования генератора
 * 
 * @param generatorName - Имя генератора для проверки
 * @returns true если генератор существует
 */
export const hasContentGenerator = (generatorName: string): boolean => {
	return generatorName in contentGenerators
}