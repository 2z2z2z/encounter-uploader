import { useRoute } from 'vue-router'
import { computed } from 'vue'

/**
 * Композабл для определения тестового URL режима
 * Тестовый URL режим активен для маршрутов вида /test/* и /v2/test/*
 * В этом режиме полностью отключается localStorage и используются только данные из .env
 */
export const useTestUrlMode = () => {
  const route = useRoute()

  const isTestUrlMode = computed(() => {
    return route.path.startsWith('/test/') || route.path.startsWith('/v2/test/')
  })

  return {
    isTestUrlMode
  }
}
