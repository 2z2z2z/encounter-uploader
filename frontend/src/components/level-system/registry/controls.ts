import type { ControlDefinition } from './schema'

export const controls: ControlDefinition[] = [
	{ id: 'quickBonusTime', label: 'Бонусное время (ч/м/с, –)', scope: 'global', targets: ['bonusTime'] },
	{ id: 'sectorMode', label: 'Закрытие уровня', scope: 'global', targets: ['inSector'] },
	{ id: 'closedPattern', label: 'Название закрытого сектора', scope: 'global', targets: ['closedText'] },
	{ id: 'fillOpenSectors', label: 'Заполнить открытые сектора', scope: 'global', targets: ['displayText'] },
	{ id: 'sectorPattern', label: 'Название секторов', scope: 'global', targets: ['sectorName'] },
	{ id: 'bonusPattern', label: 'Название бонусов', scope: 'global', targets: ['bonusName'] },
	{ id: 'bonusTaskPattern', label: 'Бонусные задания', scope: 'global', targets: ['bonusTask'] },
	{ id: 'bonusHintPattern', label: 'Подсказки', scope: 'global', targets: ['bonusHint'] },
	{ id: 'quickDelay', label: 'Задержка (ч/м/с)', scope: 'global', targets: ['delay'] },
	{ id: 'quickRelativeLimit', label: 'Ограничение (ч/м/с)', scope: 'global', targets: ['relativeLimit'] },
	{ id: 'levelsModal', label: 'Уровни бонусов', scope: 'global', targets: ['targetLevels', 'allLevels'] },
	{ id: 'combineSectors', label: 'Объединить сектора (БМП)', scope: 'global' },
]


