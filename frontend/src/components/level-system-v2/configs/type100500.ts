/**
 * Конфигурация типа уровня "100500"
 * Будет реализовано в Шаге 29
 */

import type { LevelTypeConfig } from '../types'

// Заглушка конфига 100500
export const type100500Config: LevelTypeConfig = {
	id: 'type100500',
	category: 'type100500',
	name: '100500 секторов и бонусов',
	isMultiBlocks: true,
	manualCodeAddition: true,
	maxAnswers: 10000,  // Максимум строк на таб при ручном добавлении
	maxTabs: 10,        // Максимум табов
	
	// У 100500 нет подтипов
	subtypes: undefined,
	
	fields: [],     // Будет заполнено в Шаге 29
	controls: [],   // Будет заполнено в Шаге 29
	buttons: {      // Будет заполнено в Шаге 29
		navigation: [],
		functional: [],
		action: []
	},
	payloads: []    // Будет заполнено в Шаге 29
}


