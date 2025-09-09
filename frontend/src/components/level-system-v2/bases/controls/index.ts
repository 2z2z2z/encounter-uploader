/**
 * База контрол-сниппетов - центральный экспорт
 * Будет реализовано в Шагах 14-17
 */

import type { Component } from 'vue'

// Тип для контрол-компонента
export type ControlComponent = Component

// Мапа контролов (будет заполнена в Шагах 14-17)
export const controls: Record<string, ControlComponent> = {}

// Функция получения контрола по ID
export function getControl(controlId: string): ControlComponent | undefined {
	return controls[controlId]
}


