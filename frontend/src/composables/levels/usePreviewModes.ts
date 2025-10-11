/**
 * Композабл для генерации двух режимов предпросмотра контента
 *
 * Обеспечивает универсальное переключение между "закрытым" и "открытым" режимами
 * на основе полей из конфигурации типа уровня. НЕ содержит хардкода типов.
 */

import type { LevelTypeConfig } from "@/entities/level/types"
import type { useLevelStore } from "@/store/levels"
import { createTaskPayload } from '@/services/levelPayloads/TaskPayload'

/**
 * Интерфейс для настройки режимов предпросмотра
 */
interface PreviewModeConfig {
	/** Поля для "закрытого" режима */
	closedFields: import('@/entities/level/types').FieldId[]
	/** Поля для "открытого" режима */
	openFields: import('@/entities/level/types').FieldId[]
	/** Включить стилизацию для открытого режима */
	enableOpenStyling?: boolean
}

/**
 * Результат композабла
 */
interface UsePreviewModes {
	/** Генерация закрытого контента */
	generateClosedContent: () => string | null
	/** Генерация открытого контента */
	generateOpenContent: () => string | null
	/** Поддерживает ли тип уровня переключение режимов */
	supportsToggle: () => boolean
	/** Перемешать порядок блоков (для типов с множественными блоками) */
	shuffleBlockOrder: () => void
}

/**
 * Определение конфигурации режимов на основе типа уровня
 *
 * Универсальная логика без хардкода типов.
 * Определяет какие поля использовать для закрытого/открытого режимов.
 */
const getPreviewModeConfig = (config: LevelTypeConfig): PreviewModeConfig | null => {
	const { fields } = config

	// Проверяем наличие полей для переключения closedPic/openPic (для типа svalka)
	const hasClosedPic = fields.includes('closedPic')
	const hasOpenPic = fields.includes('openPic')

	if (hasClosedPic && hasOpenPic) {
		return {
			closedFields: ['closedPic'],
			openFields: ['openPic'],
			enableOpenStyling: false // Для svalka стилизация не нужна
		}
	}

	// Проверяем наличие полей для переключения closedText/displayText (для olymp)
	const hasClosedField = fields.includes('closedText')
	const hasOpenField = fields.includes('displayText')

	if (hasClosedField && hasOpenField) {
		return {
			closedFields: ['closedText'],
			openFields: ['displayText'], // только открытое поле, без fallback
			enableOpenStyling: true
		}
	}

	// Если есть другие комбинации полей - можно расширить в будущем
	// Например: sectorName + bonusName, etc.

	return null // Переключение не поддерживается
}

/**
 * Универсальный композабл для режимов предпросмотра
 *
 * @param storeInstance - Экземпляр store level-system-v2
 * @param levelConfig - Конфигурация типа уровня
 * @returns Функции для генерации контента в разных режимах
 */
export const usePreviewModes = (
	storeInstance: ReturnType<typeof useLevelStore>,
	levelConfig: LevelTypeConfig
): UsePreviewModes => {

	const modeConfig = getPreviewModeConfig(levelConfig)

	/**
	 * Подсчет количества блоков из данных store
	 * Используется для типов с closedPic/openPic
	 */
	const countBlocks = (): number => {
		const answers = levelConfig.isMultiBlocks
			? storeInstance.tabs.flatMap(tab => tab.answers)
			: [storeInstance.tabs[storeInstance.activeTabIndex]].flatMap(tab => tab?.answers || [])

		// Для svalka считаем количество closedPic элементов
		const hasClosedPic = levelConfig.fields.includes('closedPic')
		if (hasClosedPic) {
			return answers.reduce((sum, answer) => sum + (answer.closedPic?.length || 0), 0)
		}

		return 0
	}

	/**
	 * Инициализация порядка блоков
	 * Создает массив индексов [0, 1, 2, ..., count-1] и сохраняет в store
	 * ТОЛЬКО если blockOrder не установлен или имеет неправильную длину
	 */
	const initializeBlockOrder = (): void => {
		const count = countBlocks()
		if (count === 0) return

		const currentOrder = getBlockOrder()
		// Инициализируем только если порядка нет или длина не совпадает
		if (!currentOrder || currentOrder.length !== count) {
			storeInstance.setBlockOrder(Array.from({ length: count }, (_, i) => i))
		}
	}

	/**
	 * Получить текущий blockOrder из store (или создать если нет)
	 */
	const getBlockOrder = (): number[] | undefined => {
		return storeInstance.config.blockOrder
	}

	/**
	 * Генерация закрытого контента
	 */
	const generateClosedContent = (): string | null => {
		try {
			// Используем существующую систему генераторов с закрытыми полями
			// Передаем showBlockIds: true для отображения ID в preview
			const payload = createTaskPayload(storeInstance, levelConfig, true, getBlockOrder())
			return payload ? payload.get('inputTask') || '' : null
		} catch (error: unknown) {
			console.error('[usePreviewModes] Error generating closed content:', error)
			return null
		}
	}

	/**
	 * Генерация открытого контента
	 *
	 * Модифицирует конфиг для использования "открытых" полей,
	 * затем генерирует контент через систему генераторов.
	 */
	const generateOpenContent = (): string | null => {
		if (!modeConfig) return null

		try {
			// Создаем временную модификацию конфига для открытого режима
			const openConfig: LevelTypeConfig = {
				...levelConfig,
				payloads: {
					...levelConfig.payloads,
					task: levelConfig.payloads.task && typeof levelConfig.payloads.task === 'object'
						? {
							...levelConfig.payloads.task,
							fields: modeConfig.openFields
						}
						: levelConfig.payloads.task
				}
			}

			const payload = createTaskPayload(storeInstance, openConfig, true, getBlockOrder())
			let content = payload ? payload.get('inputTask') || '' : null

			// Применяем стилизацию для открытого режима
			if (content && modeConfig.enableOpenStyling) {
				content = applyOpenStyling(content)
			}

			return content
		} catch (error: unknown) {
			console.error('[usePreviewModes] Error generating open content:', error)
			return null
		}
	}

	/**
	 * Проверка поддержки переключения режимов
	 */
	const supportsToggle = (): boolean => {
		return modeConfig !== null
	}

	/**
	 * Перемешать порядок блоков (Fisher-Yates shuffle)
	 * Используется для кнопки "Перемешать" в preview
	 */
	const shuffleBlockOrder = (): void => {
		const currentOrder = getBlockOrder()

		if (!currentOrder || currentOrder.length === 0) {
			// Если blockOrder еще не создан, создаем его
			initializeBlockOrder()
			return
		}

		if (currentOrder.length > 1) {
			const arr = [...currentOrder]
			for (let i = arr.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[arr[i], arr[j]] = [arr[j], arr[i]]
			}
			// Сохраняем перемешанный порядок в store
			storeInstance.setBlockOrder(arr)
		}
	}

	// Инициализируем blockOrder при создании композабла
	// Функция initializeBlockOrder сама проверит нужна ли (пере)инициализация
	if (levelConfig.fields.includes('openPic')) {
		initializeBlockOrder()
	}

	return {
		generateClosedContent,
		generateOpenContent,
		supportsToggle,
		shuffleBlockOrder
	}
}

/**
 * Применение стилизации для открытого режима
 *
 * Добавляет CSS класс 'up' для текста без URL (портировано из старой архитектуры).
 * Стилизация применяется только для непустого контента.
 */
const applyOpenStyling = (html: string): string => {
	// Добавляем стили для открытого режима
	const openStyles = `
		<style>
			.up { color: #0F0; font-weight: bold; }
		</style>
	`

	// Заменяем содержимое ячеек на стилизованное для не-URL контента
	return openStyles + html.replace(
		/<td([^>]*)>([^<]+(?:(?!<\/td>)<[^>]*>[^<]*<\/[^>]*>)*[^<]*)<\/td>/g,
		(match, attrs, content) => {
			// Проверяем что это не URL и не пустой контент
			const trimmedContent = content.trim()
			if (trimmedContent && !/^https?:\/\//i.test(trimmedContent)) {
				return `<td${attrs}><p class="up">${content}</p></td>`
			}
			return match
		}
	)
}