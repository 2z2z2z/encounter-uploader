<!--
  UploadControlPanel - UI для управления загрузкой (пауза/отмена/продолжение)
  Реализация согласно плану рефакторинга (Фаза 5.3)
-->

<template>
  <div class="upload-control-panel" v-if="currentSession">
    <!-- Заголовок сессии -->
    <div class="session-header">
      <div class="session-info">
        <h3 class="session-name">{{ currentSession.name }}</h3>
        <div class="session-meta">
          <span class="session-status" :class="sessionStatusClass">
            {{ sessionStatusText }}
          </span>
          <span class="session-time" v-if="sessionDuration">
            {{ formatDuration(sessionDuration) }}
          </span>
        </div>
      </div>
      
      <div class="session-controls">
        <button 
          v-if="canPause" 
          @click="controller.pause()"
          class="control-button pause"
          :disabled="isPaused"
        >
          ⏸️ Пауза
        </button>
        
        <button 
          v-if="canResume" 
          @click="controller.resume()"
          class="control-button resume"
          :disabled="!isPaused"
        >
          ▶️ Продолжить
        </button>
        
        <button 
          v-if="canCancel" 
          @click="handleCancel"
          class="control-button cancel"
        >
          ❌ Отменить
        </button>
        
        <button 
          v-if="canRetry && failedTasks.length > 0" 
          @click="controller.retry()"
          class="control-button retry"
        >
          🔄 Повторить ({{ failedTasks.length }})
        </button>
      </div>
    </div>
    
    <!-- Общий прогресс -->
    <div class="overall-progress">
      <div class="progress-header">
        <span class="progress-text">
          Общий прогресс: {{ overallProgress }}%
        </span>
        <span class="progress-details">
          {{ statistics.completedTasks }} из {{ statistics.totalTasks }} задач
        </span>
      </div>
      
      <div class="progress-bar-container">
        <div 
          class="progress-bar" 
          :style="{ width: `${overallProgress}%` }"
          :class="progressBarClass"
        ></div>
      </div>
      
      <div class="progress-stats">
        <div class="stat-item">
          <span class="stat-label">ETA:</span>
          <span class="stat-value">{{ formatETA(statistics.eta) }}</span>
        </div>
        <div class="stat-item" v-if="statistics.speed > 0">
          <span class="stat-label">Скорость:</span>
          <span class="stat-value">{{ formatSpeed(statistics.speed) }}</span>
        </div>
        <div class="stat-item" v-if="statistics.errorRate > 0">
          <span class="stat-label">Ошибки:</span>
          <span class="stat-value error">{{ statistics.errorRate }}%</span>
        </div>
      </div>
    </div>
    
    <!-- Список активных задач -->
    <div class="active-tasks" v-if="activeTasks.length > 0">
      <h4 class="tasks-title">Активные задачи ({{ activeTasks.length }})</h4>
      <div class="tasks-list">
        <div 
          v-for="task in activeTasks" 
          :key="task.id"
          class="task-item active"
        >
          <div class="task-info">
            <span class="task-name">{{ task.name }}</span>
            <span class="task-type">{{ getTaskTypeLabel(task.type) }}</span>
          </div>
          
          <div class="task-progress">
            <div class="progress-bar-small">
              <div 
                class="progress-fill" 
                :style="{ width: `${task.progress}%` }"
              ></div>
            </div>
            <span class="progress-text-small">{{ task.progress }}%</span>
          </div>
          
          <div class="task-actions">
            <button 
              @click="controller.skip(task.id)"
              class="task-action skip"
              title="Пропустить задачу"
            >
              ⏭️
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Очередь задач -->
    <div class="task-queue" v-if="remainingTasks.length > 0">
      <details :open="remainingTasks.length <= 5">
        <summary class="queue-summary">
          Очередь задач ({{ remainingTasks.length }})
        </summary>
        <div class="tasks-list">
          <div 
            v-for="task in remainingTasks.slice(0, 10)" 
            :key="task.id"
            class="task-item queued"
            :class="{ paused: task.status === 'paused' }"
          >
            <div class="task-info">
              <span class="task-name">{{ task.name }}</span>
              <span class="task-type">{{ getTaskTypeLabel(task.type) }}</span>
            </div>
            
            <div class="task-status">
              <span class="status-badge" :class="task.status">
                {{ getTaskStatusText(task.status) }}
              </span>
              <span v-if="task.retryCount > 0" class="retry-count">
                (попытка {{ task.retryCount + 1 }}/{{ task.maxRetries + 1 }})
              </span>
            </div>
            
            <div class="task-actions">
              <button 
                @click="controller.skip(task.id)"
                class="task-action skip"
                title="Пропустить задачу"
              >
                ⏭️
              </button>
            </div>
          </div>
          
          <div v-if="remainingTasks.length > 10" class="tasks-more">
            ... и еще {{ remainingTasks.length - 10 }} задач
          </div>
        </div>
      </details>
    </div>
    
    <!-- Завершенные задачи -->
    <div class="completed-tasks" v-if="completedTasks.length > 0">
      <details>
        <summary class="completed-summary">
          ✅ Завершенные задачи ({{ completedTasks.length }})
        </summary>
        <div class="tasks-list compact">
          <div 
            v-for="task in completedTasks.slice(-5)" 
            :key="task.id"
            class="task-item completed"
          >
            <span class="task-name">{{ task.name }}</span>
            <span class="task-duration" v-if="task.startTime && task.endTime">
              {{ formatDuration(task.endTime - task.startTime) }}
            </span>
          </div>
        </div>
      </details>
    </div>
    
    <!-- Неудачные задачи -->
    <div class="failed-tasks" v-if="failedTasks.length > 0">
      <details open>
        <summary class="failed-summary">
          ❌ Неудачные задачи ({{ failedTasks.length }})
        </summary>
        <div class="tasks-list">
          <div 
            v-for="task in failedTasks" 
            :key="task.id"
            class="task-item failed"
          >
            <div class="task-info">
              <span class="task-name">{{ task.name }}</span>
              <span class="task-error">{{ task.error }}</span>
            </div>
            
            <div class="task-actions">
              <button 
                @click="retryTask(task)"
                class="task-action retry"
                title="Повторить задачу"
              >
                🔄
              </button>
              <button 
                @click="removeFailedTask(task)"
                class="task-action remove"
                title="Удалить из списка"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
    
    <!-- Сводка сессии -->
    <div class="session-summary" v-if="isCompleted || isCancelled">
      <h4 class="summary-title">Сводка сессии</h4>
      <div class="summary-stats">
        <div class="summary-item">
          <span class="summary-label">Статус:</span>
          <span class="summary-value" :class="sessionStatusClass">
            {{ sessionStatusText }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Общее время:</span>
          <span class="summary-value">{{ formatDuration(sessionDuration || 0) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Выполнено:</span>
          <span class="summary-value">{{ completedTasks.length }} задач</span>
        </div>
        <div class="summary-item" v-if="failedTasks.length > 0">
          <span class="summary-label">Неудачи:</span>
          <span class="summary-value error">{{ failedTasks.length }} задач</span>
        </div>
        <div class="summary-item" v-if="statistics.skippedTasks > 0">
          <span class="summary-label">Пропущено:</span>
          <span class="summary-value">{{ statistics.skippedTasks }} задач</span>
        </div>
      </div>
      
      <div class="summary-actions">
        <button @click="resetSession" class="summary-action reset">
          🔄 Новая сессия
        </button>
        <button @click="exportReport" class="summary-action export">
          📊 Экспорт отчета
        </button>
      </div>
    </div>
  </div>
  
  <!-- Placeholder когда нет активной сессии -->
  <div v-else class="no-session">
    <div class="no-session-content">
      <div class="no-session-icon">📤</div>
      <h3 class="no-session-title">Нет активной сессии загрузки</h3>
      <p class="no-session-text">
        Сессия загрузки появится здесь после начала отправки данных на сервер.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUploadControl } from '../../composables/useUploadControl'

// ============================================================================
// COMPOSABLES
// ============================================================================

const {
  currentSession,
  uploadQueue,
  completedTasks,
  failedTasks,
  
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
  
  statistics,
  
  controller,
  getSessionSummary,
  resetSession
} = useUploadControl()

// ============================================================================
// COMPUTED
// ============================================================================

const sessionStatusClass = computed(() => {
  if (!currentSession.value) return ''
  
  const status = currentSession.value.status
  return {
    'status-running': status === 'running',
    'status-paused': status === 'paused',
    'status-cancelled': status === 'cancelled',
    'status-completed': status === 'completed',
    'status-error': status === 'error'
  }
})

const sessionStatusText = computed(() => {
  if (!currentSession.value) return ''
  
  const statusMap = {
    idle: 'Ожидание',
    running: 'Выполняется',
    paused: 'Приостановлено',
    cancelled: 'Отменено',
    completed: 'Завершено',
    error: 'Ошибка'
  }
  
  return statusMap[currentSession.value.status] || currentSession.value.status
})

const sessionDuration = computed(() => {
  if (!currentSession.value?.startTime) return 0
  
  const endTime = currentSession.value.endTime || Date.now()
  return endTime - currentSession.value.startTime
})

const progressBarClass = computed(() => ({
  'progress-running': isUploading.value,
  'progress-paused': isPaused.value,
  'progress-completed': isCompleted.value,
  'progress-error': currentSession.value?.status === 'error'
}))

// ============================================================================
// МЕТОДЫ
// ============================================================================

function handleCancel() {
  if (confirm('Вы уверены, что хотите отменить загрузку?')) {
    controller.value.cancel()
  }
}

function retryTask(task: any) {
  // Возвращаем задачу в очередь
  task.status = 'idle'
  task.progress = 0
  task.retryCount = 0
  task.error = undefined
  task.startTime = undefined
  task.endTime = undefined
  
  uploadQueue.value.push(task)
  
  const index = failedTasks.value.indexOf(task)
  if (index >= 0) {
    failedTasks.value.splice(index, 1)
    statistics.failedTasks--
  }
}

function removeFailedTask(task: any) {
  const index = failedTasks.value.indexOf(task)
  if (index >= 0) {
    failedTasks.value.splice(index, 1)
    statistics.failedTasks--
  }
}

function getTaskTypeLabel(type: string): string {
  const typeMap = {
    task: 'Задание',
    sector: 'Сектор',
    bonus: 'Бонус'
  }
  return typeMap[type] || type
}

function getTaskStatusText(status: string): string {
  const statusMap = {
    idle: 'Ожидание',
    running: 'Выполняется',
    paused: 'Пауза',
    cancelled: 'Отменено',
    completed: 'Готово',
    error: 'Ошибка'
  }
  return statusMap[status] || status
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}ч ${minutes % 60}м ${seconds % 60}с`
  } else if (minutes > 0) {
    return `${minutes}м ${seconds % 60}с`
  } else {
    return `${seconds}с`
  }
}

function formatETA(seconds: number): string {
  if (!seconds || seconds <= 0) return 'неизвестно'
  return formatDuration(seconds * 1000)
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond} B/s`
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }
}

function exportReport() {
  const summary = getSessionSummary()
  const report = {
    ...summary,
    detailedTasks: {
      completed: completedTasks.value,
      failed: failedTasks.value
    },
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `upload-report-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.upload-control-panel {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

/* Session Header */
.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.session-info {
  flex: 1;
}

.session-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.session-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.session-status {
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.session-status.status-running { background: #dbeafe; color: #1e40af; }
.session-status.status-paused { background: #fef3c7; color: #92400e; }
.session-status.status-cancelled { background: #fee2e2; color: #991b1b; }
.session-status.status-completed { background: #d1fae5; color: #065f46; }
.session-status.status-error { background: #fee2e2; color: #991b1b; }

.session-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.control-button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.control-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button.pause { border-color: #fbbf24; color: #92400e; }
.control-button.resume { border-color: #10b981; color: #047857; }
.control-button.cancel { border-color: #f87171; color: #dc2626; }
.control-button.retry { border-color: #6366f1; color: #4f46e5; }

/* Overall Progress */
.overall-progress {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-text {
  font-weight: 600;
  color: #1f2937;
}

.progress-details {
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-bar-container {
  width: 100%;
  height: 0.75rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 0.375rem;
}

.progress-bar.progress-running { background: #3b82f6; }
.progress-bar.progress-paused { background: #f59e0b; }
.progress-bar.progress-completed { background: #10b981; }
.progress-bar.progress-error { background: #ef4444; }

.progress-stats {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
}

.stat-item {
  display: flex;
  gap: 0.25rem;
}

.stat-label {
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  color: #1f2937;
  font-weight: 600;
}

.stat-value.error {
  color: #dc2626;
}

/* Tasks */
.tasks-title, .queue-summary, .completed-summary, .failed-summary {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  cursor: pointer;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tasks-list.compact .task-item {
  padding: 0.5rem;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.task-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.task-item.queued {
  background: #f9fafb;
}

.task-item.paused {
  border-color: #f59e0b;
  background: #fffbeb;
}

.task-item.completed {
  border-color: #10b981;
  background: #ecfdf5;
}

.task-item.failed {
  border-color: #ef4444;
  background: #fef2f2;
}

.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-name {
  font-weight: 500;
  color: #1f2937;
}

.task-type {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.task-error {
  font-size: 0.75rem;
  color: #dc2626;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar-small {
  width: 4rem;
  height: 0.25rem;
  background: #e5e7eb;
  border-radius: 0.125rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-text-small {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  min-width: 2rem;
  text-align: right;
}

.task-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.idle { background: #f3f4f6; color: #6b7280; }
.status-badge.running { background: #dbeafe; color: #1e40af; }
.status-badge.paused { background: #fef3c7; color: #92400e; }

.retry-count {
  font-size: 0.625rem;
  color: #6b7280;
}

.task-actions {
  display: flex;
  gap: 0.25rem;
}

.task-action {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.task-action:hover {
  background: #f9fafb;
}

.task-action.skip { border-color: #f59e0b; }
.task-action.retry { border-color: #10b981; }
.task-action.remove { border-color: #ef4444; }

.tasks-more {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

/* Session Summary */
.session-summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.summary-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}

.summary-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.summary-action {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.summary-action:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* No Session */
.no-session {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #f9fafb;
  border-radius: 0.75rem;
  border: 2px dashed #d1d5db;
}

.no-session-content {
  text-align: center;
  max-width: 300px;
}

.no-session-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-session-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.no-session-text {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .session-controls {
    align-self: stretch;
  }
  
  .control-button {
    flex: 1;
    justify-content: center;
  }
  
  .progress-stats {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .task-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .task-progress, .task-status, .task-actions {
    align-self: stretch;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>

