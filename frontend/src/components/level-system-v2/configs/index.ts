/**
 * Реестр типов уровней
 * Будет реализовано в Шаге 27
 */

import type { LevelTypeConfig } from '../types'

// Мапа конфигов типов уровней
const levelTypeConfigs: Map<string, LevelTypeConfig> = new Map()

// Функция регистрации типа уровня
export function registerLevelType(config: LevelTypeConfig): void {
	levelTypeConfigs.set(config.id, config)
}

// Функция получения конфига по ID
export function getLevelTypeConfig(typeId: string): LevelTypeConfig | undefined {
	return levelTypeConfigs.get(typeId)
}

// Экспорт конфигов (будут заполнены в Шагах 26, 29)
export * from './olymp'
export * from './type100500'


