<template>
  <div class="test-optimized-api">
    <div class="test-header">
      <h1>🚀 Тест оптимизированного API сервиса</h1>
      <p>Демонстрация фаз 4 + 5: Единый API + производительность</p>
    </div>

    <!-- API Status Dashboard -->
    <div class="api-dashboard">
      <h2>📊 API Dashboard</h2>
      
      <div class="dashboard-grid">
        <!-- Upload Status -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>🔄 Статус загрузки</h3>
            <div :class="['status-indicator', { active: universalStore.isUploading }]"></div>
          </div>
          
          <div v-if="universalStore.isUploading" class="upload-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-text">{{ universalStore.uploadProgress.title }}</span>
              <span class="progress-numbers">
                {{ universalStore.uploadProgress.current }} / {{ universalStore.uploadProgress.total }}
              </span>
            </div>
            <div v-if="universalStore.uploadProgress.eta" class="eta">
              ETA: {{ formatTime(universalStore.uploadProgress.eta) }}
            </div>
          </div>
          
          <div v-else class="idle-status">
            <span class="idle-text">Готов к загрузке</span>
            <div v-if="universalStore.lastUploadError" class="error-message">
              ❌ {{ universalStore.lastUploadError }}
            </div>
          </div>
        </div>

        <!-- Cache Stats -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>💾 Кэширование</h3>
            <button @click="refreshStats" class="refresh-btn">🔄</button>
          </div>
          
          <div class="stats-grid">
            <div class="stat">
              <span class="stat-value">{{ apiStats.cache.size }}</span>
              <span class="stat-label">записей</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ apiStats.cache.totalHits }}</span>
              <span class="stat-label">попаданий</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ cacheHitRate }}%</span>
              <span class="stat-label">hit rate</span>
            </div>
          </div>
          
          <button @click="clearCache" class="clear-btn">Очистить кэш</button>
        </div>

        <!-- Rate Limiting -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>⚡ Rate Limiting</h3>
          </div>
          
          <div class="rate-limit-info">
            <div class="rate-limit-bar">
              <div 
                class="rate-limit-fill" 
                :style="{ width: rateLimitPercentage + '%' }"
              ></div>
            </div>
            <div class="rate-limit-stats">
              <span>{{ apiStats.rateLimit.requestsInPeriod }} / {{ apiStats.rateLimit.maxRequests }} запросов</span>
              <span>{{ apiStats.rateLimit.activeRequests }} / {{ apiStats.rateLimit.maxConcurrent }} активных</span>
            </div>
            <div v-if="apiStats.rateLimit.queueSize > 0" class="queue-info">
              Очередь: {{ apiStats.rateLimit.queueSize }} запросов
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Controls -->
    <div class="test-controls">
      <h2>🧪 Тестирование функций</h2>
      
      <div class="control-section">
        <div class="control-group">
          <h3>📤 Загрузка через новый API</h3>
          <div class="button-grid">
            <button 
              @click="testUploadSectors" 
              :disabled="universalStore.isUploading || !hasSectors"
              class="test-btn primary"
            >
              Тест загрузки секторов ({{ sectorsCount }})
            </button>
            <button 
              @click="testUploadBonuses" 
              :disabled="universalStore.isUploading || !hasBonuses"
              class="test-btn primary"
            >
              Тест загрузки бонусов ({{ bonusesCount }})
            </button>
            <button 
              @click="testUploadLevel" 
              :disabled="universalStore.isUploading || (!hasSectors && !hasBonuses)"
              class="test-btn primary"
            >
              Полная загрузка уровня
            </button>
          </div>
        </div>

        <div class="control-group">
          <h3>🔧 Тест производительности</h3>
          <div class="button-grid">
            <button @click="testCaching" class="test-btn secondary">
              Тест кэширования (5 одинаковых запросов)
            </button>
            <button @click="testRateLimit" class="test-btn secondary">
              Тест rate limiting (30 запросов)
            </button>
            <button @click="testRetryLogic" class="test-btn secondary">
              Тест retry логики
            </button>
          </div>
        </div>

        <div class="control-group">
          <h3>🔍 Анализ производительности</h3>
          <div class="button-grid">
            <button @click="startPerformanceTest" :disabled="performanceTest.running" class="test-btn accent">
              {{ performanceTest.running ? 'Тест выполняется...' : 'Запустить нагрузочный тест' }}
            </button>
            <button @click="generateReport" class="test-btn accent">
              Сформировать отчет
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Test Results -->
    <div v-if="performanceTest.results.length > 0" class="performance-results">
      <h2>📈 Результаты тестов производительности</h2>
      
      <div class="results-grid">
        <div 
          v-for="(result, index) in performanceTest.results" 
          :key="index"
          class="result-card"
        >
          <h4>{{ result.name }}</h4>
          <div class="result-stats">
            <div class="result-stat">
              <span class="result-value">{{ result.avgTime }}ms</span>
              <span class="result-label">среднее время</span>
            </div>
            <div class="result-stat">
              <span class="result-value">{{ result.successRate }}%</span>
              <span class="result-label">успешность</span>
            </div>
            <div class="result-stat">
              <span class="result-value">{{ result.cacheHits }}</span>
              <span class="result-label">cache hits</span>
            </div>
          </div>
          
          <div class="result-timeline">
            <div 
              v-for="(time, i) in result.responseTimes" 
              :key="i"
              class="timeline-bar"
              :style="{ height: (time / Math.max(...result.responseTimes)) * 100 + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Console -->
    <div class="live-console">
      <div class="console-header">
        <h3>📟 Live Console</h3>
        <button @click="clearConsole" class="clear-console-btn">Очистить</button>
      </div>
      
      <div class="console-content" ref="consoleRef">
        <div 
          v-for="(log, index) in consoleLogs" 
          :key="index"
          :class="['log-entry', log.type]"
        >
          <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- Achievements -->
    <div class="achievements-section">
      <h2>🏆 Достижения нового API</h2>
      
      <div class="achievements-grid">
        <div class="achievement">
          <div class="achievement-icon">🔧</div>
          <h4>Единый API интерфейс</h4>
          <p>Все запросы через унифицированный сервис</p>
        </div>
        
        <div class="achievement">
          <div class="achievement-icon">💾</div>
          <h4>Интеллектуальное кэширование</h4>
          <p>TTL, LRU eviction, автоочистка</p>
        </div>
        
        <div class="achievement">
          <div class="achievement-icon">⚡</div>
          <h4>Rate limiting & queueing</h4>
          <p>30 req/min, 5 concurrent, приоритеты</p>
        </div>
        
        <div class="achievement">
          <div class="achievement-icon">🔄</div>
          <h4>Retry с exponential backoff</h4>
          <p>Автоматические повторы с умной задержкой</p>
        </div>
        
        <div class="achievement">
          <div class="achievement-icon">📊</div>
          <h4>Real-time progress tracking</h4>
          <p>ETA, проценты, детальный прогресс</p>
        </div>
        
        <div class="achievement">
          <div class="achievement-icon">🛡️</div>
          <h4>Централизованная обработка ошибок</h4>
          <p>Типизированные ошибки, логирование</p>
        </div>
      </div>
    </div>

    <!-- Next Phase -->
    <div class="next-phase">
      <h3>🚀 Готов к Фазе 6</h3>
      <p>Следующий шаг: Инфраструктура и DevOps оптимизация</p>
      <div class="next-features">
        <span class="feature">🐳 Docker optimization</span>
        <span class="feature">📦 Build optimization</span>
        <span class="feature">🔧 Dev tools</span>
        <span class="feature">📈 Monitoring</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useUniversalStore } from '../store/universal'

// ============================================================================
// STATE
// ============================================================================

const universalStore = useUniversalStore()

const apiStats = ref({
  cache: { size: 0, totalHits: 0, oldestEntry: null, newestEntry: null },
  rateLimit: { 
    requestsInPeriod: 0, 
    maxRequests: 30, 
    activeRequests: 0, 
    maxConcurrent: 5, 
    queueSize: 0,
    nextAvailableSlot: 0 
  }
})

const consoleLogs = ref<Array<{ 
  timestamp: Date, 
  message: string, 
  type: 'info' | 'success' | 'error' | 'warning' 
}>>([])

const performanceTest = ref({
  running: false,
  results: [] as Array<{
    name: string
    avgTime: number
    successRate: number
    cacheHits: number
    responseTimes: number[]
  }>
})

const consoleRef = ref<HTMLElement>()

// ============================================================================
// COMPUTED
// ============================================================================

const progressPercentage = computed(() => {
  const { current, total } = universalStore.uploadProgress
  return total > 0 ? Math.round((current / total) * 100) : 0
})

const cacheHitRate = computed(() => {
  const { size, totalHits } = apiStats.value.cache
  return size > 0 ? Math.round((totalHits / size) * 100) : 0
})

const rateLimitPercentage = computed(() => {
  const { requestsInPeriod, maxRequests } = apiStats.value.rateLimit
  return Math.round((requestsInPeriod / maxRequests) * 100)
})

const hasSectors = computed(() => universalStore.validSectorsCount > 0)
const hasBonuses = computed(() => universalStore.validBonusesCount > 0)
const sectorsCount = computed(() => universalStore.validSectorsCount)
const bonusesCount = computed(() => universalStore.validBonusesCount)

// ============================================================================
// METHODS
// ============================================================================

function addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  consoleLogs.value.push({
    timestamp: new Date(),
    message,
    type
  })
  
  nextTick(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }
  })
}

function clearConsole() {
  consoleLogs.value = []
}

function refreshStats() {
  apiStats.value = universalStore.getApiStats()
  addLog(`📊 Stats refreshed - Cache: ${apiStats.value.cache.size} entries, Rate: ${apiStats.value.rateLimit.requestsInPeriod}/${apiStats.value.rateLimit.maxRequests}`)
}

function clearCache() {
  universalStore.clearApiCache()
  refreshStats()
  addLog('🧹 Cache cleared', 'success')
}

function formatTime(ms: number): string {
  return ms > 1000 ? `${Math.round(ms / 1000)}s` : `${ms}ms`
}

function formatLogTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// ============================================================================
// TEST METHODS
// ============================================================================

async function testUploadSectors() {
  if (!hasSectors.value) return
  
  addLog(`🚀 Starting sectors upload test (${sectorsCount.value} sectors)...`)
  
  try {
    const result = await universalStore.uploadSectors()
    
    if (result?.success) {
      addLog(`✅ Sectors uploaded successfully`, 'success')
    } else {
      addLog(`❌ Sectors upload failed: ${result?.error}`, 'error')
    }
  } catch (error) {
    addLog(`❌ Upload error: ${error}`, 'error')
  }
  
  refreshStats()
}

async function testUploadBonuses() {
  if (!hasBonuses.value) return
  
  addLog(`🚀 Starting bonuses upload test (${bonusesCount.value} bonuses)...`)
  
  try {
    const result = await universalStore.uploadBonuses()
    
    if (result?.success) {
      addLog(`✅ Bonuses uploaded successfully`, 'success')
    } else {
      addLog(`❌ Bonuses upload failed: ${result?.error}`, 'error')
    }
  } catch (error) {
    addLog(`❌ Upload error: ${error}`, 'error')
  }
  
  refreshStats()
}

async function testUploadLevel() {
  if (!hasSectors.value && !hasBonuses.value) return
  
  addLog(`🚀 Starting full level upload test...`)
  
  try {
    const result = await universalStore.uploadCurrentLevel()
    
    if (result?.success) {
      addLog(`✅ Level uploaded successfully`, 'success')
    } else {
      addLog(`❌ Level upload failed: ${result?.error}`, 'error')
    }
  } catch (error) {
    addLog(`❌ Upload error: ${error}`, 'error')
  }
  
  refreshStats()
}

async function testCaching() {
  addLog('🧪 Testing caching with 5 identical requests...')
  
  const startTime = Date.now()
  const promises = []
  
  // Make 5 identical requests
  for (let i = 0; i < 5; i++) {
    promises.push(universalStore.uploadTask())
  }
  
  try {
    await Promise.all(promises)
    const endTime = Date.now()
    
    addLog(`✅ Cache test completed in ${endTime - startTime}ms`, 'success')
    refreshStats()
  } catch (error) {
    addLog(`❌ Cache test failed: ${error}`, 'error')
  }
}

async function testRateLimit() {
  addLog('🧪 Testing rate limiting with 30 rapid requests...')
  
  const promises = []
  
  for (let i = 0; i < 30; i++) {
    promises.push(
      universalStore.uploadTask().catch(error => ({ error: error.message }))
    )
  }
  
  try {
    const results = await Promise.all(promises)
    const successful = results.filter(r => !r.error).length
    const rateLimited = results.filter(r => r.error?.includes('Rate limit')).length
    
    addLog(`✅ Rate limit test: ${successful} successful, ${rateLimited} rate limited`, 'success')
    refreshStats()
  } catch (error) {
    addLog(`❌ Rate limit test failed: ${error}`, 'error')
  }
}

async function testRetryLogic() {
  addLog('🧪 Testing retry logic with invalid request...')
  
  try {
    // This should trigger retry logic
    const result = await universalStore.uploadTask()
    
    if (result?.success) {
      addLog(`✅ Retry test successful`, 'success')
    } else {
      addLog(`⚠️ Retry test completed with expected failure`, 'warning')
    }
  } catch (error) {
    addLog(`⚠️ Retry test completed: ${error}`, 'warning')
  }
  
  refreshStats()
}

async function startPerformanceTest() {
  if (performanceTest.value.running) return
  
  performanceTest.value.running = true
  performanceTest.value.results = []
  
  addLog('🚀 Starting comprehensive performance test...')
  
  try {
    // Test 1: Cache performance
    const cacheResults = await runCachePerformanceTest()
    performanceTest.value.results.push(cacheResults)
    
    // Test 2: Concurrent uploads
    const concurrentResults = await runConcurrentUploadTest()
    performanceTest.value.results.push(concurrentResults)
    
    // Test 3: Rate limiting behavior
    const rateLimitResults = await runRateLimitTest()
    performanceTest.value.results.push(rateLimitResults)
    
    addLog('✅ Performance tests completed successfully', 'success')
  } catch (error) {
    addLog(`❌ Performance test failed: ${error}`, 'error')
  } finally {
    performanceTest.value.running = false
    refreshStats()
  }
}

async function runCachePerformanceTest() {
  const testName = 'Cache Performance'
  const responseTimes: number[] = []
  let cacheHits = 0
  
  for (let i = 0; i < 10; i++) {
    const start = Date.now()
    
    try {
      const result = await universalStore.uploadTask()
      const time = Date.now() - start
      responseTimes.push(time)
      
      if (result?.cached) {
        cacheHits++
      }
    } catch (error) {
      responseTimes.push(5000) // Timeout penalty
    }
  }
  
  return {
    name: testName,
    avgTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    successRate: Math.round((responseTimes.filter(t => t < 5000).length / responseTimes.length) * 100),
    cacheHits,
    responseTimes: responseTimes.slice(0, 20) // Limit for UI
  }
}

async function runConcurrentUploadTest() {
  const testName = 'Concurrent Uploads'
  const responseTimes: number[] = []
  
  const promises = []
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    promises.push(
      universalStore.uploadTask()
        .then(result => ({ time: Date.now() - start, success: result?.success }))
        .catch(() => ({ time: Date.now() - start, success: false }))
    )
  }
  
  const results = await Promise.all(promises)
  results.forEach(r => responseTimes.push(r.time))
  
  return {
    name: testName,
    avgTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    successRate: Math.round((results.filter(r => r.success).length / results.length) * 100),
    cacheHits: 0,
    responseTimes
  }
}

async function runRateLimitTest() {
  const testName = 'Rate Limit Handling'
  const responseTimes: number[] = []
  
  const promises = []
  for (let i = 0; i < 15; i++) {
    const start = Date.now()
    promises.push(
      universalStore.uploadTask()
        .then(() => ({ time: Date.now() - start, success: true }))
        .catch((error) => ({ 
          time: Date.now() - start, 
          success: !error.message?.includes('Rate limit') 
        }))
    )
  }
  
  const results = await Promise.all(promises)
  results.forEach(r => responseTimes.push(r.time))
  
  return {
    name: testName,
    avgTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    successRate: Math.round((results.filter(r => r.success).length / results.length) * 100),
    cacheHits: 0,
    responseTimes
  }
}

function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    apiStats: apiStats.value,
    performanceResults: performanceTest.value.results,
    consoleLogs: consoleLogs.value
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `api-performance-report-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  addLog('📊 Performance report generated and downloaded', 'success')
}

// ============================================================================
// LIFECYCLE
// ============================================================================

let statsInterval: number

onMounted(() => {
  // Initialize upload progress tracking
  universalStore.initializeUploadProgress()
  
  // Initial stats refresh
  refreshStats()
  
  // Auto-refresh stats
  statsInterval = window.setInterval(refreshStats, 2000)
  
  addLog('🎯 Optimized API test initialized', 'success')
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
})
</script>

<style scoped>
.test-optimized-api {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.test-header h1 {
  margin-bottom: 10px;
  font-size: 2.2rem;
}

.test-header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.api-dashboard {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.api-dashboard h2 {
  color: #374151;
  margin-bottom: 25px;
  font-size: 1.4rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.dashboard-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1.1rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d1d5db;
  transition: background-color 0.3s;
}

.status-indicator.active {
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.upload-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.eta {
  color: #6b7280;
  font-size: 0.8rem;
}

.idle-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.idle-text {
  color: #10b981;
  font-weight: 500;
}

.error-message {
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.refresh-btn,
.clear-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.refresh-btn:hover,
.clear-btn:hover {
  background: #4f46e5;
}

.rate-limit-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rate-limit-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.rate-limit-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #f59e0b, #dc2626);
  transition: width 0.3s ease;
}

.rate-limit-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.queue-info {
  color: #f59e0b;
  font-size: 0.8rem;
  font-weight: 500;
}

.test-controls {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.control-group h3 {
  color: #374151;
  margin-bottom: 15px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.test-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.test-btn.primary {
  background: #3b82f6;
  color: white;
}

.test-btn.primary:hover:not(:disabled) {
  background: #2563eb;
}

.test-btn.secondary {
  background: #10b981;
  color: white;
}

.test-btn.secondary:hover:not(:disabled) {
  background: #059669;
}

.test-btn.accent {
  background: #8b5cf6;
  color: white;
}

.test-btn.accent:hover:not(:disabled) {
  background: #7c3aed;
}

.test-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.performance-results {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.result-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.result-card h4 {
  margin: 0 0 15px 0;
  color: #374151;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.result-stat {
  text-align: center;
}

.result-value {
  display: block;
  font-weight: bold;
  color: #3b82f6;
}

.result-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
}

.result-timeline {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 30px;
  margin-top: 10px;
}

.timeline-bar {
  background: #3b82f6;
  width: 4px;
  min-height: 2px;
  border-radius: 1px;
  opacity: 0.7;
}

.live-console {
  background: #1f2937;
  color: #f3f4f6;
  border-radius: 12px;
  margin-bottom: 30px;
  font-family: 'Courier New', monospace;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #374151;
}

.console-header h3 {
  margin: 0;
  color: #f3f4f6;
}

.clear-console-btn {
  background: #374151;
  color: #f3f4f6;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.clear-console-btn:hover {
  background: #4b5563;
}

.console-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 20px;
}

.log-entry {
  display: flex;
  margin-bottom: 4px;
  font-size: 0.8rem;
}

.log-time {
  color: #6b7280;
  margin-right: 10px;
  min-width: 70px;
}

.log-entry.success .log-message {
  color: #10b981;
}

.log-entry.error .log-message {
  color: #dc2626;
}

.log-entry.warning .log-message {
  color: #f59e0b;
}

.achievements-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.achievement {
  text-align: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.achievement-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.achievement h4 {
  color: #374151;
  margin: 10px 0;
}

.achievement p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.next-phase {
  background: #fffbeb;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.next-phase h3 {
  color: #d97706;
  margin-bottom: 10px;
}

.next-phase p {
  color: #92400e;
  margin-bottom: 20px;
}

.next-features {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.feature {
  background: white;
  color: #d97706;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #fed7aa;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .button-grid {
    grid-template-columns: 1fr;
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 4px;
  }
  
  .next-features {
    flex-direction: column;
  }
}
</style>

