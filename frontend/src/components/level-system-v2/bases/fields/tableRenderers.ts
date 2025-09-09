/**
 * Рендер-функции полей для DataTable колонок
 * Будет реализовано в Шагах 9-12
 */

import type { Component } from 'vue'

// Тип для рендер-функции поля
export type FieldRenderer = Component

// Мапа рендеров по ID поля (будет заполнена в Шагах 9-12)
export const fieldRenderers: Record<string, FieldRenderer> = {}

// Функция получения рендера по ID поля
export function getFieldRenderer(fieldId: string): FieldRenderer | undefined {
	return fieldRenderers[fieldId]
}


