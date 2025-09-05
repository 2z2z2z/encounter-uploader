/**
 * Утилиты для определения тестового URL режима
 * Тестовый URL режим активен для маршрутов вида /test/*
 * В этом режиме полностью отключается localStorage и используются только данные из .env
 */

/**
 * Глобальная синхронная функция для определения тестового URL режима
 * Используется в persist.beforeRestore хуках где Vue Router может быть недоступен
 */
export function isTestUrlMode(): boolean {
  // Безопасная проверка window объекта для SSR совместимости
  if (typeof window === 'undefined') return false
  
  // Используем window.location.pathname который доступен всегда
  return window.location.pathname.startsWith('/test/')
}

/**
 * Отладочная функция для логирования состояния тестового режима
 */
export function logTestModeState(context: string): void {
  if (isTestUrlMode()) {
    console.log(`[TestMode] ${context}: тестовый URL режим активен (${window.location.pathname})`)
  }
}