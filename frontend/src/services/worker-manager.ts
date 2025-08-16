/**
 * Менеджер Web Workers
 * Реализация согласно плану рефакторинга (Фаза 5.2)
 */

// ============================================================================
// ТИПЫ
// ============================================================================

interface WorkerInstance {
  worker: Worker
  ready: boolean
  busy: boolean
  name: string
  capabilities: string[]
}

interface WorkerTask {
  id: string
  type: string
  data: any
  resolve: (value: any) => void
  reject: (error: any) => void
  progress?: (progress: any) => void
  timestamp: number
}

interface WorkerConfig {
  maxWorkers: number
  retryAttempts: number
  timeout: number
}

// ============================================================================
// МЕНЕДЖЕР WEB WORKERS
// ============================================================================

export class WorkerManager {
  private workers: Map<string, WorkerInstance[]> = new Map()
  private tasks: Map<string, WorkerTask> = new Map()
  private config: WorkerConfig
  private nextTaskId = 1
  
  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      maxWorkers: config.maxWorkers ?? 2,
      retryAttempts: config.retryAttempts ?? 3,
      timeout: config.timeout ?? 30000
    }
  }
  
  // ============================================================================
  // УПРАВЛЕНИЕ WORKERS
  // ============================================================================
  
  async createWorker(name: string, scriptPath: string): Promise<WorkerInstance> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(new URL(scriptPath, import.meta.url), {
          type: 'module'
        })
        
        const instance: WorkerInstance = {
          worker,
          ready: false,
          busy: false,
          name,
          capabilities: []
        }
        
        // Обработчик готовности
        const readyHandler = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            instance.ready = true
            instance.capabilities = event.data.data?.capabilities || []
            worker.removeEventListener('message', readyHandler)
            resolve(instance)
          }
        }
        
        // Обработчик ошибок
        const errorHandler = (error: ErrorEvent) => {
          worker.removeEventListener('message', readyHandler)
          worker.removeEventListener('error', errorHandler)
          reject(new Error(`Ошибка создания воркера ${name}: ${error.message}`))
        }
        
        worker.addEventListener('message', readyHandler)
        worker.addEventListener('error', errorHandler)
        
        // Таймаут ожидания готовности
        setTimeout(() => {
          worker.removeEventListener('message', readyHandler)
          worker.removeEventListener('error', errorHandler)
          reject(new Error(`Таймаут создания воркера ${name}`))
        }, 5000)
        
      } catch (error) {
        reject(error)
      }
    })
  }
  
  async initializeWorker(name: string, scriptPath: string, count: number = 1): Promise<void> {
    const instances: WorkerInstance[] = []
    const actualCount = Math.min(count, this.config.maxWorkers)
    
    for (let i = 0; i < actualCount; i++) {
      try {
        const instance = await this.createWorker(`${name}-${i}`, scriptPath)
        instances.push(instance)
        console.log(`✅ Воркер ${instance.name} готов (возможности: ${instance.capabilities.join(', ')})`)
      } catch (error) {
        console.error(`❌ Ошибка создания воркера ${name}-${i}:`, error)
      }
    }
    
    if (instances.length > 0) {
      this.workers.set(name, instances)
      console.log(`🚀 Инициализировано ${instances.length} воркеров типа ${name}`)
    } else {
      throw new Error(`Не удалось создать ни одного воркера типа ${name}`)
    }
  }
  
  private getAvailableWorker(workerType: string): WorkerInstance | null {
    const instances = this.workers.get(workerType)
    if (!instances) return null
    
    return instances.find(instance => instance.ready && !instance.busy) || null
  }
  
  // ============================================================================
  // ВЫПОЛНЕНИЕ ЗАДАЧ
  // ============================================================================
  
  async executeTask<T = any>(
    workerType: string,
    taskType: string,
    data: any,
    options: {
      onProgress?: (progress: any) => void
      timeout?: number
      priority?: 'high' | 'normal' | 'low'
    } = {}
  ): Promise<T> {
    const worker = this.getAvailableWorker(workerType)
    
    if (!worker) {
      throw new Error(`Нет доступных воркеров типа ${workerType}`)
    }
    
    const taskId = `task-${this.nextTaskId++}`
    const timeout = options.timeout ?? this.config.timeout
    
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        type: taskType,
        data,
        resolve,
        reject,
        progress: options.onProgress,
        timestamp: Date.now()
      }
      
      this.tasks.set(taskId, task)
      worker.busy = true
      
      // Обработчик результатов
      const messageHandler = (event: MessageEvent) => {
        const response = event.data
        
        if (response.type === 'progress' && task.progress) {
          task.progress(response.data)
          return
        }
        
        if (response.type === taskType || response.type === 'error') {
          worker.worker.removeEventListener('message', messageHandler)
          worker.worker.removeEventListener('error', errorHandler)
          worker.busy = false
          this.tasks.delete(taskId)
          clearTimeout(timeoutId)
          
          if (response.success) {
            resolve(response.data)
          } else {
            reject(new Error(response.error || 'Неизвестная ошибка воркера'))
          }
        }
      }
      
      // Обработчик ошибок
      const errorHandler = (error: ErrorEvent) => {
        worker.worker.removeEventListener('message', messageHandler)
        worker.worker.removeEventListener('error', errorHandler)
        worker.busy = false
        this.tasks.delete(taskId)
        clearTimeout(timeoutId)
        reject(new Error(`Ошибка воркера: ${error.message}`))
      }
      
      // Таймаут
      const timeoutId = setTimeout(() => {
        worker.worker.removeEventListener('message', messageHandler)
        worker.worker.removeEventListener('error', errorHandler)
        worker.busy = false
        this.tasks.delete(taskId)
        reject(new Error(`Таймаут выполнения задачи ${taskId}`))
      }, timeout)
      
      worker.worker.addEventListener('message', messageHandler)
      worker.worker.addEventListener('error', errorHandler)
      
      // Отправляем задачу воркеру
      worker.worker.postMessage({
        type: taskType,
        data,
        taskId
      })
    })
  }
  
  // ============================================================================
  // СПЕЦИАЛИЗИРОВАННЫЕ МЕТОДЫ
  // ============================================================================
  
  // Генерация олимпийских макетов
  async generateOlympLayout(sectors: number, level: string, options: { optimize?: boolean } = {}): Promise<any> {
    if (!this.workers.has('olymp')) {
      await this.initializeWorker('olymp', '../workers/olympGenerator.worker.ts')
    }
    
    const taskType = options.optimize ? 'optimizeLayout' : 'generateLayout'
    const data = options.optimize 
      ? { sectors, level, options: { minify: true, compress: true } }
      : { sectors, level }
    
    return this.executeTask('olymp', taskType, data)
  }
  
  // Генерация кодов
  async generateCodes(
    count: number,
    length: number,
    options: {
      useNumbers?: boolean
      useLetters?: boolean
      allowDuplicates?: boolean
      excludeAmbiguous?: boolean
      onProgress?: (progress: any) => void
    } = {}
  ): Promise<any> {
    if (!this.workers.has('codes')) {
      await this.initializeWorker('codes', '../workers/codeGenerator.worker.ts')
    }
    
    const data = {
      count,
      length,
      useNumbers: options.useNumbers ?? true,
      useLetters: options.useLetters ?? false,
      allowDuplicates: options.allowDuplicates ?? false,
      excludeAmbiguous: options.excludeAmbiguous ?? true
    }
    
    return this.executeTask('codes', 'generateCodes', data, {
      onProgress: options.onProgress,
      timeout: Math.max(30000, count * 10) // Динамический таймаут
    })
  }
  
  // Валидация кодов
  async validateCodes(
    codes: string[],
    rules: any = {},
    onProgress?: (progress: any) => void
  ): Promise<any> {
    if (!this.workers.has('codes')) {
      await this.initializeWorker('codes', '../workers/codeGenerator.worker.ts')
    }
    
    return this.executeTask('codes', 'validateCodes', { codes, rules }, {
      onProgress,
      timeout: Math.max(15000, codes.length * 5)
    })
  }
  
  // ============================================================================
  // УПРАВЛЕНИЕ И СТАТИСТИКА
  // ============================================================================
  
  getWorkerStats() {
    const stats: any = {}
    
    this.workers.forEach((instances, type) => {
      stats[type] = {
        total: instances.length,
        ready: instances.filter(w => w.ready).length,
        busy: instances.filter(w => w.busy).length,
        capabilities: instances[0]?.capabilities || []
      }
    })
    
    return {
      workerTypes: Object.keys(stats),
      stats,
      activeTasks: this.tasks.size,
      config: this.config
    }
  }
  
  async terminateWorkers(type?: string): Promise<void> {
    const typesToTerminate = type ? [type] : Array.from(this.workers.keys())
    
    for (const workerType of typesToTerminate) {
      const instances = this.workers.get(workerType)
      if (instances) {
        instances.forEach(instance => {
          instance.worker.terminate()
        })
        this.workers.delete(workerType)
        console.log(`🔴 Завершены воркеры типа ${workerType}`)
      }
    }
    
    // Отклоняем оставшиеся задачи
    this.tasks.forEach(task => {
      task.reject(new Error('Воркер был завершен'))
    })
    this.tasks.clear()
  }
  
  // ============================================================================
  // ОЧИСТКА РЕСУРСОВ
  // ============================================================================
  
  async destroy(): Promise<void> {
    await this.terminateWorkers()
    console.log('🔴 WorkerManager уничтожен')
  }
}

// ============================================================================
// ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР
// ============================================================================

export const workerManager = new WorkerManager({
  maxWorkers: navigator.hardwareConcurrency || 2,
  retryAttempts: 3,
  timeout: 30000
})

// Автоматическая очистка при выходе
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    workerManager.destroy()
  })
}

// ============================================================================
// ЭКСПОРТ УТИЛИТ
// ============================================================================

export * from './worker-manager'

