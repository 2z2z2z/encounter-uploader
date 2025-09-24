import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isTestUrlMode } from '../utils/testMode'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    // Настройки отображения прогресса
    const showProgressEstimatedTime = ref(true)
    const showProgressTotalTime = ref(true)
    const showProgressPauseButton = ref(true)
    const progressPosition = ref<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right')
    const progressAnimations = ref(true)

    return {
      showProgressEstimatedTime,
      showProgressTotalTime,
      showProgressPauseButton,
      progressPosition,
      progressAnimations,
    }
  },
  {
    ...(isTestUrlMode() ? {} : {
      persist: {
        pick: [
          'showProgressEstimatedTime',
          'showProgressTotalTime',
          'showProgressPauseButton',
          'progressPosition',
          'progressAnimations',
        ]
      }
    })
  }
)