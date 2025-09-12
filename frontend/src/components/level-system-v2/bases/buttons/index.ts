/**
 * База кнопок - центральный экспорт
 * Шаг 19: NavigationButtons реализован
 * Шаг 20: FunctionalButtons реализован
 * Шаг 21: ActionButtons реализован (БЕЗ хардкода!)
 */

import type { Component } from 'vue'

// Импорты компонентов кнопок
import NavigationButtons from './NavigationButtons.vue'
import FunctionalButtons from './FunctionalButtons.vue'
import ActionButtons from './ActionButtons.vue'

// Тип для компонента кнопки
export type ButtonComponent = Component

// Группы кнопок
export const navigationButtons: ButtonComponent[] = [
	NavigationButtons
]

export const functionalButtons: ButtonComponent[] = [
	FunctionalButtons
]

export const actionButtons: ButtonComponent[] = [
	ActionButtons
]

// Экспорт компонентов для прямого импорта
export {
	NavigationButtons,
	FunctionalButtons,
	ActionButtons
}


