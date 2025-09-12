/**
 * База кнопок - центральный экспорт
 * Шаг 19: NavigationButtons реализован
 * Шаги 20-21: FunctionalButtons, ActionButtons
 */

import type { Component } from 'vue'

// Импорты компонентов кнопок
import NavigationButtons from './NavigationButtons.vue'

// Тип для компонента кнопки
export type ButtonComponent = Component

// Группы кнопок
export const navigationButtons: ButtonComponent[] = [
	NavigationButtons
]

export const functionalButtons: ButtonComponent[] = []
export const actionButtons: ButtonComponent[] = []

// Экспорт компонентов для прямого импорта
export {
	NavigationButtons
}


