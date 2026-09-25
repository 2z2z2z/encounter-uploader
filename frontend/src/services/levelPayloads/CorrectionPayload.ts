/**
 * Пейлоад для отправки корректировки результатов (GameBonusPenaltyTime.aspx)
 */

import type { PayloadBuilder, CorrectionPayloadData } from '@/entities/level/types'
import { CORRECTION_TYPES } from '@/entities/level/constants'

/**
 * Создает пейлоад одной корректировки. Поля формы проверены на EN:
 * EN сам нормализует переполнение единиц времени (90 секунд = 1 мин 30 с)
 *
 * @param data - Данные корректировки с ID участника и уровня из формы EN
 * @returns URLSearchParams готовый для отправки
 */
export const buildCorrectionPayload: PayloadBuilder<CorrectionPayloadData> = (data) => {
	const { time } = data

	return new globalThis.URLSearchParams({
		domain: data.domain,
		gid: String(data.gameId),
		radioCorrectionType: CORRECTION_TYPES[data.correctionType].enValue,
		ddlEditCorrectionPlayers: data.participantId,
		ddlEditCorrectionLevels: String(data.levelId),
		DaysList: String(time.days || 0),
		HoursList: String(time.hours || 0),
		MinutesList: String(time.minutes || 0),
		SecondsList: String(time.seconds || 0),
		txtEditCorrectionComment: data.comment
	})
}
