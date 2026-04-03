/**
 * Пейлоад для заливки бонусов
 *
 * Портировано из оригинальной функции buildBonusPayload() в services/uploader.ts
 * с адаптацией под новую структуру данных Answer
 */

import type { PayloadBuilder, BonusPayloadData } from "@/entities/level/types"
import { processPicContent } from "@/utils/picContent"

/**
 * Создает пейлоад для заливки одного бонуса
 *
 * Соответствует оригинальной функции buildBonusPayload() из services/uploader.ts
 *
 * @param data - Данные для формирования пейлоада
 * @returns URLSearchParams готовый для отправки
 */
export const buildBonusPayload: PayloadBuilder<BonusPayloadData> = (data) => {
	const params = new globalThis.URLSearchParams()
	const { bonus, levelMapping = {} } = data

	// Основные параметры
	params.append('domain', data.domain)
	params.append('gid', String(data.gameId))
	params.append('level', String(data.levelId))
	params.append('txtBonusName', bonus.bonusName || '')
	params.append('txtTask', bonus.bonusTask || '')

	// Обработка подсказки (txtHelp)
	const explicitHint = typeof bonus.hint === 'string' ? bonus.hint : ''
	const hintStrategy = data.hintStrategy ?? 'none'

	if (explicitHint.trim().length > 0) {
		params.append('txtHelp', explicitHint)
	} else if (hintStrategy === 'autoContent') {
		const autoHint = generateAutoHintScript(
			data.levelId,
			bonus.number,
			bonus.displayText,
			bonus.closedText,
			bonus.openPic,
			data.closedPicIds
		)
		params.append('txtHelp', autoHint)
	} else {
		params.append('txtHelp', '')
	}

	// Варианты ответов (специальный формат с отрицательными индексами!)
	if (Array.isArray(bonus.variants)) {
		bonus.variants.forEach((variant, idx) => {
			if (variant && variant.trim()) {
				params.append(`answer_-${idx + 1}`, variant)
			}
		})
	}

	// Бонусное время
	params.append('txtHours', String(bonus.bonusTime.hours || 0))
	params.append('txtMinutes', String(bonus.bonusTime.minutes || 0))
	params.append('txtSeconds', String(bonus.bonusTime.seconds || 0))
	if (bonus.bonusTime.negative) {
		params.append('negative', 'on')
	}

	// Задержка (опционально)
	if (bonus.delay && (bonus.delay.hours || bonus.delay.minutes || bonus.delay.seconds)) {
		params.append('chkDelay', 'on')
		params.append('txtDelayHours', String(bonus.delay.hours || 0))
		params.append('txtDelayMinutes', String(bonus.delay.minutes || 0))
		params.append('txtDelaySeconds', String(bonus.delay.seconds || 0))
	}

	// Ограничение времени (опционально) - адаптация relativeLimit → limit
	if (bonus.limit && (bonus.limit.hours || bonus.limit.minutes || bonus.limit.seconds)) {
		params.append('chkRelativeLimit', 'on')
		params.append('txtValidHours', String(bonus.limit.hours || 0))
		params.append('txtValidMinutes', String(bonus.limit.minutes || 0))
		params.append('txtValidSeconds', String(bonus.limit.seconds || 0))
	}

	// Логика выбора уровней - адаптация allLevels/targetLevels → bonusLevels
	let isAllLevels = false

	if (Array.isArray(bonus.bonusLevels)) {
		// bonusLevels явно определен
		if (bonus.bonusLevels.length === 0) {
			// Пустой массив = "все уровни" (явный выбор пользователя)
			isAllLevels = true
		} else {
			// Есть конкретные уровни
			isAllLevels = false
			const selected = new Set<string>(bonus.bonusLevels.map(String))
			for (const lbl of selected) {
				const chk = levelMapping[lbl]
				if (chk) {
					params.append(chk, 'on')
				}
			}
		}
	} else {
		// bonusLevels не определен (undefined)
		// ПО УМОЛЧАНИЮ ВСЕГДА используем текущий levelId (для ВСЕХ типов!)
		isAllLevels = false
		const currentLevelStr = String(data.levelId)
		const chk = levelMapping[currentLevelStr]

		if (!chk) {
			// Если для текущего уровня нет маппинга, это ошибка
			throw new Error(`Не найден маппинг уровня для текущего levelId="${currentLevelStr}". Обновите список уровней и повторите.`)
		}

		params.append(chk, 'on')
	}

	params.append('rbAllLevels', isAllLevels ? '0' : '1')

	return params
}


/**
 * Минификация HTML/текста для вставки в hint скрипт
 * Убирает переносы строк и лишние пробелы, экранирует кавычки
 */
function minifyContent(content: string): string {
	return content
		.replace(/\r?\n/g, '') // Убираем переносы строк
		.replace(/\s+/g, ' ')  // Заменяем множественные пробелы на одинарные
		.trim()                // Убираем пробелы по краям
		.replace(/"/g, '\\"')  // Экранируем двойные кавычки
}

function generateAutoHintScript(
	levelId: string | number,
	bonusNumber: number,
	displayText: string,
	closedText: string,
	openPic?: string[],
	closedPicIds?: string[]
): string {
	// Проверяем наличие openPic и closedPicIds (для типа svalka с мультикартинками)
	if (openPic && openPic.length > 0 && closedPicIds && closedPicIds.length > 0) {
		// Для svalka с несколькими картинками генерируем скрипт для каждого ID
		const scripts: string[] = []

		for (let i = 0; i < closedPicIds.length && i < openPic.length; i++) {
			const targetId = closedPicIds[i]
			const content = minifyContent(processPicContent(openPic[i]))
			scripts.push(`<script type="text/javascript">document.getElementById("${targetId}").innerHTML="${content}";</script>`)
		}

		return scripts.join('')
	}

	// Fallback для старых типов без closedPicIds
	const levelKey = String(levelId)
	const targetId = `${levelKey}_${String(bonusNumber).padStart(2, '0')}`

	if (openPic && openPic.length > 0 && openPic[0].trim()) {
		// Для svalka с одной картинкой (старая логика)
		const content = minifyContent(processPicContent(openPic[0]))
		return `<script type="text/javascript">document.getElementById("${targetId}").innerHTML="${content}";</script>`
	}

	// Для olymp и других типов используем displayText или closedText
	const hasDisplay = displayText && displayText.trim().length > 0
	const rawContent = hasDisplay
		? `<p class='up'>${displayText}</p>`
		: closedText
	const content = minifyContent(rawContent)

	return `<script type="text/javascript">document.getElementById("${targetId}").innerHTML="${content}";</script>`
}

