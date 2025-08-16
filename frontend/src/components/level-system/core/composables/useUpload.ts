/**
 * useUpload - общая загрузка
 * Реализация согласно плану рефакторинга (Фаза 1.4)
 */

import { ref, computed } from 'vue'
import type { LevelTypeDefinition, UniversalAnswer, UploadResult } from '../types/LevelType'
import { unifiedApi } from '../../../../services/unified-api'
import { useAuthStore } from '../../../../store/auth'

interface UploadProgress {
  current: number
  total: number
  type: 'task' | 'sector' | 'bonus' | 'all'
  currentItem?: string
  errors: string[]
}

export function useUpload(
  data: { value: UniversalAnswer[] }, 
  levelType: LevelTypeDefinition
) {
  // ============================================================================
  // STORES И СОСТОЯНИЕ
  // ============================================================================
  
  const authStore = useAuthStore()
  const isUploading = ref(false)
  const uploadProgress = ref<UploadProgress>({
    current: 0,
    total: 0,
    type: 'all',
    errors: []
  })
  
  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  const canUpload = computed(() => {
    return authStore.isAuthenticated && 
           authStore.domain && 
           authStore.gameId && 
           authStore.levelId &&
           data.value.length > 0
  })
  
  const sectorsToUpload = computed(() => {
    return data.value.filter(item => item.inSector && !item.inBonus && item.variants.some(v => v.trim()))
  })
  
  const bonusesToUpload = computed(() => {
    return data.value.filter(item => item.inBonus && item.variants.some(v => v.trim()))
  })
  
  const hasTask = computed(() => {
    return levelType.capabilities.some(cap => cap.type === 'task')
  })
  
  const hasSectors = computed(() => {
    return sectorsToUpload.value.length > 0
  })
  
  const hasBonuses = computed(() => {
    return bonusesToUpload.value.length > 0
  })
  
  // ============================================================================
  // ОСНОВНЫЕ МЕТОДЫ ЗАГРУЗКИ
  // ============================================================================
  
  async function handleUploadTask(taskHtml?: string): Promise<UploadResult> {
    if (!canUpload.value) {
      return { success: false, error: 'Невозможно выполнить загрузку: проверьте авторизацию и данные' }
    }
    
    if (!hasTask.value) {
      return { success: false, error: 'Данный тип уровня не поддерживает загрузку задания' }
    }
    
    try {
      isUploading.value = true
      uploadProgress.value = {
        current: 0,
        total: 1,
        type: 'task',
        currentItem: 'Задание уровня',
        errors: []
      }
      
      const html = taskHtml || generateTaskHtml()
      
      const result = await unifiedApi.uploadTask(
        authStore.domain!,
        authStore.gameId!,
        authStore.levelId!,
        html
      )
      
      uploadProgress.value.current = 1
      
      if (result.success) {
        return { 
          success: true, 
          data: result.data,
          metrics: {
            duration: result.requestTime,
            elementsCount: 1,
            dataSize: html.length
          }
        }
      } else {
        uploadProgress.value.errors.push(result.error || 'Неизвестная ошибка загрузки задания')
        return { success: false, error: result.error }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки задания'
      uploadProgress.value.errors.push(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isUploading.value = false
    }
  }
  
  async function handleUploadSectors(): Promise<UploadResult> {
    if (!canUpload.value || !hasSectors.value) {
      return { success: false, error: 'Нет секторов для загрузки' }
    }
    
    try {
      isUploading.value = true
      const sectors = sectorsToUpload.value
      
      uploadProgress.value = {
        current: 0,
        total: sectors.length,
        type: 'sector',
        errors: []
      }
      
      const results: any[] = []
      const startTime = Date.now()
      
      for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i]
        uploadProgress.value.current = i + 1
        uploadProgress.value.currentItem = `Сектор ${sector.id}`
        
        try {
          const result = await unifiedApi.uploadSector(
            authStore.domain!,
            authStore.gameId!,
            authStore.levelId!,
            sector.variants,
            sector.sectorName || ''
          )
          
          results.push(result)
          
          if (!result.success) {
            uploadProgress.value.errors.push(`Сектор ${sector.id}: ${result.error}`)
          }
          
        } catch (sectorError) {
          const errorMessage = sectorError instanceof Error ? sectorError.message : 'Неизвестная ошибка'
          uploadProgress.value.errors.push(`Сектор ${sector.id}: ${errorMessage}`)
          results.push({ success: false, error: errorMessage })
        }
      }
      
      const successCount = results.filter(r => r.success).length
      const duration = Date.now() - startTime
      
      return {
        success: successCount > 0,
        data: results,
        error: successCount === 0 ? 'Не удалось загрузить ни одного сектора' : 
               successCount < sectors.length ? `Загружено ${successCount} из ${sectors.length} секторов` : 
               undefined,
        metrics: {
          duration,
          elementsCount: sectors.length,
          dataSize: sectors.reduce((sum, s) => sum + s.variants.join('').length, 0)
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки секторов'
      uploadProgress.value.errors.push(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isUploading.value = false
    }
  }
  
  async function handleUploadBonuses(): Promise<UploadResult> {
    if (!canUpload.value || !hasBonuses.value) {
      return { success: false, error: 'Нет бонусов для загрузки' }
    }
    
    try {
      isUploading.value = true
      const bonuses = bonusesToUpload.value
      
      uploadProgress.value = {
        current: 0,
        total: bonuses.length,
        type: 'bonus',
        errors: []
      }
      
      // Преобразуем UniversalAnswer в формат для unified API
      const bonusPayloads = bonuses.map(bonus => ({
        name: bonus.bonusName || `Бонус ${bonus.id}`,
        variants: bonus.variants.filter(v => v.trim()),
        time: bonus.bonusTime || { hours: 0, minutes: 0, seconds: 0 },
        task: bonus.bonusTask || '',
        hint: bonus.bonusHint || '',
        allLevels: bonus.allLevels || false,
        levelCheckboxNames: bonus.targetLevels || [`level_${authStore.levelId}`],
        delay: bonus.delay,
        relativeLimit: bonus.relativeLimit
      }))
      
      const result = await unifiedApi.uploadBonuses(
        authStore.domain!,
        authStore.gameId!,
        authStore.levelId!,
        bonusPayloads
      )
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          metrics: {
            duration: result.requestTime || 0,
            elementsCount: bonuses.length,
            dataSize: bonuses.reduce((sum, b) => 
              sum + b.variants.join('').length + (b.bonusTask?.length || 0) + (b.bonusHint?.length || 0), 0
            )
          }
        }
      } else {
        uploadProgress.value.errors.push(result.error || 'Ошибка загрузки бонусов')
        return { success: false, error: result.error }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки бонусов'
      uploadProgress.value.errors.push(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isUploading.value = false
    }
  }
  
  async function handleUploadAll(): Promise<UploadResult> {
    if (!canUpload.value) {
      return { success: false, error: 'Невозможно выполнить загрузку' }
    }
    
    try {
      isUploading.value = true
      uploadProgress.value = {
        current: 0,
        total: (hasTask.value ? 1 : 0) + (hasSectors.value ? sectorsToUpload.value.length : 0) + (hasBonuses.value ? bonusesToUpload.value.length : 0),
        type: 'all',
        errors: []
      }
      
      const results = {
        task: null as UploadResult | null,
        sectors: null as UploadResult | null,
        bonuses: null as UploadResult | null
      }
      
      const startTime = Date.now()
      
      // 1. Загружаем задание
      if (hasTask.value) {
        results.task = await handleUploadTask()
      }
      
      // 2. Загружаем секторы
      if (hasSectors.value) {
        results.sectors = await handleUploadSectors()
      }
      
      // 3. Загружаем бонусы
      if (hasBonuses.value) {
        results.bonuses = await handleUploadBonuses()
      }
      
      const allResults = [results.task, results.sectors, results.bonuses].filter(Boolean) as UploadResult[]
      const successCount = allResults.filter(r => r.success).length
      const duration = Date.now() - startTime
      
      return {
        success: successCount > 0,
        data: results,
        error: successCount === 0 ? 'Не удалось выполнить ни одной операции загрузки' :
               successCount < allResults.length ? 'Не все операции завершились успешно' :
               undefined,
        metrics: {
          duration,
          elementsCount: allResults.reduce((sum, r) => sum + (r.metrics?.elementsCount || 0), 0),
          dataSize: allResults.reduce((sum, r) => sum + (r.metrics?.dataSize || 0), 0)
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка полной загрузки'
      uploadProgress.value.errors.push(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isUploading.value = false
    }
  }
  
  // ============================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================================
  
  function generateTaskHtml(): string {
    // Генерируем базовый HTML для задания на основе типа уровня
    switch (levelType.category) {
      case 'olymp':
        return generateOlympTaskHtml()
      case 'bulk':
        return generateBulkTaskHtml()
      default:
        return '<div>Задание уровня</div>'
    }
  }
  
  function generateOlympTaskHtml(): string {
    const sectors = sectorsToUpload.value
    const bonuses = bonusesToUpload.value
    
    return `
      <div class="level-task">
        <h3>Олимпийский уровень</h3>
        <p>Секторов: ${sectors.length}</p>
        <p>Бонусов: ${bonuses.length}</p>
      </div>
    `.trim()
  }
  
  function generateBulkTaskHtml(): string {
    const sectors = sectorsToUpload.value
    const bonuses = bonusesToUpload.value
    
    return `
      <div class="level-task">
        <h3>Массовый уровень</h3>
        <p>Всего элементов: ${sectors.length + bonuses.length}</p>
      </div>
    `.trim()
  }
  
  function validateUploadData(): { valid: boolean, errors: string[] } {
    const errors: string[] = []
    
    if (!authStore.isAuthenticated) {
      errors.push('Требуется авторизация')
    }
    
    if (!authStore.domain) {
      errors.push('Не указан домен')
    }
    
    if (!authStore.gameId) {
      errors.push('Не указан ID игры')
    }
    
    if (!authStore.levelId) {
      errors.push('Не указан ID уровня')
    }
    
    if (data.value.length === 0) {
      errors.push('Нет данных для загрузки')
    }
    
    if (!hasSectors.value && !hasBonuses.value && !hasTask.value) {
      errors.push('Нет активных элементов для загрузки')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  function resetUploadProgress() {
    uploadProgress.value = {
      current: 0,
      total: 0,
      type: 'all',
      errors: []
    }
  }
  
  function cancelUpload() {
    // В реальной реализации здесь был бы механизм отмены запросов
    isUploading.value = false
    resetUploadProgress()
  }
  
  // ============================================================================
  // ВОЗВРАЩАЕМЫЕ ЗНАЧЕНИЯ
  // ============================================================================
  
  return {
    // Состояние
    isUploading,
    uploadProgress,
    
    // Computed
    canUpload,
    sectorsToUpload,
    bonusesToUpload,
    hasTask,
    hasSectors,
    hasBonuses,
    
    // Методы загрузки
    handleUploadTask,
    handleUploadSectors,
    handleUploadBonuses,
    handleUploadAll,
    
    // Вспомогательные методы
    generateTaskHtml,
    validateUploadData,
    resetUploadProgress,
    cancelUpload
  }
}

