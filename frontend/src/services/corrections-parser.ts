/**
 * Парсер страниц корректировок результатов EN (GameBonusPenaltyTime.aspx)
 */

import type { ExistingCorrection, GameLevelOption, GameParticipant } from '@/entities/level/types'
import { parseTimeToSeconds } from '@/utils/time-parser'

/** Текст причины для корректировок, добавленных вручную (страница запрашивается с lang=ru) */
const MANUAL_REASON = 'добавлен администратором'

/** Значение опции "все уровни" в форме EN */
const ALL_LEVELS_VALUE = '0'

export interface CorrectionFormData {
  participants: GameParticipant[]
  levels: GameLevelOption[]
}

function parseHtml(html: string): globalThis.Document {
  return new globalThis.DOMParser().parseFromString(html, 'text/html')
}

function normalizeText(text: string | null | undefined): string {
  return text?.replace(/\s+/g, ' ').trim() || ''
}

function getText(element: globalThis.Element | null): string {
  return normalizeText(element?.textContent)
}

/**
 * Текст HTML так, как его показывает EN в ячейке: без тегов, с одинарными пробелами
 */
export function htmlToText(html: string): string {
  return normalizeText(parseHtml(html).body.textContent)
}

/**
 * Извлекает участников и уровни игры из формы добавления корректировки
 */
export function parseCorrectionForm(html: string): CorrectionFormData {
  const doc = parseHtml(html)
  const select = (name: string): globalThis.HTMLOptionElement[] =>
    Array.from(doc.querySelectorAll<globalThis.HTMLOptionElement>(`select[name="${name}"] option`))

  const participants = select('ddlEditCorrectionPlayers')
    .map(option => ({ id: option.value, name: getText(option) }))
    .filter(participant => participant.id && participant.name)

  const levels = select('ddlEditCorrectionLevels')
    .filter(option => option.value && option.value !== ALL_LEVELS_VALUE)
    .map(option => ({ id: option.value, number: getText(option) }))

  if (participants.length === 0 && levels.length === 0) {
    throw new Error('На странице EN нет формы корректировок. Проверьте ID игры и права автора.')
  }

  return { participants, levels }
}

/**
 * Извлекает список внесённых корректировок игры
 */
export function parseCorrectionsList(html: string): ExistingCorrection[] {
  const doc = parseHtml(html)

  return Array.from(doc.querySelectorAll('tr.toWinnerItem')).flatMap(row => {
    const cells = row.querySelectorAll(':scope > td')
    if (cells.length < 6) return []

    const timeLink = cells[4].querySelector<globalThis.HTMLAnchorElement>('a[href*="correct="]')
    const timeText = getText(timeLink)  // "бонус 1 минута 5 секунд"
    const isPenalty = timeLink?.id.endsWith('lnkPenalty') === true
    const participant = getText(cells[1].querySelector('a[id$="lnkTeamInfo"]'))
      || getText(cells[1].querySelector('a[id$="lnkPlayerInfo"]'))
    const reason = getText(cells[3])

    return [{
      id: timeLink?.getAttribute('href')?.match(/correct=(\d+)/)?.[1] || '',
      dateTime: getText(cells[0]),
      participant,
      level: getText(cells[2]),
      reason,
      isManual: reason === MANUAL_REASON,
      type: isPenalty ? 'penalty' : 'bonus',
      seconds: parseTimeToSeconds(timeText),
      comment: getText(cells[5])
    }]
  })
}
