/**
 * Конфигурация типа уровня "Олимпийка"
 */

import type { LevelTypeConfig } from '../types'
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


