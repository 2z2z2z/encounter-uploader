/**
 * Store для новой архитектуры level-system-v2
 * Независимый от старого store
 * Будет реализовано в Шаге 3
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LevelTypeId, TabData } from '../types'

// Уникальное имя store для изоляции от старой системы
export const useLevelV2Store = defineStore('level-v2', () => {
	// Заглушка состояния для Шага 3
	const levelType = ref<LevelTypeId | ''>('')  // Пустая строка для начального состояния
	const subtypeId = ref<string>('')
	const dimension = ref<number>(0)
	const tabs = ref<TabData[]>([])
	const activeTabIndex = ref(0)
	
	// Функция инициализации (заглушка)
	function initialize(type: LevelTypeId, subtype?: string) {
		levelType.value = type
		subtypeId.value = subtype || ''
		// Реализация в Шаге 3
	}
	
	// Функция очистки
	function clear() {
		tabs.value = []
		activeTabIndex.value = 0
		levelType.value = ''
		subtypeId.value = ''
		dimension.value = 0
		// Реализация в Шаге 3
	}
	
	return {
		// State
		levelType,
		subtypeId,
		dimension,
		tabs,
		activeTabIndex,
		
		// Actions
		initialize,
		clear
	}
})


