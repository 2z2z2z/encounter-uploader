/**
 * Управление загрузкой: пауза/отмена/продолжение
 * Реализация согласно плану рефакторинга (Фаза 5.3)
 */

import { ref, reactive, computed, watch } from 'vue'

// ============================================================================
// ТИПЫ
// ============================================================================

export type UploadStatus = 'idle' | 'running' | 'paused' | 'cancelled' | 'completed' | 'error'

export interface UploadTask {
  id: string
  name: string
  type: 'task' | 'sector' | 'bonus'
  data: any
  status: UploadStatus
  progress: number
  error?: string
  startTime?: number
  endTime?: number
  retryCount: number
  maxRetries: number
}

export interface UploadSession {
  id: string
  name: string
  tasks: UploadTask[]
  status: UploadStatus
  totalProgress: number
  startTime?: number
  endTime?: number
  pausedAt?: number
  resumedAt?: number
  cancelledAt?: number
}

export interface UploadController {
  pause: () => Promise<void>
  resume: () => Promise<void>
  cancel: () => Promise<void>
  retry: (taskId?: string) => Promise<void>
  skip: (taskId: string) => Promise<void>
}

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useUploadControl() {
  // ============================================================================
  // СОСТОЯНИЕ
  // ============================================================================
  
  const currentSession = ref<UploadSession | null>(null)
  const isUploading = computed(() => currentSession.value?.status === 'running')
  const isPaused = computed(() => currentSession.value?.status === 'paused')
  const isCancelled = computed(() => currentSession.value?.status === 'cancelled')
  const isCompleted = computed(() => currentSession.value?.status === 'completed')
  
  const uploadQueue = ref<UploadTask[]>([])
  const completedTasks = ref<UploadTask[]>([])
  const failedTasks = ref<UploadTask[]>([])
  
  // Контроллер для отмены запросов
  const abortController = ref<AbortController | null>(null)
  const pausePromise = ref<{ resolve: () => void; reject: (error: any) => void } | null>(null)
  
  // Настройки
  const config = reactive({
    maxConcurrentUploads: 3,
    retryDelay: 2000,
    maxRetries: 3,
    timeout: 30000,
    autoRetry: true,
    pauseOnError: false
  })
  
  // Статистика
  const statistics = reactive({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    skippedTasks: 0,
    totalBytes: 0,
    uploadedBytes: 0,
    speed: 0, // bytes/sec
    eta: 0, // seconds
    errorRate: 0 // %
  })
  
  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  const overallProgress = computed(() => {
    if (!currentSession.value) return 0
    
    const session = currentSession.value
    if (session.tasks.length === 0) return 0
    
    const totalProgress = session.tasks.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(totalProgress / session.tasks.length)
  })
  
  const remainingTasks = computed(() => {
    return uploadQueue.value.filter(task => 
      task.status === 'idle' || task.status === 'paused'
    )
  })
  
  const activeTasks = computed(() => {
    return uploadQueue.value.filter(task => task.status === 'running')
  })
  
  const canPause = computed(() => isUploading.value && activeTasks.value.length > 0)
  const canResume = computed(() => isPaused.value && remainingTasks.value.length > 0)
  const canCancel = computed(() => isUploading.value || isPaused.value)
  const canRetry = computed(() => failedTasks.value.length > 0)
  
  // ============================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // ============================================================================
  
  function createSession(name: string, tasks: Omit<UploadTask, 'id' | 'status' | 'progress' | 'retryCount'>[]): UploadSession {
    const sessionId = `session-${Date.now()}`
    
    const sessionTasks: UploadTask[] = tasks.map((task, index) => ({
      ...task,
      id: `${sessionId}-task-${index}`,
      status: 'idle' as UploadStatus,
      progress: 0,
      retryCount: 0,
      maxRetries: task.maxRetries || config.maxRetries
    }))
    
    return {
      id: sessionId,
      name,
      tasks: sessionTasks,
      status: 'idle',
      totalProgress: 0,
      startTime: undefined,
      endTime: undefined
    }
  }
  
  async function startUpload(session: UploadSession): Promise<void> {
    currentSession.value = session
    uploadQueue.value = [...session.tasks]
    completedTasks.value = []
    failedTasks.value = []
    
    // Создаем новый AbortController
    abortController.value = new AbortController()
    
    // Обновляем статистику
    statistics.totalTasks = session.tasks.length
    statistics.completedTasks = 0
    statistics.failedTasks = 0
    statistics.skippedTasks = 0
    
    // Запускаем сессию
    session.status = 'running'
    session.startTime = Date.now()
    
    try {
      await processUploadQueue()
      
      // Завершение сессии
      if (session.status === 'running') {
        session.status = 'completed'
        session.endTime = Date.now()
      }
    } catch (error) {
      if (session.status !== 'cancelled' && session.status !== 'paused') {
        session.status = 'error'
        session.endTime = Date.now()
        console.error('Ошибка выполнения сессии загрузки:', error)
      }
    }
  }
  
  async function processUploadQueue(): Promise<void> {
    while (remainingTasks.value.length > 0 && currentSession.value?.status === 'running') {
      // Ограничиваем количество одновременных загрузок
      const availableSlots = config.maxConcurrentUploads - activeTasks.value.length
      const tasksToStart = remainingTasks.value.slice(0, availableSlots)
      
      // Запускаем задачи параллельно
      const promises = tasksToStart.map(task => processTask(task))
      
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      } else {
        // Ждем завершения активных задач
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Проверяем на паузу
      if (pausePromise.value) {
        await new Promise<void>((resolve, reject) => {
          pausePromise.value = { resolve, reject }
        })
      }
    }
  }
  
  async function processTask(task: UploadTask): Promise<void> {
    if (!currentSession.value) return
    
    try {
      task.status = 'running'
      task.startTime = Date.now()
      
      // Здесь должна быть реальная логика загрузки
      // Для демонстрации используем имитацию
      await simulateUpload(task)
      
      task.status = 'completed'
      task.endTime = Date.now()
      task.progress = 100
      
      completedTasks.value.push(task)
      statistics.completedTasks++
      
      // Удаляем из очереди
      const index = uploadQueue.value.indexOf(task)
      if (index >= 0) {
        uploadQueue.value.splice(index, 1)
      }
      
    } catch (error) {
      task.error = error instanceof Error ? error.message : 'Неизвестная ошибка'
      
      if (task.retryCount < task.maxRetries && config.autoRetry) {
        // Автоматический повтор
        task.retryCount++
        task.status = 'idle'
        
        // Задержка перед повтором
        await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      } else {
        // Окончательная неудача
        task.status = 'error'
        task.endTime = Date.now()
        
        failedTasks.value.push(task)
        statistics.failedTasks++
        
        // Удаляем из очереди
        const index = uploadQueue.value.indexOf(task)
        if (index >= 0) {
          uploadQueue.value.splice(index, 1)
        }
        
        // Пауза при ошибке, если включена
        if (config.pauseOnError && currentSession.value) {
          await pauseUpload()
        }
      }
    }
  }
  
  // Имитация загрузки для демонстрации
  async function simulateUpload(task: UploadTask): Promise<void> {
    const duration = 2000 + Math.random() * 3000 // 2-5 секунд
    const steps = 20
    const stepDuration = duration / steps
    
    for (let i = 0; i < steps; i++) {
      // Проверяем отмену
      if (abortController.value?.signal.aborted) {
        throw new Error('Загрузка отменена')
      }
      
      // Проверяем паузу
      if (currentSession.value?.status === 'paused') {
        await new Promise<void>((resolve) => {
          const checkResume = () => {
            if (currentSession.value?.status === 'running') {
              resolve()
            } else {
              setTimeout(checkResume, 100)
            }
          }
          checkResume()
        })
      }
      
      await new Promise(resolve => setTimeout(resolve, stepDuration))
      task.progress = Math.round(((i + 1) / steps) * 100)
      
      // Случайная ошибка для демонстрации
      if (Math.random() < 0.1 && i > steps / 2) {
        throw new Error(`Ошибка загрузки задачи ${task.name}`)
      }
    }
  }
  
  // ============================================================================
  // МЕТОДЫ УПРАВЛЕНИЯ
  // ============================================================================
  
  async function pauseUpload(): Promise<void> {
    if (!currentSession.value || currentSession.value.status !== 'running') {
      return
    }
    
    currentSession.value.status = 'paused'
    currentSession.value.pausedAt = Date.now()
    
    // Паузим все активные задачи
    activeTasks.value.forEach(task => {
      if (task.status === 'running') {
        task.status = 'paused'
      }
    })
    
    console.log('⏸️ Загрузка приостановлена')
  }
  
  async function resumeUpload(): Promise<void> {
    if (!currentSession.value || currentSession.value.status !== 'paused') {
      return
    }
    
    currentSession.value.status = 'running'
    currentSession.value.resumedAt = Date.now()
    
    // Возобновляем приостановленные задачи
    uploadQueue.value.forEach(task => {
      if (task.status === 'paused') {
        task.status = 'idle'
      }
    })
    
    // Разблокируем processUploadQueue
    if (pausePromise.value) {
      pausePromise.value.resolve()
      pausePromise.value = null
    }
    
    console.log('▶️ Загрузка возобновлена')
  }
  
  async function cancelUpload(): Promise<void> {
    if (!currentSession.value) return
    
    currentSession.value.status = 'cancelled'
    currentSession.value.cancelledAt = Date.now()
    
    // Отменяем все запросы
    if (abortController.value) {
      abortController.value.abort()
    }
    
    // Отменяем все задачи
    uploadQueue.value.forEach(task => {
      if (task.status === 'running' || task.status === 'paused' || task.status === 'idle') {
        task.status = 'cancelled'
        task.endTime = Date.now()
      }
    })
    
    // Разблокируем паузу если есть
    if (pausePromise.value) {
      pausePromise.value.reject(new Error('Загрузка отменена'))
      pausePromise.value = null
    }
    
    console.log('❌ Загрузка отменена')
  }
  
  async function retryFailedTasks(): Promise<void> {
    if (failedTasks.value.length === 0) return
    
    // Возвращаем неудачные задачи в очередь
    failedTasks.value.forEach(task => {
      task.status = 'idle'
      task.progress = 0
      task.retryCount = 0
      task.error = undefined
      task.startTime = undefined
      task.endTime = undefined
      
      uploadQueue.value.push(task)
    })
    
    failedTasks.value = []
    statistics.failedTasks = 0
    
    // Если загрузка не активна, запускаем
    if (currentSession.value && currentSession.value.status !== 'running') {
      currentSession.value.status = 'running'
    }
    
    console.log('🔄 Перезапуск неудачных задач')
  }
  
  async function skipTask(taskId: string): Promise<void> {
    const task = uploadQueue.value.find(t => t.id === taskId)
    if (!task) return
    
    task.status = 'cancelled'
    task.endTime = Date.now()
    statistics.skippedTasks++
    
    // Удаляем из очереди
    const index = uploadQueue.value.indexOf(task)
    if (index >= 0) {
      uploadQueue.value.splice(index, 1)
    }
    
    console.log(`⏭️ Задача ${task.name} пропущена`)
  }
  
  // ============================================================================
  // УТИЛИТЫ
  // ============================================================================
  
  function getSessionSummary(): any {
    if (!currentSession.value) return null
    
    const session = currentSession.value
    const duration = session.endTime 
      ? session.endTime - (session.startTime || 0)
      : Date.now() - (session.startTime || 0)
    
    return {
      sessionId: session.id,
      name: session.name,
      status: session.status,
      duration,
      totalTasks: session.tasks.length,
      completedTasks: completedTasks.value.length,
      failedTasks: failedTasks.value.length,
      skippedTasks: statistics.skippedTasks,
      overallProgress: overallProgress.value,
      averageTaskTime: completedTasks.value.length > 0 
        ? completedTasks.value.reduce((sum, task) => 
            sum + ((task.endTime || 0) - (task.startTime || 0)), 0
          ) / completedTasks.value.length 
        : 0
    }
  }
  
  function resetSession(): void {
    currentSession.value = null
    uploadQueue.value = []
    completedTasks.value = []
    failedTasks.value = []
    
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    
    if (pausePromise.value) {
      pausePromise.value.reject(new Error('Сессия сброшена'))
      pausePromise.value = null
    }
    
    // Сбрасываем статистику
    Object.assign(statistics, {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      skippedTasks: 0,
      totalBytes: 0,
      uploadedBytes: 0,
      speed: 0,
      eta: 0,
      errorRate: 0
    })
  }
  
  // ============================================================================
  // WATCHERS
  // ============================================================================
  
  // Обновляем общий прогресс сессии
  watch(
    () => currentSession.value?.tasks.map(t => t.progress),
    () => {
      if (currentSession.value) {
        currentSession.value.totalProgress = overallProgress.value
      }
    },
    { deep: true }
  )
  
  // Обновляем статистику ошибок
  watch(
    [() => statistics.failedTasks, () => statistics.totalTasks],
    () => {
      statistics.errorRate = statistics.totalTasks > 0 
        ? Math.round((statistics.failedTasks / statistics.totalTasks) * 100)
        : 0
    }
  )
  
  // ============================================================================
  // ВОЗВРАЩАЕМЫЕ ЗНАЧЕНИЯ
  // ============================================================================
  
  return {
    // Состояние
    currentSession,
    uploadQueue,
    completedTasks,
    failedTasks,
    
    // Computed
    isUploading,
    isPaused,
    isCancelled,
    isCompleted,
    overallProgress,
    remainingTasks,
    activeTasks,
    canPause,
    canResume,
    canCancel,
    canRetry,
    
    // Статистика
    statistics,
    
    // Настройки
    config,
    
    // Методы
    createSession,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryFailedTasks,
    skipTask,
    getSessionSummary,
    resetSession,
    
    // Контроллер
    controller: computed((): UploadController => ({
      pause: pauseUpload,
      resume: resumeUpload,
      cancel: cancelUpload,
      retry: retryFailedTasks,
      skip: skipTask
    }))
  }
}

