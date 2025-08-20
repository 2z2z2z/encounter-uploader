import type { Ref } from 'vue'

export type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'

export interface BonusTime {
  hours: number
  minutes: number
  seconds: number
  negative: boolean
}

export interface AnswerRow {
  number: number
  variants: string[]
  inSector: boolean
  inBonus: boolean
  bonusTime: BonusTime
  closedText: string
  displayText: string
}

/** Массово применяет режим закрытия уровня к массиву ответов. */
export function applySectorModeToAnswers(
  mode: SectorMode,
  totalSectors: number,
  answers: Ref<AnswerRow[]>
): void {
  if (!answers.value) return
  const half = Math.floor((totalSectors + 1) / 2)
  switch (mode) {
    case 'all':
      answers.value.forEach((r) => (r.inSector = true))
      break
    case 'initialAndFinal':
      answers.value.forEach((r) => {
        r.inSector = r.number <= half || r.number === totalSectors
      })
      break
    case 'finalOnly':
      answers.value.forEach((r) => {
        r.inSector = r.number === totalSectors
      })
      break
    case 'custom':
      // оставляем как есть
      break
  }
}

/** Массово проставляет открытые сектора из первого варианта ответа. */
export function fillOpenSectorsFromFirstVariant(answers: Ref<AnswerRow[]>): void {
  if (!answers.value) return
  answers.value.forEach((r) => {
    r.displayText = r.variants[0] || ''
  })
}

/** Массово применяет шаблон закрытого сектора c заменой & на номер. */
export function applyClosedPatternToAnswers(pattern: string, answers: Ref<AnswerRow[]>): void {
  if (!answers.value) return
  answers.value.forEach((r) => {
    r.closedText = (pattern || '').replace(/&/g, String(r.number))
  })
}

/** Массово применяет «Быстрое бонусное время». */
export function applyQuickBonusTimeToAnswers(
  quick: BonusTime,
  answers: Ref<AnswerRow[]>
): void {
  if (!answers.value) return
  answers.value.forEach((r) => (r.bonusTime = { ...quick }))
}


