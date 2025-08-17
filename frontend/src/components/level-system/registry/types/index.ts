import type { TypeConfig } from '../schema'
import { olymp15, olymp31, olymp63, olymp127 } from './olymp'
import { type100500 } from './type100500'

const map: Record<string, TypeConfig> = {
	olymp15,
	olymp31,
	olymp63,
	olymp127,
	'100500': type100500,
}

export function getTypeConfig(typeId: string): TypeConfig | null {
	return map[typeId] || null
}


