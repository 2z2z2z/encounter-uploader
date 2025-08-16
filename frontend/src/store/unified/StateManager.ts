/**
 * UnifiedStateManager - централизованное управление состоянием всех типов уровней
 * Реализация согласно плану рефакторинга (Фаза 2.1)
 */

import type { UniversalAnswer, LevelTypeConfig } from '../../types/level-system'

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface LevelState {
  // Основные данные
  typeId: string
  levelId: string
  gameId: string
  domain: string
  answers: UniversalAnswer[]
  
  // HTML задание (для олимпиек)
  task?: string
  
  // Метаданные
  lastModified: Date
  version: string
  
  // Конфигурация специфичная для типа
  typeConfig: Record<string, any>
  
  // Статус
  isDirty: boolean
  isValid: boolean
  
  // Дополнительные поля для Type100500
  tabs?: Array<{
    id: string
    name: string
    answers: UniversalAnswer[]
  }>
  activeTabIndex?: number
}

export interface StateManagerConfig {
  // Настройки автосохранения
  autoSaveInterval: number // ms
  enableAutoSave: boolean
  
  // Настройки localStorage
  keyPrefix: string
  compressionEnabled: boolean
  
  // Настройки валидации
  validateOnSave: boolean
  validateOnLoad: boolean
  
  // Настройки миграции
  enableLegacyMigration: boolean
  legacyKeys: string[]
}

// ============================================================================
// UNIFIED STATE MANAGER CLASS (из плана 2.1)
// ============================================================================

export class UnifiedStateManager {
  private states = new Map<string, LevelState>()
  private config: StateManagerConfig
  private autoSaveTimer?: NodeJS.Timeout
  
  constructor(config: Partial<StateManagerConfig> = {}) {
    this.config = {
      autoSaveInterval: 30000, // 30 секунд
      enableAutoSave: true,
      keyPrefix: 'encounter-uploader',
      compressionEnabled: false,
      validateOnSave: true,
      validateOnLoad: true,
      enableLegacyMigration: true,
      legacyKeys: ['upload-olymp', 'upload-olymp31', 'upload-olymp63', 'upload-olymp127', 'upload-100500'],
      ...config
    }
    
    this.initializeAutoSave()
    
    if (this.config.enableLegacyMigration) {
      this.migrateLegacyData()
    }
  }

  // ============================================================================
  // ОСНОВНЫЕ МЕТОДЫ (из плана)
  // ============================================================================

  /**
   * Простое сохранение состояния для любого типа (из плана)
   */
  persist(typeId: string, levelId: string, state: Partial<LevelState>): boolean {
    try {
      const stateKey = this.createStateKey(typeId, levelId)
      const fullState: LevelState = {
        typeId,
        levelId,
        gameId: state.gameId || '',
        domain: state.domain || '',
        answers: state.answers || [],
        task: state.task,
        lastModified: new Date(),
        version: '2.0.0',
        typeConfig: state.typeConfig || {},
        isDirty: false,
        isValid: this.config.validateOnSave ? this.validateState(state as LevelState) : true,
        tabs: state.tabs,
        activeTabIndex: state.activeTabIndex,
        ...state
      }
      
      // Сохранение в память
      this.states.set(stateKey, fullState)
      
      // Сохранение в localStorage
      const storageKey = `${this.config.keyPrefix}:${stateKey}`
      const serializedState = this.serializeState(fullState)
      localStorage.setItem(storageKey, serializedState)
      
      console.log(`💾 Состояние сохранено: ${stateKey}`)
      return true
      
    } catch (error) {
      console.error(`❌ Ошибка сохранения состояния ${typeId}/${levelId}:`, error)
      return false
    }
  }

  /**
   * Загрузка состояния (из плана)
   */
  load(typeId: string, levelId: string): LevelState | null {
    try {
      const stateKey = this.createStateKey(typeId, levelId)
      
      // Сначала проверяем кэш в памяти
      if (this.states.has(stateKey)) {
        const state = this.states.get(stateKey)!
        console.log(`📁 Состояние загружено из кэша: ${stateKey}`)
        return state
      }
      
      // Загружаем из localStorage
      const storageKey = `${this.config.keyPrefix}:${stateKey}`
      const serializedState = localStorage.getItem(storageKey)
      
      if (!serializedState) {
        console.log(`📁 Состояние не найдено: ${stateKey}`)
        return null
      }
      
      const state = this.deserializeState(serializedState)
      
      // Валидация при загрузке
      if (this.config.validateOnLoad && !this.validateState(state)) {
        console.warn(`⚠️ Состояние не прошло валидацию: ${stateKey}`)
        return null
      }
      
      // Сохраняем в кэш памяти
      this.states.set(stateKey, state)
      
      console.log(`📁 Состояние загружено: ${stateKey}`)
      return state
      
    } catch (error) {
      console.error(`❌ Ошибка загрузки состояния ${typeId}/${levelId}:`, error)
      return null
    }
  }

  /**
   * Очистка старых данных (опционально при первом запуске) (из плана)
   */
  clearLegacyData(): { cleared: string[], errors: string[] } {
    const cleared: string[] = []
    const errors: string[] = []
    
    console.log('🧹 Очистка legacy данных...')
    
    this.config.legacyKeys.forEach(key => {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key)
          cleared.push(key)
          console.log(`🗑️ Удален legacy ключ: ${key}`)
        }
      } catch (error) {
        errors.push(`Ошибка удаления ${key}: ${error}`)
        console.error(`❌ Ошибка удаления legacy ключа ${key}:`, error)
      }
    })
    
    // Очистка других старых ключей по паттерну
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('upload-') && !key.startsWith(this.config.keyPrefix)) {
          localStorage.removeItem(key)
          cleared.push(key)
          console.log(`🗑️ Удален old ключ: ${key}`)
        }
      })
    } catch (error) {
      errors.push(`Ошибка очистки по паттерну: ${error}`)
    }
    
    console.log(`✅ Очистка завершена. Удалено: ${cleared.length}, ошибок: ${errors.length}`)
    
    return { cleared, errors }
  }

  // ============================================================================
  // МИГРАЦИЯ LEGACY ДАННЫХ (из плана)
  // ============================================================================
  
  /**
   * Миграция старых данных в новый формат
   */
  private migrateLegacyData(): void {
    console.log('🔄 Начинаем миграцию legacy данных...')
    
    let migratedCount = 0
    let errorCount = 0
    
    this.config.legacyKeys.forEach(legacyKey => {
      try {
        const legacyData = localStorage.getItem(legacyKey)
        if (legacyData) {
          console.log(`📦 Найден legacy ключ: ${legacyKey}`)
          
          const parsedData = JSON.parse(legacyData)
          const migratedState = this.convertLegacyData(legacyKey, parsedData)
          
          if (migratedState) {
            // Сохраняем в новом формате
            const success = this.persist(migratedState.typeId, migratedState.levelId, migratedState)
            
            if (success) {
              migratedCount++
              console.log(`✅ Мигрированы данные: ${legacyKey} -> ${migratedState.typeId}_${migratedState.levelId}`)
              
              // Удаляем старый ключ после успешной миграции
              localStorage.removeItem(legacyKey)
              console.log(`🗑️ Удален legacy ключ: ${legacyKey}`)
            } else {
              errorCount++
              console.error(`❌ Ошибка сохранения мигрированных данных для ${legacyKey}`)
            }
          } else {
            console.warn(`⚠️ Не удалось преобразовать данные из ${legacyKey}`)
          }
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Ошибка миграции ${legacyKey}:`, error)
      }
    })
    
    console.log(`🏁 Миграция завершена. Мигрировано: ${migratedCount}, ошибок: ${errorCount}`)
  }
  
  /**
   * Преобразование legacy данных в новый формат
   */
  private convertLegacyData(legacyKey: string, legacyData: any): LevelState | null {
    try {
      // Определяем тип уровня по ключу
      let typeId: string
      let levelId = '1' // По умолчанию уровень 1
      
      if (legacyKey === 'upload-olymp') {
        typeId = 'olymp_15'
      } else if (legacyKey === 'upload-olymp31') {
        typeId = 'olymp_31'
      } else if (legacyKey === 'upload-olymp63') {
        typeId = 'olymp_63'
      } else if (legacyKey === 'upload-olymp127') {
        typeId = 'olymp_127'
      } else if (legacyKey === 'upload-100500') {
        typeId = 'type_100500'
      } else {
        console.warn(`⚠️ Неизвестный legacy ключ: ${legacyKey}`)
        return null
      }
      
      // Преобразуем answers в новый формат
      const answers = (legacyData.answers || []).map((answer: any, index: number) => ({
        id: index + 1,
        variants: Array.isArray(answer.variants) ? answer.variants : [answer.variants || ''],
        inSector: answer.inSector !== false,
        inBonus: answer.inBonus !== false,
        bonusTime: answer.bonusTime || { hours: 0, minutes: 0, seconds: 0, negative: false },
        sectorName: answer.closedText || '',
        bonusName: answer.displayText || '',
        bonusTask: answer.bonusTask || '',
        bonusHint: answer.bonusHint || '',
        type: answer.inSector ? 'sector' : 'bonus',
        metadata: {}
      }))
      
      return {
        typeId,
        levelId,
        gameId: '', // Будет заполнено при использовании
        domain: '', // Будет заполнено при использовании
        answers,
        task: legacyData.task || '',
        lastModified: new Date(),
        version: '2.0.0',
        typeConfig: legacyData.config || {},
        isDirty: false,
        isValid: true,
        tabs: legacyData.tabs,
        activeTabIndex: legacyData.activeTabIndex || 0
      }
    } catch (error) {
      console.error(`❌ Ошибка преобразования legacy данных:`, error)
      return null
    }
  }

  // ============================================================================
  // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================================

  /**
   * Получение всех состояний для типа
   */
  getAllStatesForType(typeId: string): LevelState[] {
    return Array.from(this.states.values()).filter(state => state.typeId === typeId)
  }

  /**
   * Удаление состояния
   */
  removeState(typeId: string, levelId: string): boolean {
    try {
      const stateKey = this.createStateKey(typeId, levelId)
      
      // Удаляем из памяти
      this.states.delete(stateKey)
      
      // Удаляем из localStorage
      const storageKey = `${this.config.keyPrefix}:${stateKey}`
      localStorage.removeItem(storageKey)
      
      console.log(`🗑️ Состояние удалено: ${stateKey}`)
      return true
      
    } catch (error) {
      console.error(`❌ Ошибка удаления состояния ${typeId}/${levelId}:`, error)
      return false
    }
  }

  /**
   * Копирование состояния
   */
  cloneState(fromTypeId: string, fromLevelId: string, toTypeId: string, toLevelId: string): boolean {
    const sourceState = this.load(fromTypeId, fromLevelId)
    if (!sourceState) {
      console.error('❌ Исходное состояние не найдено')
      return false
    }
    
    const clonedState = {
      ...sourceState,
      typeId: toTypeId,
      levelId: toLevelId,
      lastModified: new Date(),
      isDirty: true
    }
    
    return this.persist(toTypeId, toLevelId, clonedState)
  }

  // ============================================================================
  // АВТОСОХРАНЕНИЕ
  // ============================================================================

  private initializeAutoSave(): void {
    if (!this.config.enableAutoSave) return
    
    this.autoSaveTimer = setInterval(() => {
      this.autoSave()
    }, this.config.autoSaveInterval)
    
    console.log(`🔄 Автосохранение инициализировано (${this.config.autoSaveInterval}ms)`)
  }

  private autoSave(): void {
    let savedCount = 0
    let errorCount = 0
    
    this.states.forEach((state, stateKey) => {
      if (state.isDirty) {
        try {
          const [typeId, levelId] = stateKey.split('_')
          if (this.persist(typeId, levelId, state)) {
            savedCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
          console.error(`❌ Ошибка автосохранения ${stateKey}:`, error)
        }
      }
    })
    
    if (savedCount > 0 || errorCount > 0) {
      console.log(`🔄 Автосохранение: ${savedCount} сохранено, ${errorCount} ошибок`)
    }
  }

  /**
   * Отключение автосохранения
   */
  disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = undefined
      console.log('⏸️ Автосохранение отключено')
    }
  }

  // ============================================================================
  // УТИЛИТЫ
  // ============================================================================

  private createStateKey(typeId: string, levelId: string): string {
    return `${typeId}_${levelId}`
  }

  private serializeState(state: LevelState): string {
    if (this.config.compressionEnabled) {
      // TODO: Добавить сжатие если нужно
    }
    return JSON.stringify(state)
  }

  private deserializeState(serializedState: string): LevelState {
    const state = JSON.parse(serializedState)
    
    // Восстановление дат
    if (state.lastModified) {
      state.lastModified = new Date(state.lastModified)
    }
    
    return state
  }

  private validateState(state: LevelState): boolean {
    // Базовая валидация состояния
    return !!(
      state.typeId &&
      state.levelId &&
      Array.isArray(state.answers) &&
      state.lastModified &&
      state.version
    )
  }

  // ============================================================================
  // СТАТИСТИКА И ОТЛАДКА
  // ============================================================================

  /**
   * Получение статистики
   */
  getStatistics() {
    const states = Array.from(this.states.values())
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.config.keyPrefix)
    )
    
    return {
      memoryStates: states.length,
      storageStates: storageKeys.length,
      dirtyStates: states.filter(s => s.isDirty).length,
      invalidStates: states.filter(s => !s.isValid).length,
      totalAnswers: states.reduce((sum, s) => sum + s.answers.length, 0),
      oldestState: states.length > 0 ? 
        Math.min(...states.map(s => s.lastModified.getTime())) : null,
      newestState: states.length > 0 ? 
        Math.max(...states.map(s => s.lastModified.getTime())) : null
    }
  }

  /**
   * Отладочная информация
   */
  printDebugInfo(): void {
    console.group('💾 UnifiedStateManager Debug Info')
    
    const stats = this.getStatistics()
    console.log('📊 Статистика:', stats)
    console.log('⚙️ Конфигурация:', this.config)
    
    console.log('\n📋 Состояния в памяти:')
    this.states.forEach((state, key) => {
      console.log(`  ${key}: ${state.answers.length} ответов, dirty: ${state.isDirty}`)
    })
    
    console.groupEnd()
  }

  /**
   * Очистка всех данных (осторожно!)
   */
  clearAllData(): void {
    console.warn('🚨 ОЧИСТКА ВСЕХ ДАННЫХ!')
    
    // Очищаем память
    this.states.clear()
    
    // Очищаем localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.config.keyPrefix))
      .forEach(key => localStorage.removeItem(key))
    
    console.log('🧹 Все данные очищены')
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Глобальный экземпляр менеджера состояний
 */
export const unifiedStateManager = new UnifiedStateManager()

// Экспорт для использования в composables
export function useUnifiedStateManager() {
  return unifiedStateManager
}

