// src/utils/visibility.ts

/**
 * Утилита для работы с Page Visibility API
 * Помогает предотвратить приостановку заливки при переключении вкладок
 */

let isUploadActive = false
let visibilityChangeHandler: (() => void) | null = null

// Функция showUploadWarning удалена - теперь используется PrimeVue ConfirmDialog

/**
 * Начинает отслеживание видимости страницы во время заливки
 */
export function startUploadVisibilityTracking(type: 'бонусы' | 'сектора' | 'задание') {
  isUploadActive = true
  
  // Удаляем предыдущий обработчик, если был
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler)
  }

  // Создаем новый обработчик
  visibilityChangeHandler = () => {
    if (!isUploadActive) return

    if (document.hidden) {
      // Вкладка стала неактивной
      console.warn(`⚠️ Вкладка стала неактивной во время заливки "${type}"! Браузер может приостановить процесс.`)
      
      // Показываем системное уведомление, если разрешено
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`⚠️ Заливка "${type}" может быть приостановлена`, {
          body: 'Вернитесь на вкладку заливатора для продолжения процесса',
          icon: '/favicon.ico'
        })
      }
    } else {
      // Вкладка снова стала активной
      console.log(`✅ Вкладка снова активна. Заливка "${type}" продолжается.`)
    }
  }

  // Добавляем обработчик
  document.addEventListener('visibilitychange', visibilityChangeHandler)

  // Запрашиваем разрешение на уведомления
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

/**
 * Останавливает отслеживание видимости страницы
 */
export function stopUploadVisibilityTracking() {
  isUploadActive = false
  
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler)
    visibilityChangeHandler = null
  }
}

/**
 * Проверяет, активна ли сейчас вкладка
 */
export function isPageVisible(): boolean {
  return !document.hidden
}

/**
 * Показывает финальное уведомление о завершении заливки
 */
export function showCompletionNotification(type: 'бонусы' | 'сектора' | 'задание', count: number) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`✅ Заливка ${type} завершена`, {
      body: `Успешно отправлено: ${count} ${type}`,
      icon: '/favicon.ico'
    })
  }
} 