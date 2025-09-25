/**
 * Пейлоад для заливки бонусов
 * 
 * Портировано из оригинальной функции buildBonusPayload() в services/uploader.ts
 * с адаптацией под новую структуру данных Answer
 */

import type { PayloadBuilder, BonusPayloadData } from "@/entities/level/types"

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
	if (typeof bonus.hint === 'string' && bonus.hint.trim()) {
		// Если указана строковая подсказка - используем как есть
		params.append('txtHelp', bonus.hint)
	} else {
		// Иначе генерируем JavaScript код для динамического отображения
		// (адаптация логики из оригинала с учетом отсутствия флага noHint)
		const hint = bonus.displayText
			? `<script type="text/javascript">document.getElementById("${data.levelId}_${String(bonus.number).padStart(2, '0')}").innerHTML="${
				`<p class='up'>${bonus.displayText.replace(/"/g, '\\"')}</p>`
			}";</script>`
			: `<script type="text/javascript">document.getElementById("${data.levelId}_${String(bonus.number).padStart(2, '0')}").innerHTML="${
				bonus.closedText.replace(/"/g, '\\"')
			}";</script>`
		params.append('txtHelp', hint)
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
	const isAllLevels = !Array.isArray(bonus.bonusLevels) || bonus.bonusLevels.length === 0
	params.append('rbAllLevels', isAllLevels ? '0' : '1')
	
	if (!isAllLevels && Array.isArray(bonus.bonusLevels)) {
		// Используем только выбранные пользователем уровни (текущий уровень уже включен если выбран)
		const selected = new Set<string>(bonus.bonusLevels.map(String))
		for (const lbl of selected) {
			const chk = levelMapping[lbl]
			if (chk) {
				params.append(chk, 'on')
			}
		}
	}
	
	return params
}


