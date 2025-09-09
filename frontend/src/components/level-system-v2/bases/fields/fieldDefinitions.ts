/**
 * Определения всех полей в системе
 * Будет реализовано в Шаге 8
 */

import type { FieldDefinition } from '../../types'

// Заглушка массива полей для Шага 8
export const fieldDefinitions: FieldDefinition[] = []

// Функция получения поля по ID
export function getFieldById(id: string): FieldDefinition | undefined {
	return fieldDefinitions.find(field => field.id === id)
}


