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
	LevelSubtype,
	AddCodesResult
} from '@/entities/level/types'
import {
	createStorageKey,
	getLevelTypeConfig,
	getSubtypeConfig,
	hasSubtypes
} from '@/entities/level/configs'
import { getFieldDefaultValue } from '@/entities/level/fields/fieldDefinitions'
import type { FieldId } from '@/entities/level/types'

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
	let isNormalizingBonusLevels = false

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
			normalizeAllBonusLevels()
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

	watch(levelId, () => {
		normalizeAllBonusLevels()
	})

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

	function levelSupportsBonusLevels(): boolean {
		const config = getLevelTypeConfig(levelType.value)
		return Boolean(config?.fields.includes('bonusLevels'))
	}

	function getDefaultBonusLevels(): string[] {
		if (!levelSupportsBonusLevels()) {
			return []
		}

		const currentLevel = String(levelId.value || '').trim()
		return currentLevel ? [currentLevel] : []
	}

	function sanitizeBonusLevels(levels: unknown): string[] {
		if (!Array.isArray(levels)) {
			return []
		}

		return Array.from(new Set(
			levels
				.map(level => String(level ?? '').trim())
				.filter(Boolean)
		))
	}

	function areStringArraysEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) return false
		return a.every((value, index) => value === b[index])
	}

	function normalizeAnswerBonusLevels(
		answer: Answer,
		supportsBonusLevels = levelSupportsBonusLevels(),
		fallbackLevels?: string[]
	): boolean {
		if (!supportsBonusLevels) {
			if (typeof answer.bonusLevels !== 'undefined') {
				answer.bonusLevels = undefined
				return true
			}
			return false
		}

		const fallback = fallbackLevels ?? getDefaultBonusLevels()

		if (!Array.isArray(answer.bonusLevels)) {
			const next = fallback.slice()
			if (next.length > 0) {
				answer.bonusLevels = next
				return true
			}

			if (typeof answer.bonusLevels !== 'undefined' && answer.bonusLevels !== null) {
				answer.bonusLevels = []
				return true
			}
			return false
		}

		const raw = answer.bonusLevels
		const normalized = sanitizeBonusLevels(raw)

		if (normalized.length > 0) {
			if (!areStringArraysEqual(raw, normalized)) {
				answer.bonusLevels = normalized
				return true
			}
			return false
		}

		if (raw.length === 0) {
			// Явный выбор "на все уровни" остаётся пустым массивом
			return false
		}

		if (!areStringArraysEqual(raw, fallback)) {
			answer.bonusLevels = fallback.slice()
			return true
		}

		return false
	}

	function normalizeAllBonusLevels(): boolean {
		if (isNormalizingBonusLevels) return false
		const supportsBonusLevels = levelSupportsBonusLevels()

		if (!supportsBonusLevels) {
			let changed = false
			tabs.value.forEach(tab => {
				tab.answers.forEach(answer => {
					if (typeof answer.bonusLevels !== 'undefined') {
						answer.bonusLevels = undefined
						changed = true
					}
				})
			})
			return changed
		}

		isNormalizingBonusLevels = true

		const fallbackLevels = getDefaultBonusLevels()
		let changed = false
		try {
			tabs.value.forEach(tab => {
				tab.answers.forEach(answer => {
					if (normalizeAnswerBonusLevels(answer, supportsBonusLevels, fallbackLevels)) {
						changed = true
					}
				})
			})
		} finally {
			isNormalizingBonusLevels = false
		}

		return changed
	}

	/**
	 * Создает пустой ответ с условной инициализацией полей
	 * на основе конфигурации текущего типа уровня
	 *
	 * ВАЖНО: Инициализируются только поля, которые есть в levelConfig.fields
	 * Это предотвращает добавление ненужных данных в localStorage для типов,
	 * которые не используют определенные поля (например, closedPic/openPic для olymp)
	 */
	function createEmptyAnswer(number: number): Answer {
		// Получаем конфигурацию текущего типа уровня
		const config = getLevelTypeConfig(levelType.value)
		const supportsBonusLevels = config?.fields.includes('bonusLevels') === true

		// Базовые поля, которые всегда присутствуют в Answer
		// Используем Partial для построения объекта постепенно
		const answer: Partial<Answer> = {
			id: generateAnswerId(),
			number,
			variants: [''],
			sector: true,
			bonus: true,
			bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false }
		}

		let defaultBonusLevels: string[] | undefined
		if (supportsBonusLevels) {
			defaultBonusLevels = getDefaultBonusLevels()
			answer.bonusLevels = defaultBonusLevels.slice()
		}

		// Если конфига нет, возвращаем базовый объект с приведением типа
		if (!config) {
			return answer as Answer
		}

		// Инициализируем дополнительные поля на основе конфигурации типа
		// Проходим по всем полям из конфига и добавляем их с дефолтными значениями
		config.fields.forEach((fieldId: FieldId) => {
			// Базовые поля уже инициализированы выше
			if (fieldId === 'answer' || fieldId === 'sector' || fieldId === 'bonus' || fieldId === 'bonusTime') {
				return
			}

			// Получаем дефолтное значение из fieldDefinitions
			const defaultValue = getFieldDefaultValue(fieldId)

			// Специальная обработка для bonusLevels - добавляем текущий levelId
			if (fieldId === 'bonusLevels') {
				const defaults = sanitizeBonusLevels(defaultValue)
				if (defaults.length > 0) {
					answer.bonusLevels = defaults
				} else if (!answer.bonusLevels) {
					answer.bonusLevels = getDefaultBonusLevels().slice()
				}
				return
			}

			// Для остальных полей используем дефолтное значение из определения поля
			if (defaultValue !== undefined) {
				// Клонируем объекты и массивы, чтобы избежать общих ссылок
				if (Array.isArray(defaultValue)) {
					answer[fieldId] = [...defaultValue] as never
				} else if (typeof defaultValue === 'object' && defaultValue !== null) {
					answer[fieldId] = { ...defaultValue } as never
				} else {
					answer[fieldId] = defaultValue as never
				}
			}
		})

		const result = answer as Answer
		if (supportsBonusLevels) {
			normalizeAnswerBonusLevels(result, true, defaultBonusLevels)
		} else {
			result.bonusLevels = undefined
		}
		return result
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
	function addMultipleAnswers(answersList: string[][], excludeDuplicates = false): AddCodesResult {
		const tab = activeTab.value
		if (!tab) {
			return { added: 0, duplicates: 0, total: answersList.length }
		}

		let added = 0
		let duplicates = 0
		const remainingCapacity = MAX_ANSWERS_PER_TAB - tab.answers.length
		const total = answersList.length

		for (const variants of answersList) {
			if (added >= remainingCapacity) break

			let isDuplicate = false
			if (excludeDuplicates) {
				// Проверяем на дубликаты во всех табах
				isDuplicate = allAnswers.value.some(answer =>
					answer.variants.length === variants.length &&
					answer.variants.every((v, i) => v === variants[i])
				)
			}

			if (isDuplicate) {
				duplicates++
			} else {
				if (addAnswer(variants)) {
					added++
				}
			}
		}

		return { added, duplicates, total }
	}

	/**
	 * Добавляет коды в активный таб (для функциональных кнопок)
	 * Каждый код становится первым вариантом нового ответа
	 */
	function addCodesToActiveTab(codes: string[], excludeDuplicates = false): AddCodesResult {
		const variantsList = codes.map(code => [code.trim()]).filter(variants => variants[0])
		return addMultipleAnswers(variantsList, excludeDuplicates)
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
		if ('bonusLevels' in updates) {
			normalizeAnswerBonusLevels(answer)
		}
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
			if (field === 'bonusLevels') {
				normalizeAnswerBonusLevels(answer)
			}
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

	/**
	 * Устанавливает порядок блоков для предпросмотра
	 */
	function setBlockOrder(order: number[] | undefined): void {
		config.value.blockOrder = order
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
				normalizeAllBonusLevels()
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
		setBlockOrder,

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
