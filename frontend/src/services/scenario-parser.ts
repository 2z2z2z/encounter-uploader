/**
 * Парсер сценариев Encounter
 *
 * Парсит HTML страницу сценария и извлекает данные об уровнях.
 */

import type { ScenarioLevel, LevelCheckResult, CheckStatus } from '@/store/checker'
import { parseTimeToSeconds, formatSecondsToString } from '@/utils/time-parser'

/** Результат парсинга сценария */
export interface ParsedScenario {
  gameName: string
  levels: ScenarioLevel[]
  stats: {
    totalLevels: number
    totalSectors: number
    totalHints: number
  }
}

/**
 * Определяет статус проверки для текстового поля
 */
function getTextFieldStatus(value: string | null): CheckStatus {
  return value && value.trim() ? 'ok' : 'error'
}

/**
 * Определяет статус проверки для количества частей (предупреждение если пусто)
 */
function getPartsStatus(value: string | null): CheckStatus {
  return value && value.trim() ? 'ok' : 'warning'
}

/**
 * Определяет статус проверки подсказок
 * 2 подсказки = ok, 1 = warning, 0 = error
 */
function getHintsStatus(count: number): CheckStatus {
  if (count >= 2) return 'ok'
  if (count === 1) return 'warning'
  return 'error'
}

/**
 * Определяет статус проверки секторов
 * Все заполнены = ok, есть незаполненные = error
 */
function getSectorsStatus(sectorsCount: number, sectorsWithAnswers: number): CheckStatus {
  if (sectorsCount === 0) return 'error'
  return sectorsWithAnswers >= sectorsCount ? 'ok' : 'error'
}

/**
 * Определяет статус проверки автоперехода
 * Заполнено = ok, пусто = error
 */
function getAutoTransitionStatus(value: string | null): CheckStatus {
  return value && value.trim() ? 'ok' : 'error'
}

/**
 * Определяет статус проверки штрафа
 * Заполнено = ok, пусто = warning (предупреждение, не ошибка)
 */
function getPenaltyStatus(value: string | null): CheckStatus {
  return value && value.trim() ? 'ok' : 'warning'
}

/**
 * Определяет статус проверки бонусов
 * Все заполнены = ok, есть незаполненные = error, нет бонусов = ok (показываем прочерк в UI)
 */
function getBonusesStatus(bonusCount: number, bonusesWithAnswers: number): CheckStatus {
  if (bonusCount === 0) return 'ok'
  return bonusesWithAnswers === bonusCount ? 'ok' : 'error'
}

/**
 * Вычисляет результаты проверки уровня
 */
function calculateCheckResults(level: Omit<ScenarioLevel, 'checks'>): LevelCheckResult {
  return {
    name: getTextFieldStatus(level.name),
    codesLocation: getTextFieldStatus(level.codesLocation),
    codesType: getTextFieldStatus(level.codesType),
    codesParts: getPartsStatus(level.codesParts),
    codesFormat: getTextFieldStatus(level.codesFormat),
    hints: getHintsStatus(level.hintsCount),
    sectors: getSectorsStatus(level.sectorsCount, level.sectorsWithAnswers),
    autoTransition: getAutoTransitionStatus(level.autoTransition),
    penalty: getPenaltyStatus(level.penalty),
    bonuses: getBonusesStatus(level.bonusCount, level.bonusesWithAnswers)
  }
}

/**
 * Извлекает текст после метки из содержимого задания
 * Например: "Местонахождение кодов:" -> значение после двоеточия
 */
function extractFieldValue(taskHtml: string, fieldLabel: string): string | null {
  // Ищем паттерн: <span style="color: #00FFFF">Метка:</span> значение
  const regex = new RegExp(
    `<span[^>]*>\\s*${escapeRegex(fieldLabel)}:?\\s*</span>\\s*([^<]+)`,
    'i'
  )
  const match = taskHtml.match(regex)
  if (match && match[1]) {
    return match[1].trim()
  }

  // Альтернативный паттерн без span
  const simpleRegex = new RegExp(`${escapeRegex(fieldLabel)}:?\\s*([^<\\n]+)`, 'i')
  const simpleMatch = taskHtml.match(simpleRegex)
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1].trim()
  }

  return null
}

/**
 * Экранирует специальные символы regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Извлекает значение поля "ФО" по четким паттернам:
 * - <span...>ФО:</span> значение
 * - <span...>ФО (любой текст):</span> значение
 * - <span...><b>ФО:</b></span> значение
 * - <span...><b>ФО (любой текст):</b></span> значение
 * - <span...><b>ФО:</b> значение </span> (значение внутри span)
 * - <span...><b>ФО (любой текст):</b> значение </span>
 */
function extractCodesFormat(taskHtml: string): string | null {
  /**
   * Паттерн 1: значение ПОСЛЕ закрывающего </span>
   *
   * Структура regex:
   * - <span[^>]*>     - открывающий тег span с любыми атрибутами
   * - (?:<b>)?        - опциональный тег <b>
   * - \s*ФО           - текст "ФО" с возможными пробелами перед
   * - (?:\s*\([^)]*\))? - опциональная скобка с содержимым, например "(Сектор 1)"
   * - :\s*            - двоеточие с пробелами
   * - (?:<\/b>)?      - опциональный закрывающий </b>
   * - <\/span>        - закрывающий тег </span>
   * - \s*             - пробелы
   * - ([^<]+)         - ЗАХВАТ: текст до следующего тега (значение ФО)
   *
   * @example
   * Входной HTML: <span class="TaskText">ФО:</span> цифры
   * Результат: "цифры"
   */
  const regex1 = /<span[^>]*>(?:<b>)?\s*ФО(?:\s*\([^)]*\))?:\s*(?:<\/b>)?<\/span>\s*([^<]+)/i
  const match1 = taskHtml.match(regex1)
  if (match1 && match1[1]?.trim()) {
    return match1[1].trim()
  }

  /**
   * Паттерн 2: значение ВНУТРИ span после </b>
   *
   * @example
   * Входной HTML: <span class="TaskText"><b>ФО:</b> буквы </span>
   * Результат: "буквы"
   */
  const regex2 = /<span[^>]*><b>\s*ФО(?:\s*\([^)]*\))?:\s*<\/b>\s*([^<]+)\s*<\/span>/i
  const match2 = taskHtml.match(regex2)
  if (match2 && match2[1]?.trim()) {
    return match2[1].trim()
  }

  return null
}

/**
 * Парсит бонусы уровня из HTML блока сценария
 * Логика: между каждым lblBonusNum должен быть хотя бы один lblBonusAnswer
 */
function parseBonuses(scenarioBlock: globalThis.Element): { bonusCount: number; bonusesWithAnswers: number } {
  // Получаем все элементы с нужными id в порядке появления в DOM
  const allElements = scenarioBlock.querySelectorAll('[id*="lblBonusNum"], [id*="lblBonusAnswer"]')

  let bonusCount = 0
  let bonusesWithAnswers = 0
  let currentBonusHasAnswer = false

  allElements.forEach((el) => {
    const id = el.id || ''
    if (id.includes('lblBonusNum')) {
      // Новый бонус - сохраняем статус предыдущего
      if (bonusCount > 0 && currentBonusHasAnswer) {
        bonusesWithAnswers++
      }
      bonusCount++
      currentBonusHasAnswer = false
    } else if (id.includes('lblBonusAnswer')) {
      currentBonusHasAnswer = true
    }
  })

  // Проверяем последний бонус
  if (bonusCount > 0 && currentBonusHasAnswer) {
    bonusesWithAnswers++
  }

  return { bonusCount, bonusesWithAnswers }
}

/**
 * Парсит суммарное бонусное время из блока сценария
 * Ищет несколько вариантов:
 * - <span class="green">Бонусное время: {TIME}</span>
 * - <span style="color: green;">Бонусное время: {TIME}</span>
 * - Любой span содержащий "Бонусное время:"
 */
function parseBonusTime(scenarioBlock: globalThis.Element): string | null {
  let totalSeconds = 0

  // Способ 1: Ищем по классу green
  const greenSpans = scenarioBlock.querySelectorAll('span.green')
  greenSpans.forEach((span) => {
    const text = span.textContent || ''
    const match = text.match(/Бонусное время:\s*(.+)/i)
    if (match) {
      totalSeconds += parseTimeToSeconds(match[1].trim())
    }
  })

  // Способ 2: Ищем все span и проверяем inline style или текст
  if (totalSeconds === 0) {
    const allSpans = scenarioBlock.querySelectorAll('span')
    allSpans.forEach((span) => {
      const text = span.textContent || ''
      const match = text.match(/Бонусное время:\s*(.+)/i)
      if (match) {
        totalSeconds += parseTimeToSeconds(match[1].trim())
      }
    })
  }

  // Способ 3: Ищем через регулярку в innerHTML (на случай если структура сложная)
  if (totalSeconds === 0) {
    const html = scenarioBlock.innerHTML
    const regex = /Бонусное время:\s*([^<]+)/gi
    let regexMatch
    while ((regexMatch = regex.exec(html)) !== null) {
      if (regexMatch[1]) {
        totalSeconds += parseTimeToSeconds(regexMatch[1].trim())
      }
    }
  }

  return totalSeconds > 0 ? formatSecondsToString(totalSeconds) : null
}

/**
 * Извлекает название игры из HTML страницы сценария
 */
function extractGameName(doc: globalThis.Document): string {
  // Ищем в блоке с id="lnkGameInfo"
  const gameInfoElement = doc.querySelector('#lnkGameInfo')
  if (gameInfoElement) {
    return gameInfoElement.textContent?.trim() || ''
  }

  // Альтернативно ищем по частичному совпадению id
  const gameInfoAlt = doc.querySelector('[id*="lnkGameInfo"]')
  if (gameInfoAlt) {
    return gameInfoAlt.textContent?.trim() || ''
  }

  return ''
}

/**
 * Парсит HTML сценария и возвращает структурированные данные
 */
export function parseScenarioHtml(html: string): ParsedScenario {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Извлекаем название игры
  const gameName = extractGameName(doc)

  const levels: ScenarioLevel[] = []

  // Находим все якоря уровней: <a name="1">, <a name="2">, etc.
  const levelAnchors = doc.querySelectorAll('a[name]')

  levelAnchors.forEach((anchor) => {
    const nameAttr = anchor.getAttribute('name')
    if (!nameAttr || !/^\d+$/.test(nameAttr)) return

    const levelNumber = parseInt(nameAttr, 10)

    // Ищем родительский div с информацией об уровне
    const parentDiv = anchor.closest('div.Text8')
    if (!parentDiv) return

    // Извлекаем название уровня из текста
    // Формат: Уровень №1 "Название"
    const levelText = parentDiv.textContent || ''
    const nameMatch = levelText.match(/Уровень\s*№\d+\s*[""«]([^""»]+)[""»]/)
    const levelName = nameMatch ? nameMatch[1].trim() : null

    // Находим блок сценария для этого уровня
    // scenarioBlock идёт сразу после div.Text8
    let scenarioBlock: globalThis.Element | null = null
    const nextSibling = parentDiv.nextElementSibling
    if (nextSibling?.classList.contains('scenarioBlock')) {
      scenarioBlock = nextSibling
    } else {
      scenarioBlock = findNextScenarioBlock(parentDiv)
    }

    let codesLocation: string | null = null
    let codesType: string | null = null
    let codesParts: string | null = null
    let codesFormat: string | null = null
    let hintsCount = 0
    let sectorsCount = 0
    let sectorsWithAnswers = 0
    let autoTransition: string | null = null
    let penalty: string | null = null
    let bonusCount = 0
    let bonusesWithAnswers = 0
    let bonusTime: string | null = null

    if (scenarioBlock) {
      const blockHtml = scenarioBlock.innerHTML

      // Извлекаем автопереход и штраф
      // Формат: "Автопереход: через 20 минут, штраф 1 минуту"
      const autoMatch = blockHtml.match(/Автопереход:\s*([^<]+)/)
      if (autoMatch) {
        const fullAutoTransition = autoMatch[1].trim()
        // Разбиваем на время и штраф
        const penaltyInAutoMatch = fullAutoTransition.match(/(.+?),\s*штраф\s+(.+)/)
        if (penaltyInAutoMatch) {
          // Убираем "через " из времени автоперехода
          autoTransition = penaltyInAutoMatch[1].trim().replace(/^через\s+/i, '')
          penalty = penaltyInAutoMatch[2].trim()
        } else {
          // Убираем "через " если нет штрафа
          autoTransition = fullAutoTransition.replace(/^через\s+/i, '')
        }
      }

      // Также проверяем отдельное поле "Штраф за автопереход"
      if (!penalty) {
        const penaltyMatch = blockHtml.match(/Штраф за автопереход:\s*([^<]+)/)
        if (penaltyMatch) {
          penalty = penaltyMatch[1].trim()
        }
      }

      // Находим блок с заданием (lblLevelTask, но не lblLevelTaskTitle)
      // Используем CSS селектор: id содержит "lblLevelTask" но не заканчивается на "Title"
      const taskElement = scenarioBlock.querySelector('[id*="lblLevelTask"]:not([id$="Title"])')
      if (taskElement) {
        const taskHtml = taskElement.innerHTML

        // Извлекаем поля
        codesLocation = extractFieldValue(taskHtml, 'Местонахождение кодов')
        codesType = extractFieldValue(taskHtml, 'Тип кодов')
        codesParts = extractFieldValue(taskHtml, 'Количество частей')
        codesFormat = extractCodesFormat(taskHtml)

      }

      // Считаем подсказки по id содержащим lblLevelHelpTitle
      const hintTitles = scenarioBlock.querySelectorAll('[id*="lblLevelHelpTitle"]')
      hintsCount = hintTitles.length

      // Считаем секторы
      const sectorDivs = scenarioBlock.querySelectorAll('[id*="divSectorName"]')
      if (sectorDivs.length > 0) {
        sectorsCount = sectorDivs.length
        // Проверяем каждый сектор на наличие ответов
        sectorDivs.forEach((sectorDiv) => {
          // Ищем ответы после этого сектора до следующего сектора или конца блока
          let nextSibling = sectorDiv.nextElementSibling
          let hasAnswers = false

          while (nextSibling) {
            // Если встретили следующий сектор - прекращаем
            if (nextSibling.id?.includes('divSectorName')) break

            // Проверяем наличие ответа
            if (nextSibling.id?.includes('lblLevelAnswer') ||
                nextSibling.querySelector?.('[id*="lblLevelAnswer"]')) {
              hasAnswers = true
              break
            }

            nextSibling = nextSibling.nextElementSibling
          }

          if (hasAnswers) {
            sectorsWithAnswers++
          }
        })
      } else {
        // Если нет явных секторов, проверяем наличие ответов напрямую
        const answers = scenarioBlock.querySelectorAll('[id*="lblLevelAnswer"]')
        if (answers.length > 0) {
          sectorsCount = 1
          sectorsWithAnswers = 1
        }
      }

      // Парсим бонусы
      const bonusesData = parseBonuses(scenarioBlock)
      bonusCount = bonusesData.bonusCount
      bonusesWithAnswers = bonusesData.bonusesWithAnswers

      // Парсим бонусное время
      bonusTime = parseBonusTime(scenarioBlock)
    }

    const levelData: Omit<ScenarioLevel, 'checks'> = {
      number: levelNumber,
      name: levelName,
      codesLocation,
      codesType,
      codesParts,
      codesFormat,
      hintsCount,
      sectorsCount,
      sectorsWithAnswers,
      autoTransition,
      penalty,
      bonusCount,
      bonusesWithAnswers,
      bonusTime
    }

    levels.push({
      ...levelData,
      checks: calculateCheckResults(levelData)
    })
  })

  // Сортируем уровни по номеру
  levels.sort((a, b) => a.number - b.number)

  return {
    gameName,
    levels,
    stats: {
      totalLevels: levels.length,
      totalSectors: levels.reduce((sum, level) => sum + level.sectorsCount, 0),
      totalHints: levels.reduce((sum, level) => sum + level.hintsCount, 0)
    }
  }
}

/**
 * Находит следующий блок сценария после элемента
 */
function findNextScenarioBlock(element: globalThis.Element): globalThis.Element | null {
  let current: globalThis.Element | null = element
  while (current) {
    current = current.nextElementSibling
    if (current?.classList.contains('scenarioBlock')) {
      return current
    }
    // Проверяем вложенные элементы
    const nested = current?.querySelector('.scenarioBlock')
    if (nested) return nested
  }
  return null
}

// Реэкспорт утилит для обратной совместимости
export { isValidScenarioUrl, extractDomainFromUrl, extractGameIdFromUrl } from '@/utils/scenario-url'
