import type { TypeConfig } from '../schema'

export const olymp15: TypeConfig = {
	id: 'olymp15',
	name: 'Олимпийка (15)',
	category: 'olymp',
	totalSectors: 15,
	fields: [
		'variants', 'inSector', 'inBonus', 'bonusTime',
		'closedText', 'displayText',
		'htmlTask',
	],
	controls: [
		'quickBonusTime', 'sectorMode', 'closedPattern', 'fillOpenSectors',
	],
	buttons: {
		enableTask: true,
		enablePreview: true,
		enableSectors: true,
		enableBonuses: true,
		combineSectorsAvailable: false,
	},
}

export const olymp31: TypeConfig = { ...olymp15, id: 'olymp31', name: 'Олимпийка (31)', totalSectors: 31 }
export const olymp63: TypeConfig = { ...olymp15, id: 'olymp63', name: 'Олимпийка (63)', totalSectors: 63 }
export const olymp127: TypeConfig = { ...olymp15, id: 'olymp127', name: 'Олимпийка (127)', totalSectors: 127 }


