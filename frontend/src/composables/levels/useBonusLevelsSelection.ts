import type { Answer } from "@/entities/level/types"

export interface LevelsSelection {
  allLevels: boolean
  targetLevels?: string[]
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
  const currentLevels = Array.isArray(first.bonusLevels) ? [...first.bonusLevels] : []
  const allLevels = currentLevels.length === 0

  if (allLevels) {
    // Если в строке выбраны "все уровни", то и в модале должно быть "все уровни"
    return {
      allLevels: true,
      targetLevels: undefined
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
  return a.length === b.length && a.join('|') === b.join('|')
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
    : Array.from(new Set(selection.targetLevels || [])).map(String)

  let hasChanges = false

  answers.forEach((answer) => {
    const previous = Array.isArray(answer.bonusLevels) ? answer.bonusLevels : []

    if (!arraysEqual(previous, normalized)) {
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
    : Array.from(new Set(selection.targetLevels || [])).map(String)

  const previous = Array.isArray(answer.bonusLevels) ? answer.bonusLevels : []

  if (!arraysEqual(previous, normalized)) {
    answer.bonusLevels = normalized.slice()
    return true
  }

  return false
}