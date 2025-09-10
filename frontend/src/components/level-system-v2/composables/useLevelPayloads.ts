/**
 * Композабл для логики пейлоадов
 * Будет реализовано при необходимости
 */

import { useLevelV2Store } from '../store'

export function useLevelPayloads() {
	const _store = useLevelV2Store()
	
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
		uploadTask,
		uploadSectors,
		uploadBonuses
	}
}


