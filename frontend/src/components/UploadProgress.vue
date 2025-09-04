<template>
  <Toast :position="settings.progressPosition" group="upload-progress" :life="0" @close="handleClose">
    <template #container>
      <section :class="[
        'flex flex-col p-4 gap-4 w-full bg-primary/70 rounded-xl',
        settings.progressAnimations ? 'transition-all duration-300 ease-in-out' : ''
      ]">
        <div class="flex items-center gap-3">
          <i 
            :class="progressIcon" 
            class="text-white text-xl transition-all duration-200 ease-in-out"
          ></i>
          <span class="font-bold text-base text-white transition-all duration-200 ease-in-out">
            {{ progressTitle }}
          </span>
        </div>
        
        <div class="flex flex-col gap-2">
          <ProgressBar 
            :value="progress.percent" 
            :showValue="false" 
            :style="{ height: '6px' }" 
            pt:value:class="!bg-primary-50" 
            class="!bg-primary/80"
          />
          <div class="flex justify-between items-center">
            <label class="text-sm font-medium text-white">
              {{ Math.max(0, progress.current) }} / {{ Math.max(0, progress.total) }}
            </label>
            <label class="text-sm font-bold text-white">
              {{ Math.round(Math.max(0, Math.min(100, progress.percent))) }}%
            </label>
          </div>
        </div>
        
        <Transition name="fade" mode="out-in">
          <div v-if="progress.title && !isCompleted" key="current" class="text-sm text-white/80 truncate" :title="progress.title">
            {{ progress.title }}
          </div>
          
          <div v-else-if="isCompleted && progress.completedAt" key="completed" class="text-md text-white/80">
            Завершено в {{ formatTime(progress.completedAt) }}
          </div>
        </Transition>
        
        <!-- Единый блок футера с текстом и кнопками -->
        <div class="flex items-center justify-between gap-4">
          <div class="text-xs text-white/80 flex-1">
            <span v-if="!isCompleted && estimatedEndTime && settings.showProgressEstimatedTime">
              Прогноз окончания: {{ estimatedEndTime }}
            </span>
            <span v-else-if="isCompleted && totalUploadTime && settings.showProgressTotalTime">
              Затрачено времени: {{ totalUploadTime }}
            </span>
          </div>
          
          <div class="flex gap-2">
            <Button 
              v-if="!isCompleted && settings.showProgressPauseButton"
              :label="progress.isPaused ? 'Возобновить' : 'Пауза'"
              :icon="progress.isPaused ? 'pi pi-play' : 'pi pi-pause'"
              size="small"
              severity="secondary"
              @click="togglePause"
            />
            <Button 
              v-if="isCompleted"
              label="Закрыть" 
              size="small" 
              @click="handleClose"
            />
          </div>
        </div>
      </section>
    </template>
  </Toast>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import Toast from 'primevue/toast'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useProgressStore } from '../store/progress'
import { useSettingsStore } from '../store/settings'

const progress = useProgressStore()
const settings = useSettingsStore()
const toast = useToast()

const isCompleted = computed(() => {
  // Защита от некорректных значений
  const currentValue = Math.max(0, progress.current)
  const totalValue = Math.max(0, progress.total)
  
  return currentValue >= totalValue && totalValue > 0
})

const progressIcon = computed(() => {
  if (isCompleted.value) {
    return 'pi pi-check-circle'
  }
  
  if (progress.isPaused) {
    return 'pi pi-pause-circle'
  }
  
  const iconMap = {
    'sector': 'pi pi-cloud-upload',
    'bonus': 'pi pi-star', 
    'task': 'pi pi-file'
  } as const
  
  return iconMap[progress.type as keyof typeof iconMap] || 'pi pi-spinner pi-spin'
})

const progressTitle = computed(() => {
  if (isCompleted.value) {
    return 'Заливка завершена'
  }
  
  if (progress.isPaused) {
    return 'Заливка приостановлена'
  }
  
  const titleMap = {
    'sector': 'Заливка секторов',
    'bonus': 'Заливка бонусов',
    'task': 'Заливка задания'
  } as const
  
  return titleMap[progress.type as keyof typeof titleMap] || 'Заливка'
})

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}м ${remainingSeconds}с`
  }
  return `${remainingSeconds}с`
}

const totalUploadTime = computed(() => {
  if (!progress.startedAt || !progress.completedAt) {
    return null
  }
  
  try {
    const startTime = progress.startedAt.getTime()
    const endTime = progress.completedAt.getTime()
    
    // Проверки на корректность времени
    if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) {
      return null
    }
    
    const duration = endTime - startTime
    
    // Проверка на разумные пределы (не более 24 часов)
    if (duration > 24 * 60 * 60 * 1000 || duration < 0) {
      return null
    }
    
    return formatDuration(duration)
  } catch (error) {
    console.warn('Error calculating total upload time:', error)
    return null
  }
})


const estimatedEndTime = ref<string | null>(null)

const calculateEstimatedEndTime = () => {
  if (!progress.startedAt || progress.total <= 0) {
    estimatedEndTime.value = null
    return
  }
  
  try {
    // Более точные задержки для разных типов заливки
    const delayMap = {
      'task': 1500,     // Задание - обычно одно, но сложнее
      'sector': 1200,   // Сектора - базовая задержка из uploader.ts
      'bonus': 1400     // Бонусы - чуть дольше из-за сложности данных
    } as const
    
    const delayMs = delayMap[progress.type as keyof typeof delayMap] || 1200
    const totalValue = Math.max(1, progress.total) // Минимум 1 для избежания деления на 0
    const estimatedDurationMs = totalValue * delayMs
    
    // Проверяем, что результат не слишком большой (защита от переполнения)
    if (estimatedDurationMs > 24 * 60 * 60 * 1000) { // Больше 24 часов
      estimatedEndTime.value = null
      return
    }
    
    const endTime = new Date(progress.startedAt.getTime() + estimatedDurationMs)
    
    // Проверяем корректность даты
    if (isNaN(endTime.getTime())) {
      estimatedEndTime.value = null
      return
    }
    
    estimatedEndTime.value = formatTime(endTime)
  } catch (error) {
    console.warn('Error calculating estimated end time:', error)
    estimatedEndTime.value = null
  }
}

const togglePause = () => {
  if (progress.isPaused) {
    progress.resume()
  } else {
    progress.pause()
  }
}

const handleClose = () => {
  progress.close()
  toast.removeGroup('upload-progress')
}

// Отслеживаем видимость прогресса и показываем/скрываем toast
watch(() => progress.visible, (visible) => {
  if (visible) {
    toast.add({
      styleClass: 'backdrop-blur-lg rounded-2xl',
      severity: 'custom',
      summary: 'Заливка началась',
      group: 'upload-progress',
      life: 0 // не исчезает автоматически
    })
    
    // Рассчитываем прогноз окончания один раз при старте
    calculateEstimatedEndTime()
  } else {
    toast.removeGroup('upload-progress')
    estimatedEndTime.value = null
  }
}, { immediate: true })

// Отслеживаем завершение и показываем success toast
watch(() => [progress.current, progress.total], ([current, total]) => {
  if (current >= total && total > 0 && progress.visible) {
    // Через небольшую задержку показываем success уведомление
    setTimeout(() => {
      const typeNames = {
        'task': 'Задание',
        'sector': 'Секторы', 
        'bonus': 'Бонусы'
      }
      
      const typeName = typeNames[progress.type as keyof typeof typeNames] || 'Элементы'
      
      toast.add({
        severity: 'success',
        summary: 'Заливка завершена!',
        detail: `Залито: ${typeName}\nКоличество элементов: ${total}`,
        life: 5000
      })
    }, 1000)
  }
}, { immediate: true })
</script>

<style scoped>
/* Fade анимация */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Slide-up анимация */
.slide-up-enter-active {
  transition: all 0.3s ease-out;
}
.slide-up-leave-active {
  transition: all 0.3s ease-in;
}
.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>

