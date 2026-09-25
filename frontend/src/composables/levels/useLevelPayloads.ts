/**
 * Композабл для логики пейлоадов
 */

import { useLevelStore } from "@/store/levels"
import { buildSectorPayload } from '@/services/levelPayloads/SectorPayload'
import { buildBonusPayload } from '@/services/levelPayloads/BonusPayload'
import { createTaskPayload } from '@/services/levelPayloads/TaskPayload'
import { buildCorrectionPayload } from '@/services/levelPayloads/CorrectionPayload'
import { getLevelTypeConfig } from "@/entities/level/configs"
import { useProgressStore } from '@/store/progress'
import { useCorrectionsStore } from '@/store/corrections'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/store/auth'
import { useConfirm } from 'primevue/useconfirm'
import { sendTask, sendSector, sendBonus, sendCorrection, fetchBonusForm, waitBetweenRequests } from '@/services/transport'
import {
	formatCorrectionLevel,
	getExistingCorrectionKey,
	getRowCorrectionKey,
	isRowSent,
	validateCorrectionRow
} from '@/utils/corrections'
import { CORRECTION_TYPES, DEFAULT_DURATION } from '@/entities/level/constants'
import type { SectorPayloadData, BonusPayloadData, Answer, TabData, LevelTypeConfig } from "@/entities/level/types"

/** Решение пользователя о строках, которые уже есть в игре */
type DuplicatesDecision = 'skip' | 'all' | 'cancel'

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
	 * @param closedPicIds - Массив ID закрытых картинок для hint
	 * @returns URLSearchParams для отправки
	 */
	function createBonusPayload(bonus: Answer, levelMapping?: Record<string, string>, closedPicIds?: string[]): globalThis.URLSearchParams {
		if (!store.domain || !store.gameId || !store.levelId) {
			throw new Error('Не установлены данные игры (domain, gameId, levelId)')
		}

	const config = getLevelTypeConfig(store.levelType)
	const hintStrategy = config?.bonusHintStrategy ?? 'none'

	const data: BonusPayloadData = {
		domain: store.domain,
		gameId: store.gameId,
		levelId: store.levelId,
		bonus,
		levelMapping,
		hintStrategy,
		closedPicIds
	}

	return buildBonusPayload(data)
}

	// Дополнительные композаблы и stores
	const progress = useProgressStore()
	const notify = useNotification()
	const authStore = useAuthStore()

	/**
	 * Получает маппинг уровней для бонусов (label → checkbox name)
	 */
	async function getLevelMapping(
		domain: string,
		gameId: string | number,
		levelId: string | number
	): Promise<Record<string, string>> {
		const MAX_RETRIES = 3
		let levelLabelToName: Record<string, string> = {}

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				await checkPauseStatus()
				const htmlText = await fetchBonusForm(domain, gameId, levelId)

				const parser = new DOMParser()
				const doc = parser.parseFromString(htmlText, 'text/html')

				const inputs = Array.from(
					doc.querySelectorAll('input[name^="level_"]')
				) as HTMLInputElement[]

				for (const inp of inputs) {
					const nameAttr = inp.getAttribute('name') || ''
					let labelText = ''
					const wrapper = inp.closest('.levelWrapper')
					if (wrapper) {
						const span = wrapper.querySelector('span')
						if (span) labelText = span.textContent?.trim() || ''
					}
					if (!labelText) {
						// Fallback: попытаемся извлечь число из соседних текстов или самого nameAttr
						const siblingText = inp.nextSibling?.textContent ?? ''
						const match = (siblingText || nameAttr).toString().match(/\d+/)
						const candidate = match ? match[0] : ''
						labelText = candidate
					}
					if (labelText) {
						levelLabelToName[labelText] = nameAttr
					}
				}

				break
			} catch (error: unknown) {
				const fallbackMessage = error instanceof Error ? error.message : String(error)
				console.error(`[getLevelMapping] Ошибка получения формы (attempt ${attempt}):`, fallbackMessage)
				if (attempt < MAX_RETRIES) {
					console.log(`[getLevelMapping] Ждём 1200ms, затем повтор…`)
					await new Promise(resolve => globalThis.setTimeout(resolve, 1200))
				} else {
					throw new Error(`Не удалось получить маппинг уровней после ${MAX_RETRIES} попыток: ${fallbackMessage}`)
				}
			}
		}

		return levelLabelToName
	}

	/**
	 * Проверяет статус паузы
	 */
	async function checkPauseStatus(): Promise<void> {
		if (progress.pauseRequested) {
			await progress.waitForResume()
		}
	}

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
			// Передаем blockOrder из config для сохранения порядка блоков как в предпросмотре
			const taskPayload = createTaskPayload(store, config, false, store.config.blockOrder)
			if (!taskPayload) {
				throw new Error('Не удалось создать Task пейлоад')
			}

			// Инициализация прогресса
			progress.start('task', 1)
			progress.updateTitle('Отправка задания')

			// Проверка паузы перед отправкой
			await progress.waitForResume()

			// Отправка задания
			await sendTask(taskPayload)

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

					// Создание и отправка объединенного сектора
					const sectorPayload = createSectorPayload(
						[{ ...firstAnswer, variants: combinedVariants }],
						firstAnswer.sectorName || '',
						true
					)
					await sendSector(sectorPayload)

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

					// Создание и отправка сектора
					const sectorPayload = createSectorPayload(
						[sector],
						sector.sectorName || '',
						false
					)
					await sendSector(sectorPayload)

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
			// Для типов с closedPic нужно вычислять ID картинок с учетом блока и глобального счетчика
			interface BonusWithIds {
				bonus: Answer
				closedPicIds?: string[]
			}

			const allBonuses: BonusWithIds[] = []

			if (config.isMultiBlocks) {
				// Для типов с мульти-табами собираем из всех табов
				const levelKey = String(store.levelId) // Номер уровня для ID
				let globalPictureIndex = 1 // Глобальный счетчик картинок для всех блоков (1-based)

				store.tabs.forEach((tab) => {
					tab.answers.forEach((answer: Answer) => {
						// Вычисляем ID картинок для текущего ответа
						const closedPicCount = answer.closedPic?.length || 0
						const closedPicIds: string[] = []

						if (closedPicCount > 0) {
							for (let i = 0; i < closedPicCount; i++) {
								const picId = `${levelKey}_${String(globalPictureIndex).padStart(2, '0')}`
								closedPicIds.push(picId)
								globalPictureIndex++
							}
						}

						// Добавляем только если это бонус
						if (answer.bonus) {
							allBonuses.push({
								bonus: answer,
								closedPicIds: closedPicIds.length > 0 ? closedPicIds : undefined
							})
						}
					})
				})
			} else {
				// Для одиночных типов берем только из активного таба
				const activeTab = store.tabs[store.activeTabIndex]
				if (activeTab) {
					activeTab.answers.forEach((answer: Answer) => {
						if (answer.bonus) {
							allBonuses.push({ bonus: answer })
						}
					})
				}
			}

			if (allBonuses.length === 0) {
				notify.info('Нет отмеченных бонусов', 'Отметьте бонусы для загрузки')
				return
			}

			// Обновление авторизации перед массовой загрузкой
			await authStore.authenticate(store.domain)

			// Получение маппинга уровней для бонусов
			const levelMapping = await getLevelMapping(store.domain, store.gameId, store.levelId)

			// Валидация маппинга (необходим для определения текущего уровня по умолчанию)
			if (Object.keys(levelMapping).length === 0) {
				throw new Error('Не удалось получить маппинг уровней для загрузки бонусов')
			}

			// Инициализация прогресса
			progress.start('bonus', allBonuses.length)

			// Отправка бонусов по одному
			for (let idx = 0; idx < allBonuses.length; idx++) {
				const bonusData = allBonuses[idx]

				// Проверяем паузу перед каждым бонусом
				await progress.waitForResume()

				progress.updateTitle(`Бонус ${bonusData.bonus.number}`)

				// Создание и отправка бонуса через новую систему с передачей closedPicIds
				const bonusPayload = createBonusPayload(bonusData.bonus, levelMapping, bonusData.closedPicIds)
				await sendBonus(bonusPayload)

				progress.updateSuccess(`Бонус ${bonusData.bonus.number} отправлен`)

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

	const correctionsStore = useCorrectionsStore()
	const confirm = useConfirm()

	/**
	 * Строки для отправки: все табы для мульти-блочных типов, иначе активный таб
	 */
	function collectRows(config: LevelTypeConfig): Answer[] {
		return config.isMultiBlocks ? store.allAnswers : store.activeTab?.answers ?? []
	}

	/**
	 * Короткое описание корректировки для прогресса и диалогов
	 */
	function describeCorrection(row: Answer): string {
		const type = row.correctionType ? CORRECTION_TYPES[row.correctionType].label.toLowerCase() : ''
		return `${row.participant?.name || '?'}, ${formatCorrectionLevel(row.correctionLevel)}, ${type}`
	}

	/**
	 * Спрашивает, отправлять ли корректировки, которые уже есть в игре
	 */
	function askAboutDuplicates(duplicates: Answer[]): Promise<DuplicatesDecision> {
		const MAX_SHOWN = 5
		const shown = duplicates.slice(0, MAX_SHOWN).map(describeCorrection).join('; ')
		const more = duplicates.length > MAX_SHOWN ? ` и ещё ${duplicates.length - MAX_SHOWN}` : ''

		return new Promise<DuplicatesDecision>((resolve) => {
			confirm.require({
				header: 'Такие корректировки уже есть в игре',
				message: `Совпадений с внесёнными в EN: ${duplicates.length} (${shown}${more}). Пропустить их и отправить остальные?`,
				icon: 'pi pi-exclamation-triangle',
				acceptLabel: 'Пропустить совпадения',
				rejectLabel: 'Отправить всё',
				rejectClass: 'p-button-outlined',
				accept: () => resolve('skip'),
				reject: () => resolve('all'),
				onHide: () => resolve('cancel')
			})
		})
	}

	/**
	 * Отправляет корректировки результатов по одной с паузой между запросами.
	 * Отправленные строки пропускаются; ошибка строки не останавливает заливку,
	 * потеря сессии или доступа к игре - останавливает
	 */
	async function uploadCorrections(): Promise<void> {
		// Параллельный запуск отправил бы ещё не отправленные строки второй раз
		if (correctionsStore.isUploading) {
			notify.warn('Отправка уже идёт', 'Дождитесь окончания текущей отправки')
			return
		}
		correctionsStore.isUploading = true
		let isStarted = false
		try {
			const config = getLevelTypeConfig(store.levelType)
			if (!config?.payloads.correction) {
				throw new Error(`Тип ${store.levelType} не поддерживает отправку корректировок`)
			}
			if (!store.domain || !store.gameId) {
				throw new Error('Не установлены данные игры (domain, gameId)')
			}

			const pendingRows = collectRows(config).filter(row => !isRowSent(row))
			if (pendingRows.length === 0) {
				notify.info('Нечего отправлять', 'Нет неотправленных строк')
				return
			}

			const game = { domain: store.domain, gameId: store.gameId }

			// Свежие списки участников и уровней: строки проверяются по текущему состоянию игры
			await correctionsStore.loadGameData(game, true)
			correctionsStore.syncRows(pendingRows)

			const invalidCount = pendingRows.reduce((count, row) => {
				const message = validateCorrectionRow(row, correctionsStore.participants, correctionsStore.levels)
				if (!message) return count
				row.status = { state: 'error', message }
				return count + 1
			}, 0)
			if (invalidCount > 0) {
				notify.error('Исправьте строки перед отправкой', `Строк с ошибками: ${invalidCount}. Причина - в колонке «Статус».`)
				return
			}

			// Авторизация только что обновлена загрузкой данных игры
			const existing = await correctionsStore.loadExisting(game, false)
			const existingKeys = new Set(existing.map(getExistingCorrectionKey))
			const duplicates = pendingRows.filter(row => existingKeys.has(getRowCorrectionKey(row)))
			let rowsToSend = pendingRows

			if (duplicates.length > 0) {
				const decision = await askAboutDuplicates(duplicates)
				if (decision === 'cancel') return
				if (decision === 'skip') {
					duplicates.forEach(row => { row.status = { state: 'sent', message: 'Уже была в игре' } })
					rowsToSend = pendingRows.filter(row => !duplicates.includes(row))
				}
			}

			if (rowsToSend.length === 0) {
				notify.info('Нечего отправлять', 'Все корректировки уже есть в игре')
				return
			}

			const levelIdByNumber = new Map(correctionsStore.levels.map(level => [level.number, level.id]))

			progress.start('correction', rowsToSend.length)
			isStarted = true

			for (let idx = 0; idx < rowsToSend.length; idx++) {
				const row = rowsToSend[idx]
				const label = describeCorrection(row)

				await progress.waitForResume()

				// Строку удалили из таблицы во время отправки - она больше не часть заливки
				if (!store.allAnswers.includes(row)) {
					progress.total -= 1
					continue
				}
				progress.updateTitle(label)

				const payload = buildCorrectionPayload({
					...game,
					levelId: row.correctionLevel ? levelIdByNumber.get(row.correctionLevel) || '' : '0',
					// Участник и время гарантированы проверкой строк и syncRows выше
					correctionType: row.correctionType ?? 'bonus',
					participantId: row.participant?.id ?? '',
					time: row.correctionTime ?? DEFAULT_DURATION,
					comment: row.comment?.trim() || ''
				})
				const result = await sendCorrection(payload)

				if (result.ok) {
					row.status = { state: 'sent' }
					progress.updateSuccess(`${label}: отправлено`)
				} else {
					row.status = { state: 'error', message: result.message }
					progress.reportError(`${label}: ${result.message}`)
					if (result.isFatal) {
						progress.abort()
						notify.error('Отправка остановлена', result.message)
						return
					}
				}

				if (idx < rowsToSend.length - 1) {
					await waitBetweenRequests()
					// Каждые 25 корректировок обновляем авторизацию
					if ((idx + 1) % 25 === 0) {
						await authStore.authenticate(store.domain)
					}
				}
			}

			// Все строки удалили во время отправки - завершать нечего
			if (progress.total === 0) {
				progress.close()
				return
			}
			progress.finish()

		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error)
			if (isStarted) {
				progress.reportError(`Ошибка отправки корректировок: ${message}`)
				progress.abort()
			}
			notify.error('Ошибка отправки корректировок', message)
			throw error
		} finally {
			correctionsStore.isUploading = false
		}
	}

	return {
		createSectorPayload,
		createBonusPayload,
		uploadTask,
		uploadSectors,
		uploadBonuses,
		uploadCorrections
	}
}

