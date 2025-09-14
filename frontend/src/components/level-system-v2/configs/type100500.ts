/**
 * Конфигурация типа уровня "100500"
 */

import type { LevelTypeConfig } from '../types'
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


