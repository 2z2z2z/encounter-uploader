/**
 * Композабл для логики пейлоадов
 */

import { useLevelStore } from "@/store/levels"
import { buildSectorPayload } from '@/services/levelPayloads/SectorPayload'
import { buildBonusPayload } from '@/services/levelPayloads/BonusPayload'
import { createTaskPayload } from '@/services/levelPayloads/TaskPayload'
import { getLevelTypeConfig } from "@/entities/level/configs"
import { useProgressStore } from '@/store/progress'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/store/auth'
import { sendTask, sendSector, sendBonuses } from '@/services/uploader'
import type { SectorPayloadData, BonusPayloadData, Answer, TabData } from "@/entities/level/types"

export function useLevelPayloads() {
	const store = useLevelStore()
	
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
	async function uploadSectors(combineSectors = false): Promise<void> {
		try {
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

			// Обновление авторизации перед массовой загрузкой
			await authStore.authenticate(store.domain)

			if (combineSectors && config.isMultiBlocks) {
				// Режим БМП: объединение секторов из разных табов

				// Валидация для режима БМП (как в старой архитектуре)
				if (store.tabs.length <= 1) {
					notify.warn('Для объединения необходимо больше одного блока')
					return
				}

				const firstTabAnswers = store.tabs[0].answers
				if (!store.tabs.every((tab: TabData) => tab.answers.length === firstTabAnswers.length)) {
					notify.warn('Количество ответов во всех блоках должно совпадать')
					return
				}

				// Группируем ответы по индексу (номеру) из разных табов
				const total = firstTabAnswers.length
				const answerGroups: Answer[][] = []

				for (let i = 0; i < total; i++) {
					answerGroups.push(store.tabs.map((tab: TabData) => tab.answers[i]))
				}

				progress.start('sector', total)

				for (let idx = 0; idx < answerGroups.length; idx++) {
					const answers = answerGroups[idx]

					// Проверяем паузу перед каждой группой секторов
					await progress.waitForResume()

					// Пропускаем если не все ответы в группе отмечены как сектор
					if (!answers.every(answer => answer.sector)) {
						progress.updateTitle('Пропуск')
						progress.updateSuccess('Пропущен')
						continue
					}

					// Объединяем варианты ответов из всех табов
					const combinedVariants: string[] = []
					for (const answer of answers) {
						const variants = Array.isArray(answer.variants) ? answer.variants : []
						combinedVariants.push(...variants.filter(v => v && v.trim()))
					}

					// Если нет вариантов, добавляем пустой
					if (combinedVariants.length === 0) {
						combinedVariants.push('')
					}

					const firstAnswer = answers[0]
					progress.updateTitle(`Сектор ${firstAnswer.number}`)

					// Отправка объединенного сектора
					await sendSector(
						store.domain,
						store.gameId,
						store.levelId,
						combinedVariants,
						'', // closedText не используется в БМП режиме
						firstAnswer.sectorName || ''
					)

					progress.updateSuccess(`Сектор ${firstAnswer.number} отправлен`)

					// Каждые 25 секторов обновляем авторизацию
					if ((idx + 1) % 25 === 0) {
						await authStore.authenticate(store.domain)
					}
				}

				progress.finish()

			} else {
				// Обычный режим: каждый сектор отдельно

				// Сбор данных секторов в зависимости от типа (мульти-табы или одиночный)
				let allSectors: Answer[] = []

				if (config.isMultiBlocks) {
					// Для типов с мульти-табами собираем из всех табов
					for (const tab of store.tabs) {
						const tabSectors = tab.answers.filter((answer: Answer) => answer.sector)
						allSectors.push(...tabSectors)
					}
				} else {
					// Для одиночных типов берем только из активного таба
					const activeTab = store.tabs[store.activeTabIndex]
					if (activeTab) {
						allSectors = activeTab.answers.filter((answer: Answer) => answer.sector)
					}
				}

				if (allSectors.length === 0) {
					notify.info('Нет отмеченных секторов', 'Отметьте секторы для загрузки')
					return
				}

				// Инициализация прогресса
				progress.start('sector', allSectors.length)

				// Отправка секторов по одному
				for (let idx = 0; idx < allSectors.length; idx++) {
					const sector = allSectors[idx]

					// Проверяем паузу перед каждым сектором
					await progress.waitForResume()

					progress.updateTitle(`Сектор ${sector.number}`)

					// Отправка сектора
					await sendSector(
						store.domain,
						store.gameId,
						store.levelId,
						sector.variants.filter(v => v && v.trim()).length > 0 ? sector.variants : [''],
						sector.closedText || '',
						sector.sectorName || ''
					)

					progress.updateSuccess(`Сектор ${sector.number} отправлен`)

					// Каждые 25 секторов обновляем авторизацию
					if ((idx + 1) % 25 === 0) {
						await authStore.authenticate(store.domain)
					}
				}

				progress.finish()
			}
			
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
					const tabBonuses = tab.answers.filter((answer: Answer) => answer.bonus)
					allBonuses.push(...tabBonuses)
				}
			} else {
				// Для одиночных типов берем только из активного таба
				const activeTab = store.tabs[store.activeTabIndex]
				if (activeTab) {
					allBonuses = activeTab.answers.filter((answer: Answer) => answer.bonus)
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
				const normalizedLevels = Array.isArray(bonus.bonusLevels) ? bonus.bonusLevels.map(String) : []
				const allLevels = !Array.isArray(bonus.bonusLevels) || normalizedLevels.length === 0
				const legacyAnswer = {
					number: bonus.number,
					variants: bonus.variants,
					inSector: bonus.sector,
					inBonus: bonus.bonus,
					bonusTime: {
						...bonus.bonusTime,
						negative: bonus.bonusTime.negative || false
					},
					closedText: bonus.closedText,
					displayText: bonus.displayText,
					allLevels,
					targetLevels: allLevels ? [] : normalizedLevels
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


