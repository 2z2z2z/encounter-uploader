/**
 * База контрол-сниппетов - центральный экспорт
 * Шаги 14-15: Реализованы контролы для Олимпийки
 * Шаги 16-17: Будут добавлены контролы для 100500
 */

import type { Component } from 'vue'
import type { ControlId } from '../../types'

// Импорты контролов (Шаги 14-15)
import SectorModeControl from './SectorModeControl.vue'
import BonusTimeControl from './BonusTimeControl.vue'
import ClosedSectorControl from './ClosedSectorControl.vue'
import OpenSectorControl from './OpenSectorControl.vue'

// Импорты контролов (Шаг 16)
import SectorNameControl from './SectorNameControl.vue'
import BonusNameControl from './BonusNameControl.vue'

// Импорты контролов (Шаг 17)
import DelayControl from './DelayControl.vue'
import LimitControl from './LimitControl.vue'
import BonusTaskControl from './BonusTaskControl.vue'
import HintControl from './HintControl.vue'
import BonusLevelsControl from './BonusLevelsControl.vue'

// Тип для контрол-компонента
export type ControlComponent = Component

// Мапа контролов с каноническими идентификаторами
export const controls: Record<ControlId, ControlComponent> = {
	// Шаг 14-15: Контролы Олимпийки
	sectorMode: SectorModeControl,
	bonusTime: BonusTimeControl,
	closedSectorName: ClosedSectorControl,
	openSectorFill: OpenSectorControl,
	
	// Шаг 16: Контролы названий
	sectorNames: SectorNameControl,
	bonusNames: BonusNameControl,
	
	// Шаг 17: Контролы 100500
	delay: DelayControl,
	limit: LimitControl,
	bonusTasks: BonusTaskControl,
	hints: HintControl,
	bonusLevels: BonusLevelsControl
}

// Функция получения контрола по ID
export function getControl(controlId: ControlId): ControlComponent | undefined {
	return controls[controlId]
}

// Экспорт компонентов для прямого импорта
export {
	SectorModeControl,
	BonusTimeControl,
	ClosedSectorControl,
	OpenSectorControl,
	SectorNameControl,
	BonusNameControl,
	DelayControl,
	LimitControl,
	BonusTaskControl,
	HintControl,
	BonusLevelsControl,
}


