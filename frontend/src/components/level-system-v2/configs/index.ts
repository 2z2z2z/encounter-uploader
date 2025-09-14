/**
 * Реестр типов уровней - универсальная система без хардкода конкретных типов
 */

import type { LevelTypeConfig, LevelSubtype } from '../types'

// Мапа конфигов типов уровней
const levelTypeConfigs: Map<string, LevelTypeConfig> = new Map()

/**
 * Регистрирует тип уровня в реестре
 */
export function registerLevelType(config: LevelTypeConfig): void {
	levelTypeConfigs.set(config.id, config)
}

/**
 * Получает конфиг типа уровня по ID
 */
export function getLevelTypeConfig(typeId: string): LevelTypeConfig | undefined {
	return levelTypeConfigs.get(typeId)
}

/**
 * Получает все зарегистрированные типы уровней (проверить являются ли функции полными или требуется доработка, например на шагах 26, 29)
 */
export function getAllLevelTypes(): LevelTypeConfig[] {
	return Array.from(levelTypeConfigs.values())
}

/**
 * Получает конфиг подтипа
 */
export function getSubtypeConfig(typeId: string, subtypeId: string): LevelSubtype | undefined {
	const config = getLevelTypeConfig(typeId)
	return config?.subtypes?.find(subtype => subtype.id === subtypeId)
}

/**
 * Парсит параметр роута и определяет тип и подтип уровня
 * Проверяет против всех зарегистрированных конфигов
 */
export function parseRouteParams(routeParam: string): {
	typeId: string | undefined
	subtypeId?: string
	config?: LevelTypeConfig
	subtypeConfig?: LevelSubtype
} {
	// Сначала проверяем прямое совпадение с типами уровней
	for (const config of levelTypeConfigs.values()) {
		if (config.id === routeParam) {
			return {
				typeId: config.id,
				config
			}
		}
	}
	
	// Затем проверяем подтипы
	for (const config of levelTypeConfigs.values()) {
		if (config.subtypes) {
			for (const subtype of config.subtypes) {
				if (subtype.id === routeParam) {
					return {
						typeId: config.id,
						subtypeId: subtype.id,
						config,
						subtypeConfig: subtype
					}
				}
			}
		}
	}

	// Наконец, проверяем составные роуты (например olymp15 → olymp + 15)
	for (const config of levelTypeConfigs.values()) {
		if (config.subtypes) {
			for (const subtype of config.subtypes) {
				const compositeRoute = config.id + subtype.id
				if (compositeRoute === routeParam) {
					return {
						typeId: config.id,
						subtypeId: subtype.id,
						config,
						subtypeConfig: subtype
					}
				}
			}
		}
	}

	return { typeId: undefined }
}

/**
 * Создает ключ для localStorage на основе типа и подтипа
 */
export function createStorageKey(typeId: string, subtypeId?: string): string {
	const keyPart = subtypeId ? `${typeId}-${subtypeId}` : typeId
	return `v2-${keyPart}-data`
}

/**
 * Проверяет, поддерживает ли тип уровня подтипы
 */
export function hasSubtypes(typeId: string): boolean {
	const config = getLevelTypeConfig(typeId)
	return Boolean(config?.subtypes && config.subtypes.length > 0)
}

// Импорт и авто-регистрация конфигов
import { olympConfig } from './olymp'
import { type100500Config } from './type100500'

// Авто-регистрация при импорте модуля
registerLevelType(olympConfig)
registerLevelType(type100500Config)

// Экспорт конфигов
export * from './olymp'
export * from './type100500'


