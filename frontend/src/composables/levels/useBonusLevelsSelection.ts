import type { Answer } from "@/entities/level/types"

export interface LevelsSelection {
  allLevels: boolean
  targetLevels?: string[]
}

function normalizeLevels(levels: unknown): string[] {
  if (!Array.isArray(levels)) {
    return []
  }

  return Array.from(new Set(
    levels
      .map(level => String(level ?? '').trim())
      .filter(Boolean)
  ))
}

/**
 * Создает начальное состояние выбора уровней на основе первого ответа
 * @param answers - массив ответов для анализа
 * @param currentLevel - текущий уровень для выбора по умолчанию
 */
export function buildInitialSelection(
  answers: Answer[] | undefined,
  currentLevel?: string
): LevelsSelection {
  if (!answers || answers.length === 0) {
    // По умолчанию выбираем текущий уровень вместо "все уровни"
    return {
      allLevels: false,
      targetLevels: currentLevel ? [currentLevel] : []
    }
  }

  const first = answers[0]
  const rawLevels = Array.isArray(first.bonusLevels) ? first.bonusLevels : undefined
  const currentLevels = normalizeLevels(rawLevels)
  const allLevels = Array.isArray(first.bonusLevels) ? first.bonusLevels.length === 0 : false

  if (allLevels) {
    // Если в строке выбраны "все уровни", то и в модале должно быть "все уровни"
    return {
      allLevels: true,
      targetLevels: undefined
    }
  }

  if (currentLevels.length === 0) {
    return {
      allLevels: false,
      targetLevels: currentLevel ? [currentLevel] : []
    }
  }

  // Если в строке выбраны конкретные уровни, показываем их
  return {
    allLevels: false,
    targetLevels: currentLevels
  }
}

/**
 * Быстро сравнивает два массива строк без поэлементного перебора
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  return a.every((value, index) => value === b[index])
}

/**
 * Применяет выбор уровней ко всем ответам в массиве
 * @param selection - выбор уровней
 * @param answers - массив ответов для изменения
 * @returns true если были внесены изменения
 */
export function applyLevelsToAnswers(
  selection: LevelsSelection,
  answers: Answer[]
): boolean {
  if (!answers || answers.length === 0) return false

  const normalized = selection.allLevels
    ? []
    : normalizeLevels(selection.targetLevels)

  let hasChanges = false

  answers.forEach((answer) => {
    const hasExplicitArray = Array.isArray(answer.bonusLevels)
    const previous = normalizeLevels(answer.bonusLevels)

    if (selection.allLevels) {
      const currentLength = hasExplicitArray ? (answer.bonusLevels?.length ?? 0) : -1
      if (!hasExplicitArray || currentLength !== 0) {
        answer.bonusLevels = []
        hasChanges = true
      }
      return
    }

    if (!arraysEqual(previous, normalized)) {
      answer.bonusLevels = normalized.slice()
      hasChanges = true
      return
    }

    if (!hasExplicitArray || !arraysEqual((answer.bonusLevels ?? []) as string[], normalized)) {
      answer.bonusLevels = normalized.slice()
      hasChanges = true
    }
  })

  return hasChanges
}

/**
 * Применяет выбор уровней к конкретному ответу
 * @param selection - выбор уровней
 * @param answer - ответ для изменения
 * @returns true если были внесены изменения
 */
export function applyLevelsToAnswer(
  selection: LevelsSelection,
  answer: Answer
): boolean {
  const normalized = selection.allLevels
    ? []
    : normalizeLevels(selection.targetLevels)

  const hasExplicitArray = Array.isArray(answer.bonusLevels)
  const previous = normalizeLevels(answer.bonusLevels)

  if (selection.allLevels) {
    const currentLength = hasExplicitArray ? (answer.bonusLevels?.length ?? 0) : -1
    if (!hasExplicitArray || currentLength !== 0) {
      answer.bonusLevels = []
      return true
    }
    return false
  }

  if (!arraysEqual(previous, normalized)) {
    answer.bonusLevels = normalized.slice()
    return true
  }

  if (!hasExplicitArray || !arraysEqual((answer.bonusLevels ?? []) as string[], normalized)) {
    answer.bonusLevels = normalized.slice()
    return true
  }

  return false
}
