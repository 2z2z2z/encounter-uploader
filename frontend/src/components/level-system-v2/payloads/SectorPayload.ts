/**
 * Пейлоад для заливки секторов
 * Будет реализовано в Шаге 24
 */

import type { PayloadBuilder } from '../types'

// Заглушка функции сборки пейлоада
export const buildSectorPayload: PayloadBuilder = (data) => {
	// Реализация в Шаге 24
	return new globalThis.URLSearchParams(data)
}


