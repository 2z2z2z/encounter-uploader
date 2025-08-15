import { ref, computed, Ref } from 'vue'
import type { Answer, SectorMode, BonusTime } from '../types'

export function useOlympLogic(sectorsCount: number) {
  const initialSectors = computed(() => Math.floor((sectorsCount + 1) / 2))
  
  /**
   * Создает начальный массив ответов
   */
  function createAnswers(count: number): Answer[] {
    return Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      variants: [''],
      inSector: true,
      inBonus: true,
      bonusTime: {
        hours: 0,
        minutes: 0,
        seconds: 0,
        negative: false,
      },
      closedText: '',
      displayText: '',
    }))
  }
  
  /**
   * Применяет режим закрытия секторов
   */
  function applySectorMode(mode: SectorMode, answers: Ref<Answer[]>) {
    switch (mode) {
      case 'all':
        answers.value.forEach((r) => (r.inSector = true))
        break
      case 'initialAndFinal':
        answers.value.forEach((r) => {
          r.inSector = r.number <= initialSectors.value || r.number === sectorsCount
        })
        break
      case 'finalOnly':
        answers.value.forEach((r) => {
          r.inSector = r.number === sectorsCount
        })
        break
      case 'custom':
        // Ничего не делаем, пользователь сам выбирает
        break
    }
  }
  
  /**
   * Заполняет открытые сектора из первого варианта
   */
  function fillOpenSectors(answers: Ref<Answer[]>) {
    answers.value.forEach((r) => {
      r.displayText = r.variants[0] || ''
    })
  }
  
  /**
   * Применяет быстрое бонусное время ко всем ответам
   */
  function applyQuickTime(answers: Ref<Answer[]>, quickTime: BonusTime) {
    answers.value.forEach((r) => {
      r.bonusTime = { ...quickTime }
    })
  }
  
  /**
   * Применяет шаблон закрытого сектора
   */
  function applyClosedPattern(answers: Ref<Answer[]>, pattern: string) {
    if (!pattern) return
    
    answers.value.forEach((r) => {
      if (pattern.includes('&')) {
        r.closedText = pattern.replace('&', String(r.number))
      } else {
        r.closedText = pattern
      }
    })
  }
  
  /**
   * Добавляет вариант ответа
   */
  function addVariant(row: Answer) {
    if (row.variants.length < 10) {
      row.variants.push('')
    }
  }
  
  /**
   * Удаляет вариант ответа
   */
  function removeVariant(row: Answer, index: number) {
    if (row.variants.length > 1) {
      row.variants.splice(index, 1)
    }
  }
  
  /**
   * Очищает все данные формы
   */
  function clearFormData(answers: Ref<Answer[]>) {
    answers.value = createAnswers(sectorsCount)
  }
  
  /**
   * Валидирует данные перед отправкой
   */
  function validateData(answers: Answer[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Проверяем, что есть хотя бы один сектор или бонус
    const hasSectors = answers.some(a => a.inSector)
    const hasBonuses = answers.some(a => a.inBonus)
    
    if (!hasSectors && !hasBonuses) {
      errors.push('Должен быть выбран хотя бы один сектор или бонус')
    }
    
    // Проверяем, что все отмеченные сектора имеют хотя бы один вариант ответа
    answers.forEach(a => {
      if (a.inSector || a.inBonus) {
        const hasValidVariant = a.variants.some(v => v.trim() !== '')
        if (!hasValidVariant) {
          errors.push(`Ответ №${a.number} должен иметь хотя бы один вариант`)
        }
      }
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  return {
    initialSectors,
    createAnswers,
    applySectorMode,
    fillOpenSectors,
    applyQuickTime,
    applyClosedPattern,
    addVariant,
    removeVariant,
    clearFormData,
    validateData
  }
}