/**
 * Пейлоад для заливки секторов
 * 
 * ВАЖНО: Эта функция создает пейлоад для ОДНОГО сектора.
 * Логика множественной отправки секторов должна быть в UI компонентах.
 * 
 * Поддерживает передачу массива вариантов ответов и названия сектора.
 */

import type { PayloadBuilder, SectorPayloadData } from '../types'

/**
 * Создает пейлоад для заливки одного сектора
 * 
 * Соответствует оригинальной функции buildSectorPayload() из services/uploader.ts
 * 
 * @param data - Данные для формирования пейлоада
 * @returns URLSearchParams готовый для отправки
 */
export const buildSectorPayload: PayloadBuilder<SectorPayloadData> = (data) => {
	const params = new globalThis.URLSearchParams()
	
	// Основные параметры (совместимо с оригинальной функцией)
	params.append('domain', data.domain)
	params.append('gid', String(data.gameId))
	params.append('level', String(data.levelId))
	params.append('txtSectorName', data.sectorName)
	params.append('savesector', ' ')
	
	// Извлекаем варианты ответов для этого сектора
	// В data.answers должен быть массив ответов для конкретного сектора
	const variants: string[] = []
	
	data.answers.forEach(answer => {
		if (Array.isArray(answer.variants)) {
			// Добавляем все варианты ответов, фильтруя пустые
			variants.push(...answer.variants.filter(v => v && v.trim()))
		}
	})
	
	// Если нет вариантов, добавляем пустой (как в оригинале)
	if (variants.length === 0) {
		variants.push('')
	}
	
	// Добавляем варианты в том же формате, что и оригинальная функция
	variants.forEach((variant, idx) => {
		params.append(`txtAnswer_${idx}`, variant)
		params.append(`ddlAnswerFor_${idx}`, '0')
	})
	
	return params
}


