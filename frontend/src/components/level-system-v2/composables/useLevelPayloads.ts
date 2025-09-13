/**
 * Композабл для логики пейлоадов
 */

import { useLevelV2Store } from '../store'
import { buildSectorPayload } from '../payloads/SectorPayload'
import { buildBonusPayload } from '../payloads/BonusPayload'
import { createTaskPayload } from '../payloads/TaskPayload'
import { getLevelTypeConfig } from '../configs'
import { useProgressStore } from '@/store/progress'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/store/auth'
import { sendTask, sendSector, sendBonuses } from '@/services/uploader'
import type { SectorPayloadData, BonusPayloadData, Answer } from '../types'

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
	
	/**
	 * Создает пейлоад для бонуса
	 * 
	 * @param bonus - Данные бонуса (Answer)
	 * @param levelMapping - Маппинг уровней для выбора (лейбл → checkbox имя)
	 * @returns URLSearchParams для отправки
	 */
	function createBonusPayload(bonus: Answer, levelMapping?: Record<string, string>): globalThis.URLSearchParams {
		if (!store.domain || !store.gameId || !store.levelId) {
			throw new Error('Не установлены данные игры (domain, gameId, levelId)')
		}
		
		const data: BonusPayloadData = {
			domain: store.domain,
			gameId: store.gameId,
			levelId: store.levelId,
			bonus,
			levelMapping
		}
		
		return buildBonusPayload(data)
	}
	
	// Дополнительные композаблы и stores
	const progress = useProgressStore()
	const notify = useNotification()
	const authStore = useAuthStore()
	
	/**
	 * Загружает задание через Task пейлоад
	 * Поддерживается только для типов с task пейлоадом в конфиге
	 */
	async function uploadTask(): Promise<void> {
		try {
			// Получение конфига типа уровня
			const config = getLevelTypeConfig(store.levelType)
			if (!config) {
				throw new Error(`Конфиг для типа ${store.levelType} не найден`)
			}
			
			// Проверка поддержки Task пейлоада
			if (!config.payloads.task || typeof config.payloads.task !== 'object') {
				throw new Error(`Тип ${store.levelType} не поддерживает загрузку заданий`)
			}
			
			// Проверка данных игры
			if (!store.domain || !store.gameId || !store.levelId) {
				throw new Error('Не установлены данные игры (domain, gameId, levelId)')
			}
			
			// Обновление авторизации перед загрузкой
			await authStore.authenticate(store.domain)
			
			// Создание пейлоада через Content Generators System
			const taskPayload = createTaskPayload(store, config)
			if (!taskPayload) {
				throw new Error('Не удалось создать Task пейлоад')
			}
			
			// Инициализация прогресса
			progress.start('task', 1)
			progress.updateTitle('Отправка задания')
			
			// Проверка паузы перед отправкой
			await progress.waitForResume()
			
			// Отправка задания
			const inputTask = taskPayload.get('inputTask') || ''
			await sendTask(store.domain, store.gameId, store.levelId, inputTask)
			
			progress.updateSuccess('Задание отправлено')
			progress.finish()
			
			notify.success('Задание загружено', 'Задание успешно отправлено в игру')
			
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error)
			progress.reportError(`Ошибка загрузки задания: ${message}`)
			progress.finish()
			notify.error('Ошибка загрузки задания', message)
			throw error
		}
	}
	
	/**
	 * Загружает секторы с поддержкой мульти-табов и БМП
	 * 
	 * @param combineSectors - Режим БМП (объединение секторов)
	 */
	async function uploadSectors(_combineSectors = false): Promise<void> {
		try {
			// TODO: Реализовать БМП функционал для объединения секторов
			// _combineSectors параметр зарезервирован для будущей реализации БМП
			
			// Получение конфига типа уровня
			const config = getLevelTypeConfig(store.levelType)
			if (!config) {
				throw new Error(`Конфиг для типа ${store.levelType} не найден`)
			}
			
			// Проверка поддержки загрузки секторов
			if (!config.payloads.sector) {
				throw new Error(`Тип ${store.levelType} не поддерживает загрузку секторов`)
			}
			
			// Проверка данных игры
			if (!store.domain || !store.gameId || !store.levelId) {
				throw new Error('Не установлены данные игры (domain, gameId, levelId)')
			}
			
			// Сбор данных секторов в зависимости от типа (мульти-табы или одиночный)
			let allSectors: Answer[] = []
			
			if (config.isMultiBlocks) {
				// Для типов с мульти-табами собираем из всех табов
				for (const tab of store.tabs) {
					const tabSectors = tab.answers.filter(answer => answer.sector)
					allSectors.push(...tabSectors)
				}
			} else {
				// Для одиночных типов берем только из активного таба
				const activeTab = store.tabs[store.activeTabIndex]
				if (activeTab) {
					allSectors = activeTab.answers.filter(answer => answer.sector)
				}
			}
			
			if (allSectors.length === 0) {
				notify.info('Нет отмеченных секторов', 'Отметьте секторы для загрузки')
				return
			}
			
			// Обновление авторизации перед массовой загрузкой
			await authStore.authenticate(store.domain)
			
			// Инициализация прогресса
			progress.start('sector', allSectors.length)
			
			// Отправка секторов по одному
			for (let idx = 0; idx < allSectors.length; idx++) {
				const sector = allSectors[idx]
				
				// Проверяем паузу перед каждым сектором
				await progress.waitForResume()
				
				progress.updateTitle(`Сектор ${sector.number}`)
				
				// Отправка сектора (используем старую функцию sendSector)
				await sendSector(
					store.domain,
					store.gameId,
					store.levelId,
					sector.variants,
					sector.closedText,
					sector.sectorName || ''
				)
				
				progress.updateSuccess(`Сектор ${sector.number} отправлен`)
				
				// Каждые 25 секторов обновляем авторизацию
				if ((idx + 1) % 25 === 0) {
					await authStore.authenticate(store.domain)
				}
			}
			
			progress.finish()
			notify.success('Секторы загружены', `Успешно загружено ${allSectors.length} секторов`)
			
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error)
			progress.reportError(`Ошибка загрузки секторов: ${message}`)
			progress.finish()
			notify.error('Ошибка загрузки секторов', message)
			throw error
		}
	}
	
	/**
	 * Загружает бонусы с поддержкой мульти-табов
	 */
	async function uploadBonuses(): Promise<void> {
		try {
			// Получение конфига типа уровня
			const config = getLevelTypeConfig(store.levelType)
			if (!config) {
				throw new Error(`Конфиг для типа ${store.levelType} не найден`)
			}
			
			// Проверка поддержки загрузки бонусов
			if (!config.payloads.bonus) {
				throw new Error(`Тип ${store.levelType} не поддерживает загрузку бонусов`)
			}
			
			// Проверка данных игры
			if (!store.domain || !store.gameId || !store.levelId) {
				throw new Error('Не установлены данные игры (domain, gameId, levelId)')
			}
			
			// Сбор данных бонусов в зависимости от типа (мульти-табы или одиночный)
			let allBonuses: Answer[] = []
			
			if (config.isMultiBlocks) {
				// Для типов с мульти-табами собираем из всех табов
				for (const tab of store.tabs) {
					const tabBonuses = tab.answers.filter(answer => answer.bonus)
					allBonuses.push(...tabBonuses)
				}
			} else {
				// Для одиночных типов берем только из активного таба
				const activeTab = store.tabs[store.activeTabIndex]
				if (activeTab) {
					allBonuses = activeTab.answers.filter(answer => answer.bonus)
				}
			}
			
			if (allBonuses.length === 0) {
				notify.info('Нет отмеченных бонусов', 'Отметьте бонусы для загрузки')
				return
			}
			
			// Обновление авторизации перед массовой загрузкой
			await authStore.authenticate(store.domain)
			
			// Инициализация прогресса
			progress.start('bonus', allBonuses.length)
			
			// Отправка бонусов по одному
			for (let idx = 0; idx < allBonuses.length; idx++) {
				const bonus = allBonuses[idx]
				
				// Проверяем паузу перед каждым бонусом
				await progress.waitForResume()
				
				progress.updateTitle(`Бонус ${bonus.number}`)
				
				// Конвертируем структуру данных для старой функции sendBonuses
				const legacyAnswer = {
					number: bonus.number,
					variants: bonus.variants,
					inBonus: bonus.bonus, // мапинг поля
					bonusTime: bonus.bonusTime,
					closedText: bonus.closedText,
					displayText: bonus.displayText
				}
				
				// Отправка бонуса (используем старую функцию sendBonuses)
				await sendBonuses(store.domain, store.gameId, store.levelId, [legacyAnswer])
				
				progress.updateSuccess(`Бонус ${bonus.number} отправлен`)
				
				// Каждые 25 бонусов обновляем авторизацию
				if ((idx + 1) % 25 === 0) {
					await authStore.authenticate(store.domain)
				}
			}
			
			progress.finish()
			notify.success('Бонусы загружены', `Успешно загружено ${allBonuses.length} бонусов`)
			
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error)
			progress.reportError(`Ошибка загрузки бонусов: ${message}`)
			progress.finish()
			notify.error('Ошибка загрузки бонусов', message)
			throw error
		}
	}
	
	return {
		createSectorPayload,
		createBonusPayload,
		uploadTask,
		uploadSectors,
		uploadBonuses
	}
}


