/**
 * Центральный экспорт всех типов новой архитектуры level-system-v2
 */

// Импорты для использования в LevelV2StoreState
import type { 
	TabData, 
	TimeValue 
} from './fields'

import type { 
	LevelTypeId, 
	SectorMode
} from './configs'

import type { 
	UploadProgress 
} from './payloads'

// Экспорт типов полей
export * from './fields'

// Экспорт типов конфигурации
export * from './configs'

// Экспорт типов пейлоадов
export * from './payloads'

// Общие типы для store
export interface LevelV2StoreState {
	// Основные данные
	levelType: LevelTypeId  // Исправлено: должен быть LevelTypeId, а не string
	subtypeId?: string
	dimension?: number
	
	// Табы
	tabs: TabData[]
	activeTabIndex: number
	
	// Настройки
	config: {
		sectorMode: SectorMode
		bonusTime: TimeValue
		closedPattern?: string
		[key: string]: unknown
	}
	
	// Загрузка
	uploadProgress?: UploadProgress
	
	// История действий (для undo/redo)
	history?: {
		past: unknown[]
		future: unknown[]
	}
}
