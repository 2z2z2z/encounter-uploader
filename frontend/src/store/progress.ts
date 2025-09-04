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

  function start(t: 'sector' | 'bonus' | 'task', count: number) {
    type.value = t
    total.value = count
    current.value = 0
    title.value = ''
    visible.value = true
    completedAt.value = null
    startedAt.value = new Date()
    isPaused.value = false
  }

  function update(name: string) {
    current.value += 1
    title.value = name
  }

  function finish() {
    title.value = 'Готово'
    completedAt.value = new Date()
  }

  function close() {
    visible.value = false
    isPaused.value = false
  }
  
  function pause() {
    isPaused.value = true
    title.value = 'На паузе'
  }
  
  function resume() {
    isPaused.value = false
    title.value = ''
  }

  const percent = computed(() => {
    return total.value === 0 ? 0 : Math.min((current.value / total.value) * 100, 100)
  })

  return { visible, total, current, title, type, percent, completedAt, startedAt, isPaused, start, update, finish, close, pause, resume }
})
