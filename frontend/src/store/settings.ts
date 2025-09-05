import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isTestUrlMode, logTestModeState } from '../utils/testMode'

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
    persist: {
      pick: [
        'showProgressEstimatedTime',
        'showProgressTotalTime',
        'showProgressPauseButton',
        'progressPosition',
        'progressAnimations',
      ],
      beforeRestore: (ctx) => {
        // Проверяем тестовый URL режим перед восстановлением
        if (isTestUrlMode()) {
          logTestModeState('SettingsStore beforeRestore - блокирована загрузка из localStorage')
          // В тестовом режиме не восстанавливаем из localStorage
          return false
        }
        return true
      }
    },
  }
)