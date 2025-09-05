import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProgressStore = defineStore('uploadProgress', () => {
  const visible = ref(false)
  const total = ref(0)
  const current = ref(0)
  const title = ref('')
  const type = ref<'sector' | 'bonus' | 'task' | ''>('')
  const completedAt = ref<Date | null>(null)
  const startedAt = ref<Date | null>(null)
  const isPaused = ref(false)
  
  // Новые поля для контроля паузы
  const pauseRequested = ref(false)
  let resumeResolver: (() => void) | null = null
  
  // Поля для отслеживания ошибок
  const hasErrors = ref(false)
  const errorCount = ref(0)
  const successCount = ref(0)
  const errors = ref<string[]>([])

  function start(t: 'sector' | 'bonus' | 'task', count: number) {
    type.value = t
    total.value = count
    current.value = 0
    title.value = ''
    visible.value = true
    completedAt.value = null
    startedAt.value = new Date()
    isPaused.value = false
    pauseRequested.value = false
    resumeResolver = null
    
    // Сброс состояния ошибок
    hasErrors.value = false
    errorCount.value = 0
    successCount.value = 0
    errors.value = []
  }

  function updateSuccess(name: string) {
    current.value += 1
    title.value = name
    successCount.value += 1
  }
  
  function updateTitle(name: string) {
    title.value = name
  }

  function finish() {
    title.value = 'Готово'
    completedAt.value = new Date()
  }

  function close() {
    visible.value = false
    isPaused.value = false
    pauseRequested.value = false
    if (resumeResolver) {
      resumeResolver()
      resumeResolver = null
    }
  }
  
  function pause() {
    isPaused.value = true
    pauseRequested.value = true
    title.value = 'На паузе'
  }
  
  function resume() {
    isPaused.value = false
    pauseRequested.value = false
    title.value = ''
    if (resumeResolver) {
      resumeResolver()
      resumeResolver = null
    }
  }
  
  // Новая функция для ожидания возобновления
  function waitForResume(): Promise<void> {
    if (!pauseRequested.value) {
      return Promise.resolve()
    }
    
    return new Promise<void>((resolve) => {
      resumeResolver = resolve
    })
  }
  
  // Методы для работы с ошибками
  function reportError(error: string) {
    hasErrors.value = true
    errorCount.value += 1
    errors.value.push(error)
    current.value += 1 // Увеличиваем прогресс при ошибке
  }
  
  function clearErrors() {
    hasErrors.value = false
    errorCount.value = 0
    errors.value = []
  }

  const percent = computed(() => {
    return total.value === 0 ? 0 : Math.min((current.value / total.value) * 100, 100)
  })

  return { 
    visible, total, current, title, type, percent, completedAt, startedAt, isPaused, pauseRequested,
    hasErrors, errorCount, successCount, errors,
    start, updateSuccess, updateTitle, finish, close, pause, resume, waitForResume, reportError, clearErrors
  }
})
