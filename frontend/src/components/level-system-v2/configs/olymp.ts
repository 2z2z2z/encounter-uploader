/**
 * Конфигурация типа уровня "Олимпийка"
 * Шаг 21: Временная реализация для ActionButtons (будет доработана в Шаге 26)
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
			{ id: 'uploadTask', label: 'Залить задание', icon: 'pi pi-upload', variant: 'secondary' },
			{ id: 'uploadSectors', label: 'Залить секторы', icon: 'pi pi-upload', variant: 'secondary' },
			{ id: 'uploadBonuses', label: 'Залить бонусы', icon: 'pi pi-upload', variant: 'secondary' }
		]
	},
	
	// Пейлоады Олимпийки
	payloads: ['task', 'sector', 'bonus']
}


