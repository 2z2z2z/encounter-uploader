/**
 * Пейлоад для заливки бонусов
 * Будет реализовано в Шаге 25
 */

import type { PayloadBuilder, BonusPayloadData } from '../types'

// Заглушка функции сборки пейлоада
export const buildBonusPayload: PayloadBuilder<BonusPayloadData> = (data) => {
	const params = new globalThis.URLSearchParams()
	
	// Основные параметры (заглушка для Шага 25)
	params.append('domain', data.domain)
	params.append('gid', String(data.gameId))
	params.append('level', String(data.levelId))
	
	// Данные бонуса будут добавлены в Шаге 25
	if (data.bonus) {
		params.append('txtBonusName', data.bonus.bonusName || '')
	}
	
	return params
}


