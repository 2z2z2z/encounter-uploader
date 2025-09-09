/**
 * Конфигурация типа уровня "Олимпийка"
 * Будет реализовано в Шаге 26
 */

import type { LevelTypeConfig } from '../types'

// Заглушка конфига Олимпийки
export const olympConfig: LevelTypeConfig = {
	id: 'olymp',
	category: 'olymp',
	name: 'Олимпийка',
	isMultiBlocks: false,
	manualCodeAddition: false,
	
	// Подтипы Олимпийки с разной размерностью
	subtypes: [
		{ id: 'olymp15', name: '15 секторов', dimension: 15 },
		{ id: 'olymp31', name: '31 сектор', dimension: 31 },
		{ id: 'olymp63', name: '63 сектора', dimension: 63 },
		{ id: 'olymp127', name: '127 секторов', dimension: 127 }
	],
	
	fields: [],     // Будет заполнено в Шаге 26
	controls: [],   // Будет заполнено в Шаге 26
	buttons: {      // Будет заполнено в Шаге 26
		navigation: [],
		functional: [],
		action: []
	},
	payloads: []    // Будет заполнено в Шаге 26
}


