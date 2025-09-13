/**
 * Композабл для логики пейлоадов
 */

import { useLevelV2Store } from '../store'
import { buildSectorPayload } from '../payloads/SectorPayload'
import type { SectorPayloadData, Answer } from '../types'

export function useLevelPayloads() {
	const store = useLevelV2Store()
	
	/**
	 * Создает пейлоад для сектора с учетом БМП режима
	 * 
	 * @param answers - Массив ответов для сектора
	 * @param sectorName - Название сектора 
	 * @param combineSectors - Режим БМП (объединение секторов)
	 * @returns URLSearchParams для отправки
	 */
	function createSectorPayload(answers: Answer[], sectorName = '', combineSectors = false): globalThis.URLSearchParams {
		if (!store.domain || !store.gameId || !store.levelId) {
			throw new Error('Не установлены данные игры (domain, gameId, levelId)')
		}
		
		const data: SectorPayloadData = {
			domain: store.domain,
			gameId: store.gameId,
			levelId: store.levelId,
			sectorName,
			answers,
			combineSectors
		}
		
		return buildSectorPayload(data)
	}
	
	// Функции для пейлоадов
	async function uploadTask() {
		// Реализация в Шаге 23
		console.log('Uploading task...')
	}
	
	async function uploadSectors() {
		// Реализация в Шаге 24
		console.log('Uploading sectors...')
	}
	
	async function uploadBonuses() {
		// Реализация в Шаге 25
		console.log('Uploading bonuses...')
	}
	
	return {
		createSectorPayload,
		uploadTask,
		uploadSectors,
		uploadBonuses
	}
}


