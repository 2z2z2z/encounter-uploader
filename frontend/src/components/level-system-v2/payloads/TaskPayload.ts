/**
 * Пейлоад для заливки заданий
 * Будет реализовано в Шаге 23
 */

import type { PayloadBuilder } from '../types'

// Заглушка функции сборки пейлоада
export const buildTaskPayload: PayloadBuilder = (data) => {
	// Реализация в Шаге 23
	return new globalThis.URLSearchParams(data)
}


