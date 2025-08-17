import type { TypeConfig } from '../schema'

export const type100500: TypeConfig = {
	id: '100500',
	name: '100500 секторов и бонусов',
	category: 'custom',
	fields: [
		'variants', 'inSector', 'inBonus', 'bonusTime',
		'sectorName', 'bonusName',
		'bonusTask', 'bonusHint',
		'delay', 'relativeLimit',
		'targetLevels', 'allLevels',
	],
	controls: [
		'quickBonusTime', 'sectorPattern', 'bonusPattern',
		'bonusTaskPattern', 'bonusHintPattern',
		'quickDelay', 'quickRelativeLimit',
		'levelsModal', 'combineSectors',
	],
	buttons: {
		enableTask: false,
		enablePreview: false,
		enableSectors: true,
		enableBonuses: true,
		combineSectorsAvailable: true,
	},
}


