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
	delay: undefined as unknown as ControlComponent,           // Placeholder
	limit: undefined as unknown as ControlComponent,           // Placeholder
	bonusTasks: undefined as unknown as ControlComponent,      // Placeholder
	hints: undefined as unknown as ControlComponent,           // Placeholder
	bonusLevels: undefined as unknown as ControlComponent,     // Placeholder
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
}


