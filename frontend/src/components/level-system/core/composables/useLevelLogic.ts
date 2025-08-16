/**
 * useLevelLogic - общая логика уровней
 * Реализация согласно плану рефакторинга (Фаза 1.4)
 */

import { ref, computed, watch } from 'vue'
import type { LevelTypeDefinition, LevelState, UniversalAnswer, LevelConfig, ValidationResult } from '../types/LevelType'

export function useLevelLogic(levelType: LevelTypeDefinition) {
  // ============================================================================
  // СОСТОЯНИЕ
  // ============================================================================
  
  const data = ref<UniversalAnswer[]>([])
  const config = ref<LevelConfig>(levelType.defaultConfig)
  const error = ref<string | null>(null)
  const isLoading = ref(false)
  const lastModified = ref(new Date())
  
  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  const currentState = computed<LevelState>(() => ({
    type: levelType.name,
    config: config.value,
    data: data.value,
    metadata: {},
    lastModified: lastModified.value,
    version: '1.0'
  }))
  
  const isValid = computed(() => {
    try {
      const validation = levelType.validator(data.value)
      return validation.valid
    } catch {
      return false
    }
  })
  
  const validationResult = computed<ValidationResult>(() => {
    try {
      return levelType.validator(data.value)
    } catch (error) {
      return {
        valid: false,
        errors: [`Ошибка валидации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`]
      }
    }
  })
  
  const hasData = computed(() => {
    return data.value.length > 0 && data.value.some(item => 
      item.variants.some(v => v.trim()) || item.inSector || item.inBonus
    )
  })
  
  // ============================================================================
  // МЕТОДЫ УПРАВЛЕНИЯ ДАННЫМИ
  // ============================================================================
  
  function updateData(newData: UniversalAnswer[]) {
    data.value = newData
    lastModified.value = new Date()
    error.value = null
  }
  
  function updateConfig(newConfig: Partial<LevelConfig>) {
    config.value = { ...config.value, ...newConfig }
    lastModified.value = new Date()
  }
  
  function addAnswer(answer?: Partial<UniversalAnswer>): UniversalAnswer {
    const newAnswer: UniversalAnswer = {
      id: data.value.length + 1,
      variants: [''],
      inSector: false,
      inBonus: false,
      ...answer
    }
    
    data.value.push(newAnswer)
    lastModified.value = new Date()
    
    return newAnswer
  }
  
  function removeAnswer(id: string | number) {
    const index = data.value.findIndex(item => item.id === id)
    if (index >= 0) {
      data.value.splice(index, 1)
      lastModified.value = new Date()
    }
  }
  
  function updateAnswer(id: string | number, updates: Partial<UniversalAnswer>) {
    const answer = data.value.find(item => item.id === id)
    if (answer) {
      Object.assign(answer, updates)
      lastModified.value = new Date()
    }
  }
  
  function duplicateAnswer(id: string | number): UniversalAnswer | null {
    const originalAnswer = data.value.find(item => item.id === id)
    if (originalAnswer) {
      const duplicated: UniversalAnswer = {
        ...originalAnswer,
        id: data.value.length + 1,
        variants: [...originalAnswer.variants]
      }
      
      data.value.push(duplicated)
      lastModified.value = new Date()
      
      return duplicated
    }
    
    return null
  }
  
  function clearAllAnswers() {
    data.value = []
    lastModified.value = new Date()
    error.value = null
  }
  
  function handleClear() {
    if (confirm('Вы уверены, что хотите очистить все данные?')) {
      clearAllAnswers()
    }
  }
  
  // ============================================================================
  // МЕТОДЫ ВАЛИДАЦИИ И ОШИБОК
  // ============================================================================
  
  function validateData(): ValidationResult {
    try {
      const result = levelType.validator(data.value)
      
      if (!result.valid) {
        error.value = result.errors.join(', ')
      } else {
        error.value = null
      }
      
      return result
    } catch (validationError) {
      const errorMessage = validationError instanceof Error 
        ? validationError.message 
        : 'Ошибка валидации'
      
      error.value = errorMessage
      
      return {
        valid: false,
        errors: [errorMessage]
      }
    }
  }
  
  function clearError() {
    error.value = null
  }
  
  // ============================================================================
  // МЕТОДЫ ПОИСКА И ФИЛЬТРАЦИИ
  // ============================================================================
  
  function findAnswer(id: string | number): UniversalAnswer | undefined {
    return data.value.find(item => item.id === id)
  }
  
  function findAnswersByType(type: 'sector' | 'bonus'): UniversalAnswer[] {
    if (type === 'sector') {
      return data.value.filter(item => item.inSector && !item.inBonus)
    } else {
      return data.value.filter(item => item.inBonus)
    }
  }
  
  function getActiveAnswers(): UniversalAnswer[] {
    return data.value.filter(item => 
      item.inSector || item.inBonus || item.variants.some(v => v.trim())
    )
  }
  
  function getEmptyAnswers(): UniversalAnswer[] {
    return data.value.filter(item => 
      !item.inSector && !item.inBonus && !item.variants.some(v => v.trim())
    )
  }
  
  // ============================================================================
  // МЕТОДЫ ПЕРСИСТЕНЦИИ
  // ============================================================================
  
  function saveToLocalStorage(key?: string) {
    const storageKey = key || `encounter-uploader:${levelType.name}`
    
    try {
      const stateToSave = {
        ...currentState.value,
        savedAt: new Date().toISOString()
      }
      
      localStorage.setItem(storageKey, JSON.stringify(stateToSave))
      return true
    } catch (saveError) {
      error.value = 'Ошибка сохранения данных'
      console.error('Save error:', saveError)
      return false
    }
  }
  
  function loadFromLocalStorage(key?: string): boolean {
    const storageKey = key || `encounter-uploader:${levelType.name}`
    
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const state = JSON.parse(saved) as LevelState
        
        if (state.type === levelType.name) {
          data.value = state.data
          config.value = state.config
          lastModified.value = new Date(state.lastModified)
          error.value = null
          
          return true
        }
      }
    } catch (loadError) {
      error.value = 'Ошибка загрузки данных'
      console.error('Load error:', loadError)
    }
    
    return false
  }
  
  // ============================================================================
  // WATCHERS
  // ============================================================================
  
  // Автосохранение при изменении данных
  watch(
    [data, config],
    () => {
      saveToLocalStorage()
    },
    { deep: true, debounce: 1000 }
  )
  
  // ============================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================================================
  
  // Загружаем данные при инициализации
  const hasLoadedData = loadFromLocalStorage()
  
  // Если данных нет, создаем минимальный набор
  if (!hasLoadedData && levelType.defaultConfig.initialRowsCount) {
    const initialCount = levelType.defaultConfig.initialRowsCount || 1
    for (let i = 0; i < initialCount; i++) {
      addAnswer()
    }
  }
  
  // ============================================================================
  // ВОЗВРАЩАЕМЫЕ ЗНАЧЕНИЯ
  // ============================================================================
  
  return {
    // Состояние
    data,
    config,
    error,
    isLoading,
    lastModified,
    
    // Computed
    currentState,
    isValid,
    validationResult,
    hasData,
    
    // Методы управления данными
    updateData,
    updateConfig,
    addAnswer,
    removeAnswer,
    updateAnswer,
    duplicateAnswer,
    clearAllAnswers,
    handleClear,
    
    // Методы валидации
    validateData,
    clearError,
    
    // Методы поиска
    findAnswer,
    findAnswersByType,
    getActiveAnswers,
    getEmptyAnswers,
    
    // Методы персистенции
    saveToLocalStorage,
    loadFromLocalStorage
  }
}

