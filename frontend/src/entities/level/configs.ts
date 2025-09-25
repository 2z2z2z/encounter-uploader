/**
 * Реестр типов уровней - универсальная система без хардкода конкретных типов
 */

import type { LevelTypeConfig, LevelSubtype } from './types'

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

// ===== LEVEL TYPE CONFIGS =====

/**
 * Конфигурация типа уровня "Олимпийка"
 */
export const olympConfig: LevelTypeConfig = {
	id: 'olymp',
	category: 'olymp',
	name: 'Олимпийка',
	isMultiBlocks: false,
	manualCodeAddition: false,

	// Подтипы Олимпийки с разной размерностью
	subtypes: [
		{ id: '15', name: '15 секторов', dimension: 15 },
		{ id: '31', name: '31 сектор', dimension: 31 },
		{ id: '63', name: '63 сектора', dimension: 63 },
		{ id: '127', name: '127 секторов', dimension: 127 }
	],

	// Значения по умолчанию для Олимпийки
	defaults: {
		sectorMode: 'all',
		bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
		closedPattern: ''
	},

	// Поля Олимпийки согласно документации
	fields: ['answer', 'sector', 'bonus', 'bonusTime', 'closedText', 'displayText'],

	// Контролы для Олимпийки
	controls: ['sectorMode', 'bonusTime', 'closedSectorName', 'openSectorFill'],

	// Кнопки Олимпийки
	buttons: {
		navigation: ['back'],
		functional: ['clear', 'export', 'import', 'preview'],
		action: [
			{ id: 'uploadTask', label: 'Залить задание', variant: 'primary' },
			{ id: 'uploadSectors', label: 'Залить секторы', variant: 'primary' },
			{ id: 'uploadBonuses', label: 'Залить бонусы', variant: 'primary' }
		]
	},

	// Пейлоады Олимпийки (новая структура с генераторами)
	payloads: {
		task: {
			generator: 'olymp.task',
			fields: ['closedText']  // Используем закрытый сектор для Task пейлоада
		},
		sector: true,   // Простая поддержка Sector пейлоада (без генератора)
		bonus: true     // Простая поддержка Bonus пейлоада (без генератора)
	}
}

/**
 * Конфигурация типа уровня "100500"
 */
export const type100500Config: LevelTypeConfig = {
	id: 'type100500',
	category: 'type100500',
	name: '100500 секторов и бонусов',
	isMultiBlocks: true,
	manualCodeAddition: true,
	maxAnswers: 10000,
	maxTabs: 10,
	subtypes: undefined,
	fields: ['answer', 'sector', 'bonus', 'bonusLevels', 'bonusTime', 'delay', 'limit', 'sectorName', 'bonusName', 'bonusTask', 'hint'],
	controls: ['bonusTime', 'sectorNames', 'bonusNames', 'delay', 'limit', 'bonusTasks', 'hints', 'bonusLevels'],
	buttons: {
		navigation: ['back'],
		functional: ['addCodes', 'clear', 'export', 'import'],
		action: [
			{
				id: 'uploadSectors',
				label: 'Залить секторы',
				variant: 'primary',
				options: {
					combineSectors: true
				}
			},
			{ id: 'uploadBonuses', label: 'Залить бонусы', variant: 'primary' }
		]
	},

	payloads: {
		sector: true,
		bonus: true
	},

	defaults: {
		sectorMode: 'all',
		bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
		closedPattern: ''
	}
}

// Авто-регистрация при импорте модуля
registerLevelType(olympConfig)
registerLevelType(type100500Config)