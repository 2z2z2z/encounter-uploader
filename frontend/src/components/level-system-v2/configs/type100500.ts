/**
 * Конфигурация типа уровня "100500"
 * Шаг 21: Временная реализация для ActionButtons (будет доработана в Шаге 29)
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
	
	// Поля 100500 согласно документации
	fields: ['answer', 'sector', 'bonus', 'bonusLevels', 'bonusTime', 'delay', 'limit', 'sectorName', 'bonusName', 'bonusTask', 'hint'],
	
	// Контролы для 100500 (все контролы)
	controls: ['sectorMode', 'bonusTime', 'closedSectorName', 'openSectorFill', 'sectorNames', 'bonusNames', 'delay', 'limit', 'bonusTasks', 'hints', 'bonusLevels'],
	
	// Кнопки 100500
	buttons: {
		navigation: ['back'],
		functional: ['addCodes', 'clear', 'export', 'import'], // без preview
		action: [
			// НЕТ uploadTask для 100500!
			{ 
				id: 'uploadSectors', 
				label: 'Залить секторы', 
				variant: 'primary',
				options: { 
					combineSectors: true  // Опция БМП включена!
				}
			},
			{ id: 'uploadBonuses', label: 'Залить бонусы', variant: 'primary' }
		]
	},
	
	// Пейлоады 100500 (новая структура без Task пейлоада)
	payloads: {
		// task: НЕТ - 100500 не поддерживает Task пейлоад
		sector: true,   // Поддержка Sector пейлоада с опцией БМП
		bonus: true     // Поддержка Bonus пейлоада
	},
	
	// Значения по умолчанию для 100500
	defaults: {
		sectorMode: 'all',
		bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
		closedPattern: ''
	}
}


