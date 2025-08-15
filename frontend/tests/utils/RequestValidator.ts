import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface RequestSnapshot {
  url: string
  method: string | undefined
  headers: any
  data: Record<string, any>
  timestamp: number
}

export interface ValidationResult {
  valid: boolean
  error?: string
  differences?: string[]
  missing?: string[]
  extra?: string[]
}

export interface SnapshotComparison {
  matches: boolean
  differences: Array<{
    field: string
    expected: any
    actual: any
  }>
  recommendation: string
}

export class RequestValidator {
  private baseline: Map<string, RequestSnapshot> = new Map()
  private interceptorId: number | null = null
  
  /**
   * Парсит form-urlencoded данные в объект
   */
  private parseFormData(data: any): Record<string, any> {
    if (typeof data !== 'string') return data
    
    const params = new URLSearchParams(data)
    const result: Record<string, any> = {}
    
    for (const [key, value] of params.entries()) {
      result[key] = value
    }
    
    return result
  }
  
  /**
   * Записывает эталонные запросы из текущей (рабочей) версии
   */
  async recordBaseline(): Promise<void> {
    console.log('📝 Начинаю запись эталонных запросов...')
    
    // Перехват всех запросов к /api/admin/*
    this.interceptorId = axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.url?.includes('/api/admin/')) {
          const snapshot: RequestSnapshot = {
            url: config.url,
            method: config.method,
            headers: { ...config.headers },
            data: this.parseFormData(config.data),
            timestamp: Date.now()
          }
          
          // Сохраняем по типу запроса
          const requestType = this.getRequestType(config.url)
          const key = `${requestType}-${Object.keys(this.parseFormData(config.data)).length}`
          this.baseline.set(key, snapshot)
          
          console.log(`  ✅ Записан эталон: ${key}`)
        }
        return config
      }
    )
  }
  
  /**
   * Останавливает запись эталонов
   */
  stopRecording(): void {
    if (this.interceptorId !== null) {
      axios.interceptors.request.eject(this.interceptorId)
      this.interceptorId = null
      console.log('⏹️ Запись эталонов остановлена')
    }
  }
  
  /**
   * Определяет тип запроса по URL
   */
  private getRequestType(url: string): 'task' | 'sector' | 'bonus' | 'unknown' {
    if (url.includes('/task')) return 'task'
    if (url.includes('/sector')) return 'sector'
    if (url.includes('/bonus')) return 'bonus'
    return 'unknown'
  }
  
  /**
   * Сохраняет эталоны в файл
   */
  async saveBaseline(filepath: string): Promise<void> {
    const data = Array.from(this.baseline.entries()).map(([key, value]) => ({
      key,
      ...value
    }))
    
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`💾 Эталоны сохранены в ${filepath}`)
  }
  
  /**
   * Загружает эталоны из файла
   */
  async loadBaseline(filepath: string): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8')
    const data = JSON.parse(content)
    
    this.baseline.clear()
    for (const item of data) {
      const { key, ...snapshot } = item
      this.baseline.set(key, snapshot as RequestSnapshot)
    }
    
    console.log(`📂 Загружено ${this.baseline.size} эталонных запросов`)
  }
  
  /**
   * Проверяет, является ли различие допустимым
   */
  private isAcceptableDiff(key: string, expected: any, actual: any): boolean {
    // Временные метки и ID могут отличаться
    if (key === 'timestamp' || key.includes('_id')) return true
    
    // Для уровней - главное чтобы был хотя бы один
    if (key.startsWith('level_')) {
      return actual === 'on' || expected === 'on'
    }
    
    return false
  }
  
  /**
   * Валидация запроса против эталона
   */
  validateRequest(url: string, data: any): ValidationResult {
    const requestType = this.getRequestType(url)
    const parsedData = this.parseFormData(data)
    const dataKeys = Object.keys(parsedData).length
    const key = `${requestType}-${dataKeys}`
    
    const baseline = this.baseline.get(key)
    if (!baseline) {
      // Попробуем найти похожий эталон
      const similarKey = Array.from(this.baseline.keys()).find(k => k.startsWith(requestType))
      if (similarKey) {
        const similar = this.baseline.get(similarKey)!
        return {
          valid: false,
          error: `Нет точного эталона для ${key}, найден похожий: ${similarKey}`,
          differences: [`Количество полей: ожидалось ${Object.keys(similar.data).length}, получено ${dataKeys}`]
        }
      }
      
      return { 
        valid: false, 
        error: `Эталон для ${key} не найден` 
      }
    }
    
    const validation: ValidationResult = {
      valid: true,
      differences: [],
      missing: [],
      extra: []
    }
    
    // Проверка всех полей из эталона
    for (const [key, value] of Object.entries(baseline.data)) {
      if (!(key in parsedData)) {
        validation.missing!.push(key)
        validation.valid = false
      } else if (parsedData[key] !== value && !this.isAcceptableDiff(key, value, parsedData[key])) {
        validation.differences!.push(`${key}: ожидалось "${value}", получено "${parsedData[key]}"`)
        validation.valid = false
      }
    }
    
    // Проверка лишних полей
    for (const key of Object.keys(parsedData)) {
      if (!(key in baseline.data)) {
        validation.extra!.push(key)
        // Предупреждение, но не ошибка
      }
    }
    
    return validation
  }
  
  /**
   * Проверка критически важных полей для каждого типа запроса
   */
  validateCriticalFields(requestType: 'task' | 'sector' | 'bonus', data: any): boolean {
    const parsedData = this.parseFormData(data)
    
    const criticalFields: Record<string, Array<string | RegExp>> = {
      task: ['domain', 'gid', 'level', 'inputTask'],
      sector: ['domain', 'gid', 'level', 'savesector', /txtAnswer_\d+/, /ddlAnswerFor_\d+/],
      bonus: [
        'domain', 'gid', 'level', 'txtBonusName', 
        /answer_-\d+/, 'txtHours', 'txtMinutes', 'txtSeconds'
      ]
    }
    
    const fields = criticalFields[requestType]
    if (!fields) return false
    
    return fields.every(field => {
      if (field instanceof RegExp) {
        return Object.keys(parsedData).some(key => field.test(key))
      }
      return field in parsedData
    })
  }
  
  /**
   * Генерирует детальный отчет о валидации
   */
  generateReport(results: Map<string, ValidationResult>): string {
    let report = '📊 ОТЧЕТ О ВАЛИДАЦИИ ЗАПРОСОВ\n'
    report += '=' .repeat(50) + '\n\n'
    
    let totalValid = 0
    let totalInvalid = 0
    
    for (const [key, result] of results.entries()) {
      if (result.valid) {
        totalValid++
        report += `✅ ${key}: Валидный\n`
      } else {
        totalInvalid++
        report += `❌ ${key}: Невалидный\n`
        if (result.error) report += `   Ошибка: ${result.error}\n`
        if (result.missing?.length) report += `   Отсутствуют поля: ${result.missing.join(', ')}\n`
        if (result.differences?.length) {
          report += `   Различия:\n`
          result.differences.forEach(d => report += `     - ${d}\n`)
        }
        if (result.extra?.length) report += `   Лишние поля: ${result.extra.join(', ')}\n`
      }
      report += '\n'
    }
    
    report += '=' .repeat(50) + '\n'
    report += `ИТОГО: ✅ ${totalValid} валидных, ❌ ${totalInvalid} невалидных\n`
    
    return report
  }
}