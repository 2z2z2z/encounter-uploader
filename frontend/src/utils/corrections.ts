/**
 * Утилиты для строк корректировок результатов
 */

import type {
  Answer,
  CorrectionType,
  DurationValue,
  ExistingCorrection,
  GameLevelOption,
  GameParticipant
} from '@/entities/level/types'
import {
  ALL_LEVELS_OPTION,
  CORRECTION_TYPES,
  DEFAULT_ROW_STATUS,
  MAX_CORRECTION_COMMENT_LENGTH
} from '@/entities/level/constants'
import { htmlToText } from '@/services/corrections-parser'

const SECONDS_IN_DAY = 24 * 60 * 60

/**
 * Ключ игры для привязки таблицы: домен и ID игры
 */
export function createGameKey(domain: string, gameId: string | number): string {
  return `${domain}|${gameId}`
}

/**
 * Переводит длительность в секунды
 */
export function durationToSeconds(time: DurationValue | undefined): number {
  if (!time) return 0
  return (time.days || 0) * SECONDS_IN_DAY
    + (time.hours || 0) * 3600
    + (time.minutes || 0) * 60
    + (time.seconds || 0)
}

/**
 * Строка уже отправлена в EN (редактировать и отправлять повторно нельзя)
 */
export function isRowSent(row: Answer): boolean {
  return row.status?.state === 'sent'
}

/**
 * Применяет правку к строке и сбрасывает её ошибку, чтобы статус не вводил в заблуждение
 */
export function editRow(row: Answer, mutate: (row: Answer) => void): void {
  mutate(row)
  if (row.status?.state === 'error') {
    row.status = { ...DEFAULT_ROW_STATUS }
  }
}

/**
 * Применяет изменение ко всем неотправленным строкам
 */
export function applyToEditableRows(rows: Answer[] | undefined, mutate: (row: Answer) => void): void {
  rows?.filter(row => !isRowSent(row)).forEach(row => editRow(row, mutate))
}

/** Значение уровня строки -> значение Select */
export function toLevelSelectValue(level: string | undefined): string {
  return level || ALL_LEVELS_OPTION.value
}

/** Значение Select -> значение уровня строки */
export function fromLevelSelectValue(value: string): string {
  return value === ALL_LEVELS_OPTION.value ? '' : value
}

/**
 * Pass-through для SelectButton типа корректировки: выбранный вариант подсвечивается цветом типа
 */
export function getCorrectionTypePt(type: CorrectionType | null | undefined): Record<string, unknown> {
  const activeClass = type ? CORRECTION_TYPES[type].activeClass : undefined
  return {
    pcToggleButton: {
      content: ({ context }: { context: { active: boolean } }) => ({ class: context.active ? activeClass : undefined })
    }
  }
}

/**
 * Подпись уровня корректировки
 */
export function formatCorrectionLevel(level: string | undefined): string {
  return level ? `уровень ${level}` : 'все уровни'
}

/**
 * Ищет участника в списке игры: по ID, затем по имени
 */
export function findParticipant(
  participant: GameParticipant | null | undefined,
  participants: GameParticipant[]
): GameParticipant | undefined {
  if (!participant) return undefined
  const byId = participant.id ? participants.find(item => item.id === participant.id) : undefined
  if (byId) return byId

  const name = participant.name.trim().toLowerCase()
  return name ? participants.find(item => item.name.trim().toLowerCase() === name) : undefined
}

/**
 * Проверяет строку перед отправкой. Возвращает текст ошибки или пустую строку
 */
export function validateCorrectionRow(
  row: Answer,
  participants: GameParticipant[],
  levels: GameLevelOption[]
): string {
  if (!row.participant?.name) return 'Не выбран участник'
  if (!findParticipant(row.participant, participants)) return 'Участника нет в этой игре'
  if (row.correctionLevel && !levels.some(level => level.number === row.correctionLevel)) {
    return 'Уровня нет в этой игре'
  }
  if (durationToSeconds(row.correctionTime) <= 0) return 'Время должно быть больше нуля'

  const comment = row.comment?.trim() || ''
  if (!comment) return 'Нужен комментарий'
  if (comment.length > MAX_CORRECTION_COMMENT_LENGTH) {
    return `Комментарий длиннее ${MAX_CORRECTION_COMMENT_LENGTH} символов`
  }
  return ''
}

/**
 * Ключ сравнения корректировок: участник, уровень, тип, время и комментарий в виде, как их показывает EN
 */
function createCorrectionKey(participant: string, level: string, type: string, seconds: number, comment: string): string {
  return [participant.trim().toLowerCase(), level, type, seconds, comment].join('\u0000')
}

/**
 * Ключ корректировки, уже внесённой в игру
 */
export function getExistingCorrectionKey(item: ExistingCorrection): string {
  return createCorrectionKey(item.participant, item.level, item.type, item.seconds, item.comment)
}

/**
 * Ключ строки таблицы, сравнимый с ключом внесённой корректировки
 */
export function getRowCorrectionKey(row: Answer): string {
  return createCorrectionKey(
    row.participant?.name || '',
    row.correctionLevel || '',
    row.correctionType || '',
    durationToSeconds(row.correctionTime),
    htmlToText(row.comment || '')
  )
}
