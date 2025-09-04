<template>
  <Toast position="bottom-right" group="upload-progress" :life="0" @close="handleClose">
    <template #container>
      <section class="flex flex-col p-4 gap-4 w-full bg-primary/70 rounded-xl">
        <div class="flex items-center gap-3">
          <i 
            :class="progressIcon" 
            class="text-white text-xl"
          ></i>
          <span class="font-bold text-base text-white">
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
              {{ progress.current }} / {{ progress.total }}
            </label>
            <label class="text-sm font-bold text-white">
              {{ progress.percent.toFixed(0) }}%
            </label>
          </div>
        </div>
        
        <div v-if="progress.title && !isCompleted" class="text-sm text-white/80 truncate" :title="progress.title">
          {{ progress.title }}
        </div>
        
        <div v-if="isCompleted && progress.completedAt" class="text-sm text-white/80">
          Завершено в {{ formatTime(progress.completedAt) }}
        </div>
        
        <div v-if="!isCompleted && estimatedEndTime" class="text-xs text-white/60">
          Прогноз окончания: {{ estimatedEndTime }}
        </div>
        
        <div v-if="isCompleted" class="flex gap-2 justify-end">
          <Button 
            label="Закрыть" 
            size="small" 
            @click="handleClose"
          />
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

const progress = useProgressStore()
const toast = useToast()

const isCompleted = computed(() => {
  return progress.current >= progress.total && progress.total > 0
})

const progressIcon = computed(() => {
  if (isCompleted.value) {
    return 'pi pi-check-circle'
  }
  return progress.type === 'sector' ? 'pi pi-cloud-upload' : progress.type === 'bonus' ? 'pi pi-star' : progress.type === 'task' ? 'pi pi-file' : 'pi pi-spinner pi-spin'
})

const progressTitle = computed(() => {
  if (isCompleted.value) {
    return 'Заливка завершена'
  }
  return progress.type === 'sector' ? 'Заливка секторов' : progress.type === 'bonus' ? 'Заливка бонусов' : progress.type === 'task' ? 'Заливка задания' : 'Заливка'
})

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}м ${secs}с`
  }
  return `${secs}с`
}

const estimatedEndTime = ref<string | null>(null)

const calculateEstimatedEndTime = () => {
  if (!progress.startedAt || progress.total === 0) {
    estimatedEndTime.value = null
    return
  }
  
  // Используем фиксированную задержку: 500мс на элемент (базовая задержка в коде)
  const estimatedDurationMs = progress.total * 500
  const endTime = new Date(progress.startedAt.getTime() + estimatedDurationMs)
  
  estimatedEndTime.value = formatTime(endTime)
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


