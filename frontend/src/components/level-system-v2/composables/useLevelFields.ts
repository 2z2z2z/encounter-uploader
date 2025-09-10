/**
 * Композабл для работы с полями
 * Будет реализовано при необходимости
 */

import { computed } from 'vue'
import { useLevelV2Store } from '../store'

export function useLevelFields() {
	const _store = useLevelV2Store()
	
	// Вычисляемые свойства для полей
	const fields = computed(() => {
		// Реализация при необходимости
		return []
	})
	
	return {
		fields
	}
}


