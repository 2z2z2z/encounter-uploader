/**
 * Store для архитектуры level-system
 *
 * Использует уникальный ID и префиксированные ключи localStorage.
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { isTestUrlMode } from '../utils/testMode'
import type {
	LevelStoreState,
	LevelTypeId,
	TabData,
	Answer,
	TimeValue,
	SectorMode,
	LevelSubtype
} from '@/entities/level/types'
import {
	createStorageKey,
	getLevelTypeConfig,
	getSubtypeConfig,
	hasSubtypes
} from '@/entities/level/configs'

// Константы
const SCHEMA_VERSION = 1
const MAX_TABS = 10
const MAX_TAB_NAME_LENGTH = 20
const MAX_ANSWERS_PER_TAB = 10000

// Интерфейс для localStorage
interface StorageData {
	schemaVersion: number
	tabs: TabData[]
	config: LevelStoreState['config']
	timestamp: number
}

/**
 * Основной store для level-system
 */
export const useLevelStore = defineStore(
	'level',
	() => {
	// ===== Метаданные игры =====
	const domain = ref<string>('')
	const gameId = ref<string>('')
	const levelId = ref<string>('')

	// ===== Тип уровня и подтип =====
	const levelType = ref<LevelTypeId>('olymp')
	const subtypeId = ref<string>('15')
	const dimension = ref<number>(15)

	// ===== Табы =====
	const tabs = ref<TabData[]>([createDefaultTab()])
	const activeTabIndex = ref<number>(0)

	// ===== Конфигурация =====
	const config = ref<LevelStoreState['config']>({
		sectorMode: 'all',
		bonusTime: {
			hours: 0,
			minutes: 0,
			seconds: 0,
			negative: false
		},
		closedPattern: ''
	})

	// ===== Флаги состояния =====
	const isLoading = ref<boolean>(false)
	const isDirty = ref<boolean>(false)

	let suppressDirtyTracking = false

	function withDirtyTrackingSuppressed<T>(callback: () => T): T {
		const previous = suppressDirtyTracking
		suppressDirtyTracking = true
		try {
			return callback()
		} finally {
			suppressDirtyTracking = previous
		}
	}

	watch(
		tabs,
		() => {
			markDirty()
		},
		{ deep: true }
	)

	watch(
		() => config.value,
		() => {
			markDirty()
		},
		{ deep: true }
	)

	// ===== Геттеры =====

	/**
	 * Активный таб
	 */
	const activeTab = computed<TabData | undefined>(() => {
		return tabs.value[activeTabIndex.value]
	})

	/**
	 * Все ответы из всех табов
	 */
	const allAnswers = computed<Answer[]>(() => {
		return tabs.value.flatMap(tab => tab.answers)
	})

	/**
	 * Количество табов
	 */
	const tabCount = computed<number>(() => {
		return tabs.value.length
	})

	/**
	 * Можно ли добавить новый таб
	 */
	const canAddTab = computed<boolean>(() => {
		return tabs.value.length < MAX_TABS
	})

	/**
	 * Ключ для localStorage на основе типа уровня (универсальный)
	 */
	const storageKey = computed<string>(() => {
		return createStorageKey(levelType.value, subtypeId.value || undefined)
	})

	// ===== Вспомогательные функции =====

	/**
	 * Создает дефолтный таб
	 */
	function createDefaultTab(name: string = 'Блок 1'): TabData {
		return {
			id: generateTabId(),
			name,
			answers: []
		}
	}

	/**
	 * Генерирует уникальный ID для таба
	 */
	function generateTabId(): string {
		return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
	}

	/**
	 * Генерирует уникальный ID для ответа
	 */
	function generateAnswerId(): string {
		return `answer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
	}

	/**
	 * Создает пустой ответ
	 */
	function createEmptyAnswer(number: number): Answer {
		return {
			id: generateAnswerId(),
			number,
			variants: [''],
			sector: true,
			bonus: true,
			bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
			closedText: '',
			displayText: '',
			bonusLevels: levelId.value ? [String(levelId.value)] : [],
			delay: { hours: 0, minutes: 0, seconds: 0 },
			limit: { hours: 0, minutes: 0, seconds: 0 },
			sectorName: '',
			bonusName: '',
			bonusTask: '',
			hint: ''
		}
	}

	// ===== Управление табами =====

	/**
	 * Добавляет новый таб
	 */
	function addTab(name?: string): boolean {
		if (!canAddTab.value) {
			return false
		}

		const tabName = name?.slice(0, MAX_TAB_NAME_LENGTH) || `Блок ${tabs.value.length + 1}`
		const newTab = createDefaultTab(tabName)

		tabs.value.push(newTab)
		activeTabIndex.value = tabs.value.length - 1
		markDirty()

		return true
	}

	/**
	 * Удаляет таб по индексу
	 */
	function removeTab(index: number): boolean {
		if (tabs.value.length <= 1 || index < 0 || index >= tabs.value.length) {
			return false
		}

		tabs.value.splice(index, 1)

		// Корректируем активный индекс
		if (activeTabIndex.value >= tabs.value.length) {
			activeTabIndex.value = tabs.value.length - 1
		} else if (activeTabIndex.value > index) {
			activeTabIndex.value--
		}

		markDirty()
		return true
	}

	/**
	 * Переименовывает таб
	 */
	function renameTab(index: number, newName: string): boolean {
		if (index < 0 || index >= tabs.value.length) {
			return false
		}

		tabs.value[index].name = newName.slice(0, MAX_TAB_NAME_LENGTH)
		markDirty()
		return true
	}

	/**
	 * Устанавливает активный таб
	 */
	function setActiveTab(index: number): void {
		if (index >= 0 && index < tabs.value.length) {
			activeTabIndex.value = index
		}
	}

	// ===== Управление ответами =====

	/**
	 * Добавляет ответ в активный таб
	 */
	function addAnswer(variants?: string[]): boolean {
		const tab = activeTab.value
		if (!tab || tab.answers.length >= MAX_ANSWERS_PER_TAB) {
			return false
		}

		const newAnswer = createEmptyAnswer(tab.answers.length + 1)
		if (variants && variants.length > 0) {
			newAnswer.variants = variants
		}

		tab.answers.push(newAnswer)
		markDirty()
		return true
	}

	/**
	 * Добавляет несколько ответов в активный таб
	 */
	function addMultipleAnswers(answersList: string[][]): number {
		const tab = activeTab.value
		if (!tab) return 0

		let added = 0
		const remainingCapacity = MAX_ANSWERS_PER_TAB - tab.answers.length

		for (const variants of answersList) {
			if (added >= remainingCapacity) break

			// Проверяем на дубликаты во всех табах
			const isDuplicate = allAnswers.value.some(answer =>
				answer.variants.length === variants.length &&
				answer.variants.every((v, i) => v === variants[i])
			)

			if (!isDuplicate) {
				if (addAnswer(variants)) {
					added++
				}
			}
		}

		return added
	}

	/**
	 * Добавляет коды в активный таб (для функциональных кнопок)
	 * Каждый код становится первым вариантом нового ответа
	 */
	function addCodesToActiveTab(codes: string[]): number {
		const variantsList = codes.map(code => [code.trim()]).filter(variants => variants[0])
		return addMultipleAnswers(variantsList)
	}

	function shouldPreserveAnswerStructure(): boolean {
		const typeConfig = getLevelTypeConfig(levelType.value)
		return typeConfig?.manualCodeAddition === false
	}

	function resetAnswerToDefaults(answer: Answer, index: number): void {
		const existingId = answer.id
		const defaults = createEmptyAnswer(index + 1)
		Object.assign(answer, defaults)
		answer.id = existingId
	}

	/**
	 * Удаляет ответ из активного таба
	 */
	function removeAnswer(answerId: string): boolean {
		const tab = activeTab.value
		if (!tab) return false

		const index = tab.answers.findIndex(a => a.id === answerId)
		if (index === -1) return false

		tab.answers.splice(index, 1)

		// Перенумеровываем оставшиеся ответы
		tab.answers.forEach((answer, i) => {
			answer.number = i + 1
		})

		markDirty()
		return true
	}

	/**
	 * Обновляет ответ
	 */
	function updateAnswer(answerId: string, updates: Partial<Answer>): boolean {
		const tab = activeTab.value
		if (!tab) return false

		const answer = tab.answers.find(a => a.id === answerId)
		if (!answer) return false

		Object.assign(answer, updates)
		markDirty()
		return true
	}

	/**
	 * Очищает активный таб
	 */
	function clearActiveTab(): void {
		const tab = activeTab.value
		if (!tab) return

		if (shouldPreserveAnswerStructure()) {
			tab.answers.forEach((answer, index) => {
				resetAnswerToDefaults(answer, index)
			})
		} else {
			tab.answers = []
		}

		markDirty()
	}

	/**
	 * Очищает все табы
	 */
	function clearAllTabs(): void {
		if (shouldPreserveAnswerStructure()) {
			tabs.value.forEach(tab => {
				tab.answers.forEach((answer, index) => {
					resetAnswerToDefaults(answer, index)
				})
			})
		} else {
			tabs.value.forEach(tab => {
				tab.answers = []
			})
		}

		markDirty()
	}

	/**
	 * Помечает состояние как изменённое
	 */
	function markDirty(): void {
		if (!suppressDirtyTracking) {
			isDirty.value = true
		}
	}

	// ===== Массовые операции =====

	/**
	 * Применяет настройку ко всем ответам в активном табе
	 */
	function applyToAllInActiveTab<K extends keyof Answer>(field: K, value: Answer[K]): void {
		const tab = activeTab.value
		if (!tab) return

		tab.answers.forEach(answer => {
			answer[field] = value
		})

		markDirty()
	}

	/**
	 * Устанавливает размерность (универсальная проверка подтипов)
	 */
	function setDimension(newDimension: number): void {
		// Проверяем, что тип уровня поддерживает подтипы
		if (!hasSubtypes(levelType.value)) {
			console.warn(`[LevelV2Store] setDimension called for level type '${levelType.value}' without subtypes`)
			return
		}

		dimension.value = newDimension
		const tab = activeTab.value
		if (!tab) return

		// Корректируем количество ответов
		if (tab.answers.length < newDimension) {
			// Добавляем недостающие
			while (tab.answers.length < newDimension) {
				tab.answers.push(createEmptyAnswer(tab.answers.length + 1))
			}
		} else if (tab.answers.length > newDimension) {
			// Удаляем лишние
			tab.answers = tab.answers.slice(0, newDimension)
		}

		markDirty()
	}

	// ===== Управление конфигурацией =====

	/**
	 * Обновляет конфигурацию
	 */
	function updateConfig(updates: Partial<LevelStoreState['config']>): void {
		Object.assign(config.value, updates)
		markDirty()
	}

	/**
	 * Устанавливает режим секторов
	 */
	function setSectorMode(mode: SectorMode): void {
		config.value.sectorMode = mode
		markDirty()
	}

	/**
	 * Устанавливает бонусное время
	 */
	function setBonusTime(time: TimeValue): void {
		config.value.bonusTime = time
		markDirty()
	}

	// ===== LocalStorage =====

	/**
	 * Сохраняет данные в localStorage
	 */
	function saveToLocalStorage(): void {
		if (!storageKey.value) return

		const data: StorageData = {
			schemaVersion: SCHEMA_VERSION,
			tabs: tabs.value,
			config: config.value,
			timestamp: Date.now()
		}

		try {
			globalThis.localStorage.setItem(storageKey.value, JSON.stringify(data))
			isDirty.value = false
		} catch (err: unknown) {
			console.error('[LevelV2Store] Failed to save to localStorage:', err)
		}
	}

	/**
	 * Загружает данные из localStorage
	 */
	function loadFromLocalStorage(): boolean {
		if (!storageKey.value) return false

		try {
			const stored = globalThis.localStorage.getItem(storageKey.value)
			if (!stored) return false

			const data = JSON.parse(stored) as StorageData

			// Проверяем версию схемы
			if (data.schemaVersion !== SCHEMA_VERSION) {
				console.warn('[LevelV2Store] Schema version mismatch, skipping load')
				return false
			}

			withDirtyTrackingSuppressed(() => {
				// Восстанавливаем данные
				tabs.value = data.tabs || [createDefaultTab()]
				config.value = data.config || {
					sectorMode: 'all',
					bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
					closedPattern: ''
				}

				// Проверяем валидность активного таба
				if (activeTabIndex.value >= tabs.value.length) {
					activeTabIndex.value = 0
				}

				isDirty.value = false
			})

			return true
		} catch (err: unknown) {
			console.error('[LevelV2Store] Failed to load from localStorage:', err)
			return false
		}
	}

	/**
	 * Очищает данные из localStorage
	 */
	function clearLocalStorage(): void {
		if (!storageKey.value) return

		try {
			globalThis.localStorage.removeItem(storageKey.value)
		} catch (err: unknown) {
			console.error('[LevelV2Store] Failed to clear localStorage:', err)
		}
	}

	// ===== Инициализация типа уровня =====

	/**
	 * Инициализирует store для конкретного типа уровня (универсальная логика)
	 */
	function initializeLevelType(
		type: LevelTypeId,
		subtype?: LevelSubtype | string,
		loadFromStorage: boolean = true
	): void {
		levelType.value = type

		// Получаем конфиг типа уровня
		const config = getLevelTypeConfig(type)
		if (!config) {
			console.error(`[LevelV2Store] Unknown level type: ${type}`)
			return
		}

		// Обрабатываем подтип если есть
		if (subtype && config.subtypes) {
			if (typeof subtype === 'object') {
				subtypeId.value = subtype.id
				dimension.value = subtype.dimension
			} else {
				subtypeId.value = subtype
				// Получаем размерность из конфига подтипа
				const subtypeConfig = getSubtypeConfig(type, subtype)
				dimension.value = subtypeConfig?.dimension || 0
			}
		} else {
			subtypeId.value = ''
			dimension.value = 0
		}

		// Пытаемся загрузить данные из localStorage
		if (loadFromStorage) {
			const loaded = loadFromLocalStorage()
			if (!loaded) {
				// Если загрузка не удалась, инициализируем дефолтными данными
				resetToDefaults()
			}
		} else {
			resetToDefaults()
		}
	}

	/**
	 * Сбрасывает store к дефолтным значениям (универсальная логика)
	 */
	function resetToDefaults(): void {
		withDirtyTrackingSuppressed(() => {
			tabs.value = [createDefaultTab()]
			activeTabIndex.value = 0

			// Получаем дефолты из конфига типа уровня
			const typeConfig = getLevelTypeConfig(levelType.value)
			config.value = {
				sectorMode: typeConfig?.defaults?.sectorMode || 'all',
				bonusTime: typeConfig?.defaults?.bonusTime || { hours: 0, minutes: 0, seconds: 0, negative: false },
				closedPattern: typeConfig?.defaults?.closedPattern || ''
			}

			// Если тип поддерживает подтипы и есть фиксированная размерность
			if (hasSubtypes(levelType.value) && dimension.value > 0) {
				setDimension(dimension.value)
			}

			isDirty.value = false
		})
	}

	// ===== Автосохранение =====

	// Следим за изменениями и автоматически сохраняем
	let saveTimeout: ReturnType<typeof globalThis.setTimeout> | null = null

	watch(
		[tabs, config, isDirty],
		() => {
			if (!isDirty.value) return

			// Отложенное сохранение через 1 секунду после последнего изменения
			if (saveTimeout) {
				globalThis.clearTimeout(saveTimeout)
			}

			saveTimeout = globalThis.setTimeout(() => {
				saveToLocalStorage()
				saveTimeout = null
			}, 1000)
		},
		{ deep: true }
	)

	// ===== Экспорт =====

	return {
		// Метаданные
		domain,
		gameId,
		levelId,
		levelType,
		subtypeId,
		dimension,

		// Табы
		tabs,
		activeTabIndex,
		activeTab,
		tabCount,
		canAddTab,

		// Конфигурация
		config,

		// Флаги
		isLoading,
		isDirty,

		// Геттеры
		allAnswers,
		storageKey,

		// Управление табами
		addTab,
		removeTab,
		renameTab,
		setActiveTab,

		// Управление ответами
		addAnswer,
		addMultipleAnswers,
		addCodesToActiveTab,
		removeAnswer,
		updateAnswer,
		clearActiveTab,
		clearAllTabs,
		markDirty,

		applyToAllInActiveTab,
		setDimension,

		// Конфигурация
		updateConfig,
		setSectorMode,
		setBonusTime,

		// LocalStorage
		saveToLocalStorage,
		loadFromLocalStorage,
		clearLocalStorage,

		// Инициализация
		initializeLevelType,
		resetToDefaults
	}
},
{
	...(isTestUrlMode() ? {} : {
		persist: {
			pick: ['domain', 'gameId', 'levelId', 'levelType', 'subtypeId', 'dimension']
		}
	})
}
)
