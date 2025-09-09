/**
 * Пейлоад для заливки заданий
 * Будет реализовано в Шаге 23
 */

import type { PayloadBuilder, TaskPayloadData } from '../types'

// Заглушка функции сборки пейлоада
export const buildTaskPayload: PayloadBuilder<TaskPayloadData> = (data) => {
	const params = new globalThis.URLSearchParams()
	
	// Основные параметры (заглушка для Шага 23)
	params.append('domain', data.domain)
	params.append('gid', String(data.gameId))
	params.append('level', String(data.levelId))
	params.append('inputTask', data.htmlContent)
	
	return params
}


