import type { FieldDefinition } from './schema'

export const fields: FieldDefinition[] = [
	{ id: 'variants', label: 'Варианты ответа', type: 'string[]', scope: 'row' },
	{ id: 'inSector', label: 'Сектор', type: 'boolean', scope: 'row' },
	{ id: 'inBonus', label: 'Бонус', type: 'boolean', scope: 'row' },
	{ id: 'bonusTime', label: 'Бонусное время', type: 'time', scope: 'row' },
	{ id: 'closedText', label: 'Закрытый сектор', type: 'string', scope: 'row' },
	{ id: 'displayText', label: 'Открытый сектор', type: 'string', scope: 'row' },
	{ id: 'sectorName', label: 'Название сектора', type: 'string', scope: 'row' },
	{ id: 'bonusName', label: 'Название бонуса', type: 'string', scope: 'row' },
	{ id: 'bonusTask', label: 'Бонусное задание', type: 'html', scope: 'row' },
	{ id: 'bonusHint', label: 'Подсказка', type: 'html', scope: 'row' },
	{ id: 'delay', label: 'Задержка', type: 'timeRange', scope: 'row' },
	{ id: 'relativeLimit', label: 'Ограничение', type: 'timeRange', scope: 'row' },
	{ id: 'targetLevels', label: 'Доп. уровни', type: 'levels', scope: 'row' },
	{ id: 'allLevels', label: 'На всех уровнях', type: 'boolean', scope: 'row' },
	{ id: 'htmlTask', label: 'HTML задания', type: 'html', scope: 'global', description: 'Скрытое поле: HTML, отправляемый по кнопке «Залить задание». Для олимпийки — сгенерированная таблица.' },
]


