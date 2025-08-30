<template>
  <Toast position="bottom-right" group="upload-progress" :life="0" @close="handleClose">
    <template #container>
      <section class="flex flex-col p-4 gap-4 w-full bg-primary/90 rounded-xl backdrop-blur-lg">
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
        
        <div v-if="progress.title" class="text-sm text-white/80 truncate" :title="progress.title">
          {{ progress.title }}
        </div>
        
        <div v-if="isCompleted" class="flex gap-2 justify-end">
          <Button 
            label="Скрыть" 
            size="small" 
            severity="secondary"
            @click="handleClose"
          />
        </div>
      </section>
    </template>
  </Toast>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
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
  return progress.type === 'sector' ? 'pi pi-cloud-upload' : progress.type === 'bonus' ? 'pi pi-star' : 'pi pi-spinner pi-spin'
})

const progressTitle = computed(() => {
  if (isCompleted.value) {
    return 'Заливка завершена'
  }
  return progress.type === 'sector' ? 'Заливка секторов' : progress.type === 'bonus' ? 'Заливка бонусов' : 'Заливка'
})

const handleClose = () => {
  progress.close()
  toast.removeGroup('upload-progress')
}

// Отслеживаем видимость прогресса и показываем/скрываем toast
watch(() => progress.visible, (visible) => {
  if (visible) {
    toast.add({
      severity: 'info',
      summary: 'Заливка началась',
      group: 'upload-progress',
      life: 0 // не исчезает автоматически
    })
  } else {
    toast.removeGroup('upload-progress')
  }
}, { immediate: true })

// Отслеживаем завершение и показываем success toast
watch(() => [progress.current, progress.total], ([current, total]) => {
  if (current >= total && total > 0 && progress.visible) {
    // Через небольшую задержку показываем success уведомление
    setTimeout(() => {
      toast.add({
        severity: 'success',
        summary: 'Заливка завершена',
        detail: `Обработано ${total} элементов`,
        life: 5000
      })
    }, 1000)
  }
}, { immediate: true })
</script>


