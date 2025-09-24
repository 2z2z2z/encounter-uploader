/**
 * Композабл для генерации двух режимов предпросмотра контента
 *
 * Обеспечивает универсальное переключение между "закрытым" и "открытым" режимами
 * на основе полей из конфигурации типа уровня. НЕ содержит хардкода типов.
 */

import type { LevelTypeConfig } from '../types'
import type { useLevelStore } from '../store'
import { createTaskPayload } from '../payloads/TaskPayload'

/**
 * Интерфейс для настройки режимов предпросмотра
 */
interface PreviewModeConfig {
	/** Поля для "закрытого" режима */
	closedFields: import('../types').FieldId[]
	/** Поля для "открытого" режима */
	openFields: import('../types').FieldId[]
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
}

/**
 * Определение конфигурации режимов на основе типа уровня
 *
 * Универсальная логика без хардкода типов.
 * Определяет какие поля использовать для закрытого/открытого режимов.
 */
const getPreviewModeConfig = (config: LevelTypeConfig): PreviewModeConfig | null => {
	const { fields } = config

	// Проверяем наличие полей для переключения
	const hasClosedField = fields.includes('closedText')
	const hasOpenField = fields.includes('displayText')

	// Если есть и закрытое и открытое поля - поддерживаем переключение
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
	 * Генерация закрытого контента
	 */
	const generateClosedContent = (): string | null => {
		try {
			// Используем существующую систему генераторов с закрытыми полями
			const payload = createTaskPayload(storeInstance, levelConfig)
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

			const payload = createTaskPayload(storeInstance, openConfig)
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

	return {
		generateClosedContent,
		generateOpenContent,
		supportsToggle
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