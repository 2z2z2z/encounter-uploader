<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">
          {{ isCompleted ? 'Загрузка завершена' : 'Загрузка данных' }}
        </h2>
        <button 
          v-if="isCompleted || canCancel" 
          @click="handleClose" 
          class="modal-close"
        >
          ❌
        </button>
      </div>
      
      <div class="modal-body">
        <!-- Main Progress -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-title">{{ currentOperation || 'Загрузка...' }}</span>
            <span class="progress-text">
              {{ current }} из {{ total }} 
              <span v-if="percentage !== null">({{ percentage }}%)</span>
            </span>
          </div>
          
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressWidth }"
              :class="{
                'progress-success': isCompleted,
                'progress-error': hasError,
                'progress-active': isActive
              }"
            ></div>
          </div>
        </div>
        
        <!-- Time Info -->
        <div v-if="timeInfo" class="time-info">
          <div class="time-item">
            <span class="time-label">Прошло:</span>
            <span class="time-value">{{ formatTime(timeInfo.elapsed) }}</span>
          </div>
          <div v-if="timeInfo.remaining && !isCompleted" class="time-item">
            <span class="time-label">Осталось:</span>
            <span class="time-value">{{ formatTime(timeInfo.remaining) }}</span>
          </div>
          <div class="time-item">
            <span class="time-label">Скорость:</span>
            <span class="time-value">{{ timeInfo.speed }}/сек</span>
          </div>
        </div>
        
        <!-- Current Item -->
        <div v-if="currentItem" class="current-item">
          <h4 class="item-title">Текущий элемент:</h4>
          <div class="item-details">
            <div class="item-field">
              <strong>№:</strong> {{ currentItem.number || currentItem.id }}
            </div>
            <div v-if="currentItem.name" class="item-field">
              <strong>Название:</strong> {{ currentItem.name }}
            </div>
            <div v-if="currentItem.variants" class="item-field">
              <strong>Варианты:</strong> {{ Array.isArray(currentItem.variants) ? currentItem.variants.join(', ') : currentItem.variants }}
            </div>
          </div>
        </div>
        
        <!-- Results Summary -->
        <div v-if="results && results.length > 0" class="results-section">
          <h4 class="results-title">Результаты загрузки:</h4>
          
          <div class="results-stats">
            <div class="stat-item stat-success">
              <span class="stat-number">{{ successCount }}</span>
              <span class="stat-label">Успешно</span>
            </div>
            <div class="stat-item stat-error">
              <span class="stat-number">{{ errorCount }}</span>
              <span class="stat-label">Ошибки</span>
            </div>
            <div class="stat-item stat-warning">
              <span class="stat-number">{{ warningCount }}</span>
              <span class="stat-label">Предупреждения</span>
            </div>
          </div>
          
          <!-- Error Details -->
          <div v-if="errorResults.length > 0" class="error-details">
            <h5 class="error-title">Ошибки:</h5>
            <div class="error-list">
              <div 
                v-for="(error, index) in errorResults.slice(0, 5)" 
                :key="index"
                class="error-item"
              >
                <span class="error-number">{{ error.index || index + 1 }}</span>
                <span class="error-message">{{ error.message || error.error || 'Неизвестная ошибка' }}</span>
              </div>
            </div>
            <div v-if="errorResults.length > 5" class="error-more">
              ... и еще {{ errorResults.length - 5 }} ошибок
            </div>
          </div>
        </div>
        
        <!-- Action Buttons in Progress -->
        <div v-if="!isCompleted" class="action-buttons">
          <button 
            v-if="canPause && !isPaused"
            @click="handlePause"
            class="btn btn-warning"
            :disabled="!isActive"
          >
            ⏸️ Пауза
          </button>
          
          <button 
            v-if="canPause && isPaused"
            @click="handleResume"
            class="btn btn-primary"
          >
            ▶️ Продолжить
          </button>
          
          <button 
            v-if="canCancel"
            @click="handleCancel"
            class="btn btn-danger"
          >
            ⏹️ Отменить
          </button>
        </div>
      </div>
      
      <div v-if="isCompleted" class="modal-footer">
        <button @click="handleClose" class="btn btn-primary">
          ✅ Готово
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ProgressItem {
  id?: string | number
  number?: number
  name?: string
  variants?: string[] | string
  [key: string]: any
}

interface ProgressResult {
  index?: number
  success: boolean
  error?: string
  message?: string
  warning?: string
  [key: string]: any
}

interface TimeInfo {
  elapsed: number // seconds
  remaining?: number // seconds
  speed: number // items per second
}

interface Props {
  show?: boolean
  current?: number
  total?: number
  currentOperation?: string
  currentItem?: ProgressItem
  results?: ProgressResult[]
  timeInfo?: TimeInfo
  
  // Control flags
  canPause?: boolean
  canCancel?: boolean
  isPaused?: boolean
  isCompleted?: boolean
  hasError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  current: 0,
  total: 0,
  canPause: true,
  canCancel: true,
  isPaused: false,
  isCompleted: false,
  hasError: false
})

const emit = defineEmits<{
  'close': []
  'pause': []
  'resume': []
  'cancel': []
}>()

// Computed properties
const percentage = computed(() => {
  if (props.total === 0) return null
  return Math.round((props.current / props.total) * 100)
})

const progressWidth = computed(() => {
  if (props.total === 0) return '0%'
  const percent = Math.min((props.current / props.total) * 100, 100)
  return `${percent}%`
})

const isActive = computed(() => {
  return !props.isPaused && !props.isCompleted && !props.hasError
})

const successCount = computed(() => {
  return props.results?.filter(r => r.success).length || 0
})

const errorCount = computed(() => {
  return props.results?.filter(r => !r.success && r.error).length || 0
})

const warningCount = computed(() => {
  return props.results?.filter(r => r.success && r.warning).length || 0
})

const errorResults = computed(() => {
  return props.results?.filter(r => !r.success && r.error) || []
})

// Methods
function handleClose() {
  emit('close')
}

function handlePause() {
  emit('pause')
}

function handleResume() {
  emit('resume')
}

function handleCancel() {
  if (confirm('Вы уверены, что хотите отменить загрузку?')) {
    emit('cancel')
  }
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}с`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}м ${secs}с`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}ч ${mins}м`
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-title {
  font-weight: 600;
  color: #1f2937;
}

.progress-text {
  color: #6b7280;
  font-size: 0.875rem;
}

.progress-bar {
  height: 1rem;
  background: #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 0.5rem;
  transition: width 0.3s ease;
  position: relative;
}

.progress-active {
  animation: progress-pulse 1.5s ease-in-out infinite;
}

.progress-success {
  background: #10b981 !important;
}

.progress-error {
  background: #ef4444 !important;
}

@keyframes progress-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.time-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.time-item {
  text-align: center;
}

.time-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.time-value {
  display: block;
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}

.current-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fefefe;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.item-details {
  display: grid;
  gap: 0.5rem;
}

.item-field {
  font-size: 0.875rem;
  color: #4b5563;
}

.results-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.results-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.results-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  border-radius: 0.5rem;
}

.stat-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.stat-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.stat-warning {
  background: #fffbeb;
  border: 1px solid #fed7aa;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-success .stat-number { color: #059669; }
.stat-error .stat-number { color: #dc2626; }
.stat-warning .stat-number { color: #d97706; }

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
}

.error-details {
  margin-top: 1rem;
}

.error-title {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.75rem;
}

.error-list {
  display: grid;
  gap: 0.5rem;
}

.error-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  align-items: flex-start;
}

.error-number {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.error-message {
  flex: 1;
  color: #991b1b;
  font-size: 0.875rem;
}

.error-more {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  margin-top: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: center;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .time-info {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .results-stats {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>

