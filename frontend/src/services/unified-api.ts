/**
 * Единый оптимизированный API сервис для Encounter Uploader
 * Фазы 4 + 5: API унификация + производительность
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { buildTaskPayload, buildSectorPayload, buildBonusPayload, type BonusPayloadArgs } from './upload/builders'
import { validateCriticalFields, type RequestType } from './upload/validator'
import type { UniversalAnswer } from '../types/level-system'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ApiRequestConfig {
  retries?: number
  timeout?: number
  skipCache?: boolean
  skipValidation?: boolean
  skipRateLimit?: boolean
  priority?: 'low' | 'normal' | 'high'
}

export interface ApiResponse<T = any> {
  data: T
  success: boolean
  cached?: boolean
  requestTime: number
  error?: string
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

export interface RateLimitConfig {
  requests: number
  period: number // milliseconds
  burst: number
}

export interface UploadProgress {
  current: number
  total: number
  type: 'task' | 'sector' | 'bonus'
  title: string
  eta?: number
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public requestType?: RequestType,
    public retryable = false
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field: string) {
    super(message, 400, undefined, false)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, public retryAfter: number) {
    super(message, 429, undefined, true)
    this.name = 'RateLimitError'
  }
}

// ============================================================================
// UNIFIED API SERVICE CLASS
// ============================================================================

export class UnifiedApiService {
  private axios: AxiosInstance
  private cache = new Map<string, CacheEntry>()
  private requestQueue: Array<{
    request: () => Promise<any>
    priority: number
    timestamp: number
  }> = []
  private activeRequests = 0
  private rateLimiter: {
    requests: number[]
    config: RateLimitConfig
  }
  private progressCallback?: (progress: UploadProgress) => void

  // Default configurations
  private readonly defaultConfig: Required<ApiRequestConfig> = {
    retries: 3,
    timeout: 30000,
    skipCache: false,
    skipValidation: false,
    skipRateLimit: false,
    priority: 'normal'
  }

  private readonly rateLimitConfig: RateLimitConfig = {
    requests: 30,      // Max 30 requests
    period: 60000,     // Per 1 minute
    burst: 5           // Max 5 concurrent
  }

  private readonly cacheConfig = {
    defaultTtl: 5 * 60 * 1000,  // 5 minutes
    maxEntries: 1000,
    cleanupInterval: 10 * 60 * 1000  // 10 minutes
  }

  // ============================================================================
  // CONSTRUCTOR & INITIALIZATION
  // ============================================================================

  constructor() {
    this.axios = axios.create({
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    this.rateLimiter = {
      requests: [],
      config: this.rateLimitConfig
    }

    this.setupInterceptors()
    this.startCacheCleanup()
    this.startRequestProcessor()
  }

  /**
   * Set progress callback for upload operations
   */
  setProgressCallback(callback: (progress: UploadProgress) => void) {
    this.progressCallback = callback
  }

  // ============================================================================
  // AXIOS INTERCEPTORS
  // ============================================================================

  private setupInterceptors() {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('❌ [API] Request error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        console.log(`✅ [API] ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        const status = error.response?.status
        const url = error.config?.url
        console.error(`❌ [API] ${status || 'Error'} ${url}:`, error.message)
        
        // Convert axios errors to our ApiError
        if (error.response) {
          throw new ApiError(
            `API Error: ${error.response.status} - ${error.response.data || error.message}`,
            error.response.status,
            undefined,
            this.isRetryableError(error.response.status)
          )
        } else if (error.request) {
          throw new ApiError('Network Error: No response received', 0, undefined, true)
        } else {
          throw new ApiError(`Request Error: ${error.message}`, 0, undefined, false)
        }
      }
    )
  }

  private isRetryableError(status: number): boolean {
    return status >= 500 || status === 429 || status === 408 || status === 0
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCacheKey(method: string, url: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : ''
    return `${method}:${url}:${dataStr}`
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    entry.hits++
    return entry.data
  }

  private setToCache<T>(key: string, data: T, ttl = this.cacheConfig.defaultTtl) {
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.cacheConfig.maxEntries) {
      this.cleanupCache(true)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    })
  }

  private cleanupCache(force = false) {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())

    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }

    // If still too many entries, remove least used
    if (force && this.cache.size >= this.cacheConfig.maxEntries) {
      const sortedEntries = entries
        .map(([key, entry]) => ({ key, entry }))
        .sort((a, b) => a.entry.hits - b.entry.hits)

      const toRemove = sortedEntries.slice(0, Math.floor(this.cacheConfig.maxEntries * 0.2))
      toRemove.forEach(({ key }) => this.cache.delete(key))
    }

    console.log(`🧹 [Cache] Cleaned up. Current size: ${this.cache.size}`)
  }

  private startCacheCleanup() {
    setInterval(() => {
      this.cleanupCache()
    }, this.cacheConfig.cleanupInterval)
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const { requests, config } = this.rateLimiter

    // Clean old requests
    const cutoff = now - config.period
    this.rateLimiter.requests = requests.filter(timestamp => timestamp > cutoff)

    // Check if we can make a request
    if (this.rateLimiter.requests.length >= config.requests) {
      const oldestRequest = Math.min(...this.rateLimiter.requests)
      const waitTime = config.period - (now - oldestRequest)
      throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`, waitTime)
    }

    // Check burst limit (concurrent requests)
    if (this.activeRequests >= config.burst) {
      throw new RateLimitError('Too many concurrent requests', 1000)
    }

    // Record this request
    this.rateLimiter.requests.push(now)
  }

  // ============================================================================
  // REQUEST QUEUE & PROCESSING
  // ============================================================================

  private startRequestProcessor() {
    setInterval(async () => {
      if (this.requestQueue.length === 0 || this.activeRequests >= this.rateLimitConfig.burst) {
        return
      }

      // Sort by priority (high = 3, normal = 2, low = 1) and timestamp
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.timestamp - b.timestamp
      })

      const request = this.requestQueue.shift()
      if (request) {
        try {
          await request.request()
        } catch (error) {
          console.error('❌ [Queue] Request failed:', error)
        }
      }
    }, 100) // Check every 100ms
  }

  private getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high': return 3
      case 'normal': return 2
      case 'low': return 1
      default: return 2
    }
  }

  // ============================================================================
  // CORE REQUEST METHOD
  // ============================================================================

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const startTime = Date.now()

    // Validation
    if (!finalConfig.skipValidation && data instanceof URLSearchParams) {
      const requestType = this.getRequestType(url)
      if (requestType) {
        const validation = validateCriticalFields(requestType, data)
        if (!validation.valid) {
          throw new ValidationError(`Validation failed: ${validation.errors.join(', ')}`, 'payload')
        }
      }
    }

    // Cache check
    const cacheKey = this.getCacheKey(method, url, data)
    if (!finalConfig.skipCache) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        console.log(`📦 [Cache] Hit for ${method} ${url}`)
        return {
          data: cached,
          success: true,
          cached: true,
          requestTime: Date.now() - startTime
        }
      }
    }

    // Rate limiting
    if (!finalConfig.skipRateLimit) {
      await this.checkRateLimit()
    }

    // Execute request with retry logic
    const executeRequest = async (attempt = 1): Promise<AxiosResponse<T>> => {
      try {
        this.activeRequests++
        
        const axiosConfig: AxiosRequestConfig = {
          timeout: finalConfig.timeout,
          headers: {
            'Content-Type': method === 'GET' ? 'application/json' : 'application/x-www-form-urlencoded'
          }
        }

        let response: AxiosResponse<T>
        if (method === 'GET') {
          response = await this.axios.get(url, axiosConfig)
        } else if (method === 'POST') {
          response = await this.axios.post(url, data, axiosConfig)
        } else {
          throw new ApiError(`Unsupported method: ${method}`)
        }

        return response
      } catch (error) {
        if (attempt <= finalConfig.retries && error instanceof ApiError && error.retryable) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Exponential backoff, max 10s
          console.log(`🔄 [API] Retry ${attempt}/${finalConfig.retries} after ${delay}ms for ${method} ${url}`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return executeRequest(attempt + 1)
        }
        throw error
      } finally {
        this.activeRequests--
      }
    }

    try {
      const response = await executeRequest()
      const result: ApiResponse<T> = {
        data: response.data,
        success: true,
        cached: false,
        requestTime: Date.now() - startTime
      }

      // Cache successful responses
      if (!finalConfig.skipCache && response.status < 400) {
        this.setToCache(cacheKey, response.data)
      }

      return result
    } catch (error) {
      console.error(`❌ [API] Final failure for ${method} ${url}:`, error)
      
      return {
        data: null as any,
        success: false,
        cached: false,
        requestTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private getRequestType(url: string): RequestType | null {
    if (url.includes('/task')) return 'task'
    if (url.includes('/sector')) return 'sector'
    if (url.includes('/bonus')) return 'bonus'
    return null
  }

  // ============================================================================
  // HIGH-LEVEL API METHODS
  // ============================================================================

  /**
   * Login to the system
   */
  async login(username: string, password: string): Promise<ApiResponse<any>> {
    return this.makeRequest('POST', '/api/login', { login: username, password })
  }

  /**
   * Upload task (level assignment)
   */
  async uploadTask(
    domain: string,
    gameId: string | number,
    levelId: string | number,
    html: string,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<any>> {
    const payload = buildTaskPayload(domain, gameId, levelId, html)
    
    this.progressCallback?.({
      current: 1,
      total: 1,
      type: 'task',
      title: 'Загрузка задания уровня...'
    })

    const response = await this.makeRequest('POST', '/api/admin/task', payload, config)

    if (response.success) {
      // Add delay for server processing
      await this.sleep(1200)
    }

    return response
  }

  /**
   * Upload single sector
   */
  async uploadSector(
    domain: string,
    gameId: string | number,
    levelId: string | number,
    variants: string[],
    sectorName = '',
    config?: ApiRequestConfig
  ): Promise<ApiResponse<any>> {
    const payload = buildSectorPayload(domain, gameId, levelId, variants, sectorName)
    
    const response = await this.makeRequest('POST', '/api/admin/sector', payload, config)

    if (response.success) {
      // Add delay for server processing
      await this.sleep(1200)
    }

    return response
  }

  /**
   * Upload multiple sectors with progress tracking
   */
  async uploadSectors(
    domain: string,
    gameId: string | number,
    levelId: string | number,
    sectors: Array<{ variants: string[], sectorName?: string }>,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<any[]>> {
    const results: any[] = []
    const total = sectors.length
    
    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i]
      
      this.progressCallback?.({
        current: i + 1,
        total,
        type: 'sector',
        title: `Загрузка сектора ${i + 1} из ${total}...`,
        eta: this.calculateETA(i, total, 1500) // ~1.5s per sector
      })

      try {
        const result = await this.uploadSector(
          domain, gameId, levelId,
          sector.variants,
          sector.sectorName,
          config
        )
        results.push(result)
      } catch (error) {
        console.error(`❌ [Sectors] Failed to upload sector ${i + 1}:`, error)
        results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    const successCount = results.filter(r => r.success).length
    return {
      data: results,
      success: successCount === total,
      cached: false,
      requestTime: 0,
      error: successCount < total ? `${total - successCount} sectors failed` : undefined
    }
  }

  /**
   * Upload single bonus
   */
  async uploadBonus(args: BonusPayloadArgs, config?: ApiRequestConfig): Promise<ApiResponse<any>> {
    const payload = buildBonusPayload(args)
    
    const response = await this.makeRequest('POST', '/api/admin/bonus', payload, config)

    if (response.success) {
      // Add delay for server processing
      await this.sleep(1200)
    }

    return response
  }

  /**
   * Upload multiple bonuses with progress tracking
   */
  async uploadBonuses(
    domain: string,
    gameId: string | number,
    levelId: string | number,
    bonuses: Array<Omit<BonusPayloadArgs, 'domain' | 'gid' | 'level'>>,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<any[]>> {
    const results: any[] = []
    const total = bonuses.length
    
    for (let i = 0; i < bonuses.length; i++) {
      const bonus = bonuses[i]
      
      this.progressCallback?.({
        current: i + 1,
        total,
        type: 'bonus',
        title: `Загрузка бонуса ${i + 1} из ${total}...`,
        eta: this.calculateETA(i, total, 1500) // ~1.5s per bonus
      })

      try {
        const result = await this.uploadBonus(
          { ...bonus, domain, gid: gameId, level: levelId },
          config
        )
        results.push(result)
      } catch (error) {
        console.error(`❌ [Bonuses] Failed to upload bonus ${i + 1}:`, error)
        results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    const successCount = results.filter(r => r.success).length
    return {
      data: results,
      success: successCount === total,
      cached: false,
      requestTime: 0,
      error: successCount < total ? `${total - successCount} bonuses failed` : undefined
    }
  }

  /**
   * Upload level from Universal Store format
   */
  async uploadLevel(
    domain: string,
    gameId: string | number,
    levelId: string | number,
    answers: UniversalAnswer[],
    task?: string,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<{ task?: any, sectors: any[], bonuses: any[] }>> {
    const results: { task?: any, sectors: any[], bonuses: any[] } = {
      sectors: [],
      bonuses: []
    }

    // 1. Upload task if provided
    if (task) {
      console.log('📤 [Level] Uploading task...')
      const taskResult = await this.uploadTask(domain, gameId, levelId, task, config)
      results.task = taskResult
    }

    // 2. Prepare sectors
    const sectors = answers.filter(answer => 
      (answer.type === 'sector' || answer.inSector) && 
      answer.variants.some(v => v.trim())
    ).map(answer => ({
      variants: answer.variants.filter(v => v.trim()),
      sectorName: answer.sectorName || ''
    }))

    // 3. Upload sectors
    if (sectors.length > 0) {
      console.log(`📤 [Level] Uploading ${sectors.length} sectors...`)
      const sectorsResult = await this.uploadSectors(domain, gameId, levelId, sectors, config)
      results.sectors = sectorsResult.data || []
    }

    // 4. Prepare bonuses
    const bonuses = answers.filter(answer => 
      (answer.type === 'bonus' || answer.inBonus) && 
      answer.variants.some(v => v.trim())
    ).map((answer, index) => ({
      name: answer.bonusName || `Бонус ${answer.id}`,
      variants: answer.variants.filter(v => v.trim()),
      time: answer.bonusTime || { hours: 0, minutes: 0, seconds: 0 },
      task: answer.bonusTask || '',
      hint: answer.bonusHint || '',
      allLevels: answer.bonusLevels?.allLevels || false,
      levelCheckboxNames: answer.bonusLevels?.levelCheckboxNames || [`level_${levelId}`],
      delay: answer.bonusDelay,
      relativeLimit: answer.bonusLimit
    }))

    // 5. Upload bonuses
    if (bonuses.length > 0) {
      console.log(`📤 [Level] Uploading ${bonuses.length} bonuses...`)
      const bonusesResult = await this.uploadBonuses(domain, gameId, levelId, bonuses, config)
      results.bonuses = bonusesResult.data || []
    }

    const allSuccess = (
      (!results.task || results.task.success) &&
      results.sectors.every((r: any) => r.success) &&
      results.bonuses.every((r: any) => r.success)
    )

    return {
      data: results,
      success: allSuccess,
      cached: false,
      requestTime: 0,
      error: allSuccess ? undefined : 'Some uploads failed'
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private calculateETA(current: number, total: number, avgTimePerItem: number): number {
    const remaining = total - current
    return remaining * avgTimePerItem
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 [Cache] Cleared all entries')
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.values())
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    const now = Date.now()
    const recentRequests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimitConfig.period
    )

    return {
      requestsInPeriod: recentRequests.length,
      maxRequests: this.rateLimitConfig.requests,
      activeRequests: this.activeRequests,
      maxConcurrent: this.rateLimitConfig.burst,
      queueSize: this.requestQueue.length,
      nextAvailableSlot: recentRequests.length >= this.rateLimitConfig.requests 
        ? Math.min(...recentRequests) + this.rateLimitConfig.period - now
        : 0
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const unifiedApi = new UnifiedApiService()

// ============================================================================
// LEGACY COMPATIBILITY WRAPPERS
// ============================================================================

/**
 * Legacy compatibility - gradual migration
 */
export const sendTask = (domain: string, gameId: string | number, levelId: string | number, html: string) =>
  unifiedApi.uploadTask(domain, gameId, levelId, html)

export const sendSector = (domain: string, gameId: string | number, levelId: string | number, variants: string[], sectorName = '') =>
  unifiedApi.uploadSector(domain, gameId, levelId, variants, sectorName)

export const sendBonuses = (domain: string, gameId: string | number, levelId: string | number, bonuses: any[]) =>
  unifiedApi.uploadBonuses(domain, gameId, levelId, bonuses)
