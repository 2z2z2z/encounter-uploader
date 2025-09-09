/**
 * Пейлоад для заливки секторов
 * Будет реализовано в Шаге 24
 */

import type { PayloadBuilder, SectorPayloadData } from '../types'

// Заглушка функции сборки пейлоада
export const buildSectorPayload: PayloadBuilder<SectorPayloadData> = (data) => {
	const params = new globalThis.URLSearchParams()
	
	// Основные параметры (заглушка для Шага 24)
	params.append('domain', data.domain)
	params.append('gid', String(data.gameId))
	params.append('level', String(data.levelId))
	params.append('txtSectorName', data.sectorName)
	params.append('savesector', ' ')
	
	// Добавление ответов будет реализовано в Шаге 24
	
	return params
}


