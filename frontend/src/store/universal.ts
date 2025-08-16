/**
 * Универсальное хранилище для всех типов уровней
 * Заменяет разрозненные store и localStorage управлением
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { 
  LevelTypeConfig,
  UniversalAnswer,
  BonusTime,
  LevelState,
  TabData
} from '../types/level-system'
import { 
  LEVEL_TYPES_REGISTRY,
  getLevelTypeConfig,
  getAllLevelTypes 
} from '../types/level-system'
import { unifiedApi, type UploadProgress, type ApiResponse } from '../services/unified-api'

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface UniversalStoreState {
  // Current level configuration
  currentLevelId: string
  currentGameId: string
  currentDomain: string
  currentTypeId: string
  
  // Level data
  levelStates: Record<string, LevelState>
  
  // UI state
  activeTabIndex: number
  uploadProgress: {
    visible: boolean
    current: number
    total: number
    type: 'sector' | 'bonus' | ''
    title: string
  }
}

// ============================================================================
// UNIVERSAL STORE
// ============================================================================

export const useUniversalStore = defineStore('universal', () => {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const currentLevelId = ref<string>('')
  const currentGameId = ref<string>('')
  const currentDomain = ref<string>('')
  const currentTypeId = ref<string>('olymp_15')
  
  const levelStates = ref<Record<string, LevelState>>({})
  const activeTabIndex = ref<number>(0)
  
  const uploadProgress = ref<UploadProgress>({
    current: 0,
    total: 0,
    type: 'task',
    title: '',
    eta: undefined
  })

  const isUploading = ref(false)
  const uploadResults = ref<any[]>([])
  const lastUploadError = ref<string | null>(null)

  // ============================================================================
  // COMPUTED - CURRENT LEVEL ACCESS
  // ============================================================================
  
  const currentConfig = computed<LevelTypeConfig | null>(() => {
    return getLevelTypeConfig(currentTypeId.value)
  })
  
  const currentState = computed<LevelState | null>(() => {
    const stateKey = `${currentTypeId.value}_${currentLevelId.value}`
    return levelStates.value[stateKey] || null
  })
  
  const currentAnswers = computed<UniversalAnswer[]>({
    get: () => currentState.value?.answers || [],
    set: (value: UniversalAnswer[]) => {
      if (currentState.value) {
        currentState.value.answers = value
        currentState.value.lastModified = new Date()
      }
    }
  })
  
  const currentTask = computed<string>({
    get: () => currentState.value?.task || '',
    set: (value: string) => {
      if (currentState.value) {
        currentState.value.task = value
        currentState.value.lastModified = new Date()
      }
    }
  })

  // ============================================================================
  // COMPUTED - STATISTICS
  // ============================================================================
  
  const sectorsCount = computed(() => {
    return currentAnswers.value.filter(answer => 
      answer.type === 'sector' || answer.inSector
    ).length
  })
  
  const bonusesCount = computed(() => {
    return currentAnswers.value.filter(answer => 
      answer.type === 'bonus' || answer.inBonus
    ).length
  })
  
  const validSectorsCount = computed(() => {
    return currentAnswers.value.filter(answer => 
      (answer.type === 'sector' || answer.inSector) && 
      answer.variants.some(v => v.trim())
    ).length
  })
  
  const validBonusesCount = computed(() => {
    return currentAnswers.value.filter(answer => 
      (answer.type === 'bonus' || answer.inBonus) && 
      answer.variants.some(v => v.trim())
    ).length
  })

  // ============================================================================
  // COMPUTED - CAPABILITIES CHECK
  // ============================================================================
  
  const canUploadSectors = computed(() => {
    return currentConfig.value?.capabilities.hasSectors && validSectorsCount.value > 0
  })
  
  const canUploadBonuses = computed(() => {
    return currentConfig.value?.capabilities.hasBonuses && validBonusesCount.value > 0
  })
  
  const supportsTabs = computed(() => {
    return currentConfig.value?.capabilities.supportsTabs || false
  })
  
  const supportsCodeGeneration = computed(() => {
    return currentConfig.value?.capabilities.supportsCodeGeneration || false
  })

  // ============================================================================
  // METHODS - LEVEL MANAGEMENT
  // ============================================================================
  
  function setCurrentLevel(domain: string, gameId: string, levelId: string, typeId?: string) {
    currentDomain.value = domain
    currentGameId.value = gameId
    currentLevelId.value = levelId
    
    if (typeId && typeId !== currentTypeId.value) {
      setCurrentType(typeId)
    }
    
    // Ensure current state exists
    ensureCurrentState()
  }
  
  function setCurrentType(typeId: string) {
    const config = getLevelTypeConfig(typeId)
    if (!config) {
      console.error('Unknown level type:', typeId)
      return false
    }
    
    currentTypeId.value = typeId
    ensureCurrentState()
    return true
  }
  
  function ensureCurrentState() {
    const stateKey = `${currentTypeId.value}_${currentLevelId.value}`
    
    if (!levelStates.value[stateKey]) {
      const config = currentConfig.value
      if (!config) return
      
      // Create new state
      levelStates.value[stateKey] = createInitialState(config)
      
      // Try to load from localStorage
      loadStateFromStorage(stateKey)
    }
  }
  
  function createInitialState(config: LevelTypeConfig): LevelState {
    const defaultAnswers: UniversalAnswer[] = []
    
    // Initialize default answers based on config
    for (let i = 1; i <= config.defaultSectorCount; i++) {
      defaultAnswers.push(createDefaultAnswer(i, config))
    }
    
    return {
      typeId: config.id,
      config: config,
      answers: defaultAnswers,
      task: '',
      metadata: {},
      lastModified: new Date(),
      version: '1.0'
    }
  }
  
  function createDefaultAnswer(number: number, config: LevelTypeConfig): UniversalAnswer {
    return {
      id: number,
      variants: [''],
      sectorName: config.capabilities.supportsSectorNames ? '' : undefined,
      bonusName: config.capabilities.supportsBonusTask ? '' : undefined,
      bonusTask: config.capabilities.supportsBonusTask ? '' : undefined,
      bonusHint: config.capabilities.supportsBonusHints ? '' : undefined,
      bonusTime: config.capabilities.hasBonuses ? { hours: 0, minutes: 0, seconds: 0 } : undefined,
      bonusDelay: config.capabilities.supportsBonusDelay ? { hours: 0, minutes: 0, seconds: 0 } : undefined,
      bonusLimit: config.capabilities.supportsBonusLimits ? { hours: 0, minutes: 0, seconds: 0 } : undefined,
      bonusLevels: config.capabilities.supportsBonusLevels ? { 
        allLevels: false, 
        specificLevels: [], 
        levelCheckboxNames: [] 
      } : undefined,
      type: 'sector',
      metadata: {}
    }
  }

  // ============================================================================
  // METHODS - ANSWER MANAGEMENT
  // ============================================================================
  
  function addAnswer(): UniversalAnswer | null {
    if (!currentConfig.value) return null
    
    const newNumber = Math.max(...currentAnswers.value.map(a => Number(a.id)), 0) + 1
    const newAnswer = createDefaultAnswer(newNumber, currentConfig.value)
    
    currentAnswers.value = [...currentAnswers.value, newAnswer]
    return newAnswer
  }
  
  function removeAnswer(answerId: string | number): boolean {
    const index = currentAnswers.value.findIndex(a => a.id === answerId)
    if (index === -1) return false
    
    const newAnswers = [...currentAnswers.value]
    newAnswers.splice(index, 1)
    currentAnswers.value = newAnswers
    
    return true
  }
  
  function updateAnswer(answerId: string | number, updates: Partial<UniversalAnswer>): boolean {
    const index = currentAnswers.value.findIndex(a => a.id === answerId)
    if (index === -1) return false
    
    const newAnswers = [...currentAnswers.value]
    newAnswers[index] = { ...newAnswers[index], ...updates }
    currentAnswers.value = newAnswers
    
    return true
  }
  
  function duplicateAnswer(answerId: string | number): UniversalAnswer | null {
    const original = currentAnswers.value.find(a => a.id === answerId)
    if (!original || !currentConfig.value) return null
    
    const newNumber = Math.max(...currentAnswers.value.map(a => Number(a.id)), 0) + 1
    const duplicated: UniversalAnswer = {
      ...JSON.parse(JSON.stringify(original)),
      id: newNumber
    }
    
    currentAnswers.value = [...currentAnswers.value, duplicated]
    return duplicated
  }

  // ============================================================================
  // METHODS - BULK OPERATIONS
  // ============================================================================
  
  function clearAllAnswers() {
    if (!currentConfig.value) return
    
    const defaultAnswers = []
    for (let i = 1; i <= currentConfig.value.defaultSectorCount; i++) {
      defaultAnswers.push(createDefaultAnswer(i, currentConfig.value))
    }
    
    currentAnswers.value = defaultAnswers
  }
  
  function applyBulkBonusTime(time: BonusTime) {
    const newAnswers = currentAnswers.value.map(answer => ({
      ...answer,
      bonusTime: { ...time }
    }))
    
    currentAnswers.value = newAnswers
  }
  
  function applyPatternToNames(pattern: string, field: 'sectorName' | 'bonusName') {
    const newAnswers = currentAnswers.value.map((answer, index) => ({
      ...answer,
      [field]: pattern.replace(/&/g, String(index + 1))
    }))
    
    currentAnswers.value = newAnswers
  }

  // ============================================================================
  // METHODS - STORAGE
  // ============================================================================
  
  function getStorageKey(stateKey: string): string {
    return `universal_level_${stateKey}`
  }
  
  function saveStateToStorage(stateKey: string) {
    const state = levelStates.value[stateKey]
    if (!state) return
    
    try {
      const data = {
        ...state,
        lastModified: state.lastModified.toISOString()
      }
      localStorage.setItem(getStorageKey(stateKey), JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save state to localStorage:', error)
    }
  }
  
  function loadStateFromStorage(stateKey: string) {
    try {
      const stored = localStorage.getItem(getStorageKey(stateKey))
      if (!stored) return
      
      const data = JSON.parse(stored)
      if (data.answers && Array.isArray(data.answers)) {
        levelStates.value[stateKey] = {
          ...data,
          lastModified: new Date(data.lastModified)
        }
      }
    } catch (error) {
      console.error('Failed to load state from localStorage:', error)
    }
  }
  
  function exportCurrentState(): string {
    if (!currentState.value) return ''
    
    const exportData = {
      ...currentState.value,
      lastModified: currentState.value.lastModified.toISOString(),
      exportTime: new Date().toISOString(),
      domain: currentDomain.value,
      gameId: currentGameId.value,
      levelId: currentLevelId.value
    }
    
    return JSON.stringify(exportData, null, 2)
  }
  
  function importState(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (!data.typeId || !data.answers) {
        throw new Error('Invalid data format')
      }
      
      // Validate type exists
      const config = getLevelTypeConfig(data.typeId)
      if (!config) {
        throw new Error('Unknown level type: ' + data.typeId)
      }
      
      // Create state
      const stateKey = `${data.typeId}_${data.levelId || currentLevelId.value}`
      levelStates.value[stateKey] = {
        ...data,
        config: config,
        lastModified: new Date()
      }
      
      return true
    } catch (error) {
      console.error('Import failed:', error)
      return false
    }
  }

  // ============================================================================
  // METHODS - REGISTRY ACCESS
  // ============================================================================
  
  function getAllAvailableTypes(): LevelTypeConfig[] {
    return getAllLevelTypes()
  }
  
  function getTypesByCategory(category: LevelTypeConfig['category']): LevelTypeConfig[] {
    return getAllLevelTypes().filter(type => type.category === category)
  }

  // ============================================================================
  // METHODS - UNIFIED API UPLOAD
  // ============================================================================
  
  /**
   * Initialize upload progress tracking
   */
  function initializeUploadProgress() {
    unifiedApi.setProgressCallback((progress: UploadProgress) => {
      uploadProgress.value = progress
    })
  }
  
  /**
   * Upload current level using unified API
   */
  async function uploadCurrentLevel(): Promise<ApiResponse<any> | null> {
    if (!currentState.value || !currentConfig.value) {
      lastUploadError.value = 'No level selected'
      return null
    }

    isUploading.value = true
    lastUploadError.value = null
    uploadResults.value = []

    try {
      console.log('🚀 [Universal Store] Starting level upload...')
      
      const result = await unifiedApi.uploadLevel(
        currentDomain.value,
        currentGameId.value,
        currentLevelId.value,
        currentAnswers.value,
        currentTask.value || undefined,
        { priority: 'high' }
      )

      uploadResults.value = [result]
      
      if (result.success) {
        console.log('✅ [Universal Store] Level uploaded successfully')
      } else {
        lastUploadError.value = result.error || 'Upload failed'
        console.error('❌ [Universal Store] Level upload failed:', result.error)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error'
      lastUploadError.value = errorMessage
      console.error('❌ [Universal Store] Upload error:', error)
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Upload only sectors
   */
  async function uploadSectors(): Promise<ApiResponse<any[]> | null> {
    if (!currentState.value) {
      lastUploadError.value = 'No level selected'
      return null
    }

    const sectors = currentAnswers.value.filter(answer => 
      (answer.type === 'sector' || answer.inSector) && 
      answer.variants.some(v => v.trim())
    ).map(answer => ({
      variants: answer.variants.filter(v => v.trim()),
      sectorName: answer.sectorName || ''
    }))

    if (sectors.length === 0) {
      lastUploadError.value = 'No valid sectors to upload'
      return null
    }

    isUploading.value = true
    lastUploadError.value = null

    try {
      const result = await unifiedApi.uploadSectors(
        currentDomain.value,
        currentGameId.value,
        currentLevelId.value,
        sectors,
        { priority: 'high' }
      )

      if (!result.success) {
        lastUploadError.value = result.error || 'Sectors upload failed'
      }

      return result
    } catch (error) {
      lastUploadError.value = error instanceof Error ? error.message : 'Unknown error'
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Upload only bonuses
   */
  async function uploadBonuses(): Promise<ApiResponse<any[]> | null> {
    if (!currentState.value) {
      lastUploadError.value = 'No level selected'
      return null
    }

    const bonuses = currentAnswers.value.filter(answer => 
      (answer.type === 'bonus' || answer.inBonus) && 
      answer.variants.some(v => v.trim())
    ).map(answer => ({
      name: answer.bonusName || `Бонус ${answer.id}`,
      variants: answer.variants.filter(v => v.trim()),
      time: answer.bonusTime || { hours: 0, minutes: 0, seconds: 0 },
      task: answer.bonusTask || '',
      hint: answer.bonusHint || '',
      allLevels: answer.bonusLevels?.allLevels || false,
      levelCheckboxNames: answer.bonusLevels?.levelCheckboxNames || [`level_${currentLevelId.value}`],
      delay: answer.bonusDelay,
      relativeLimit: answer.bonusLimit
    }))

    if (bonuses.length === 0) {
      lastUploadError.value = 'No valid bonuses to upload'
      return null
    }

    isUploading.value = true
    lastUploadError.value = null

    try {
      const result = await unifiedApi.uploadBonuses(
        currentDomain.value,
        currentGameId.value,
        currentLevelId.value,
        bonuses,
        { priority: 'high' }
      )

      if (!result.success) {
        lastUploadError.value = result.error || 'Bonuses upload failed'
      }

      return result
    } catch (error) {
      lastUploadError.value = error instanceof Error ? error.message : 'Unknown error'
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Upload task only
   */
  async function uploadTask(): Promise<ApiResponse<any> | null> {
    if (!currentState.value || !currentTask.value) {
      lastUploadError.value = 'No task to upload'
      return null
    }

    isUploading.value = true
    lastUploadError.value = null

    try {
      const result = await unifiedApi.uploadTask(
        currentDomain.value,
        currentGameId.value,
        currentLevelId.value,
        currentTask.value,
        { priority: 'high' }
      )

      if (!result.success) {
        lastUploadError.value = result.error || 'Task upload failed'
      }

      return result
    } catch (error) {
      lastUploadError.value = error instanceof Error ? error.message : 'Unknown error'
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Get API statistics
   */
  function getApiStats() {
    return {
      cache: unifiedApi.getCacheStats(),
      rateLimit: unifiedApi.getRateLimitStatus()
    }
  }

  /**
   * Clear API cache
   */
  function clearApiCache() {
    unifiedApi.clearCache()
  }

  // ============================================================================
  // WATCHERS - AUTO SAVE
  // ============================================================================
  
  watch(
    levelStates,
    (newStates) => {
      // Auto-save all states to localStorage
      Object.keys(newStates).forEach(stateKey => {
        saveStateToStorage(stateKey)
      })
    },
    { deep: true }
  )

  // ============================================================================
  // RETURN STORE INTERFACE
  // ============================================================================
  
  return {
    // State
    currentLevelId,
    currentGameId,
    currentDomain,
    currentTypeId,
    levelStates,
    activeTabIndex,
    uploadProgress,
    isUploading,
    uploadResults,
    lastUploadError,
    
    // Computed
    currentConfig,
    currentState,
    currentAnswers,
    currentTask,
    sectorsCount,
    bonusesCount,
    validSectorsCount,
    validBonusesCount,
    canUploadSectors,
    canUploadBonuses,
    supportsTabs,
    supportsCodeGeneration,
    
    // Methods - Level Management
    setCurrentLevel,
    setCurrentType,
    addAnswer,
    removeAnswer,
    updateAnswer,
    duplicateAnswer,
    clearAllAnswers,
    applyBulkBonusTime,
    applyPatternToNames,
    exportCurrentState,
    importState,
    getAllAvailableTypes,
    getTypesByCategory,
    
    // Methods - Upload (Unified API)
    initializeUploadProgress,
    uploadCurrentLevel,
    uploadSectors,
    uploadBonuses,
    uploadTask,
    getApiStats,
    clearApiCache,
    
    // Legacy compatibility (for gradual migration)
    get domain() { return currentDomain.value },
    get gameId() { return currentGameId.value },
    get levelId() { return currentLevelId.value },
    get answers() { return currentAnswers.value },
    set answers(value: UniversalAnswer[]) { currentAnswers.value = value }
  }
}, {
  persist: {
    pick: ['currentLevelId', 'currentGameId', 'currentDomain', 'currentTypeId']
  }
})

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrates old store data to new universal format
 */
export function migrateFromOldStore(oldStoreData: any): LevelState | null {
  try {
    // Handle olymp types
    if (oldStoreData.uploadType && oldStoreData.uploadType.startsWith('olymp')) {
      const sectorCount = oldStoreData.answers?.length || 15
      const typeId = `olymp_${sectorCount}`
      
      const config = getLevelTypeConfig(typeId)
      if (!config) return null
      
      return {
        typeId,
        config,
        answers: (oldStoreData.answers || []).map((answer: any, index: number) => ({
          id: index + 1,
          variants: Array.isArray(answer.variants) ? answer.variants : [answer.variants || ''],
          inSector: answer.inSector !== false,
          inBonus: answer.inBonus !== false,
          bonusTime: answer.bonusTime || { hours: 0, minutes: 0, seconds: 0 },
          sectorName: answer.closedText || '',
          bonusName: answer.displayText || '',
          type: 'sector',
          metadata: {}
        })),
        task: '',
        metadata: { migrated: true },
        lastModified: new Date(),
        version: '1.0'
      }
    }
    
    // Handle Type100500
    if (oldStoreData.tabs && Array.isArray(oldStoreData.tabs)) {
      const config = getLevelTypeConfig('type_100500')
      if (!config) return null
      
      const allAnswers: UniversalAnswer[] = []
      
      oldStoreData.tabs.forEach((tab: any, tabIndex: number) => {
        if (tab.rows && Array.isArray(tab.rows)) {
          tab.rows.forEach((row: any) => {
            allAnswers.push({
              id: `${tabIndex}_${row.number}`,
              variants: Array.isArray(row.variants) ? row.variants : [row.variants || ''],
              sectorName: row.sectorName || '',
              bonusName: row.bonusName || '',
              bonusTask: row.bonusTask || '',
              bonusHint: row.bonusHint || '',
              bonusTime: row.bonusTime || { hours: 0, minutes: 0, seconds: 0 },
              bonusDelay: row.delay || { hours: 0, minutes: 0, seconds: 0 },
              bonusLimit: row.relativeLimit || { hours: 0, minutes: 0, seconds: 0 },
              bonusLevels: {
                allLevels: row.allLevels || false,
                specificLevels: row.targetLevels || [],
                levelCheckboxNames: row.targetLevels?.map((l: number) => `level_${l}`) || []
              },
              type: row.inSector ? 'sector' : 'bonus',
              metadata: { tabIndex, tabId: `tab_${tabIndex}` }
            })
          })
        }
      })
      
      return {
        typeId: 'type_100500',
        config,
        answers: allAnswers,
        task: '',
        metadata: { 
          migrated: true,
          tabs: oldStoreData.tabs.map((tab: any, index: number) => ({
            id: `tab_${index}`,
            name: `Блок ${index + 1}`,
            sectorPattern: tab.sectorPattern || '',
            bonusPattern: tab.bonusPattern || ''
          }))
        },
        lastModified: new Date(),
        version: '1.0'
      }
    }
    
    return null
  } catch (error) {
    console.error('Migration failed:', error)
    return null
  }
}
