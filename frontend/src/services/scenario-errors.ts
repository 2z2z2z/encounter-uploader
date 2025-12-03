/**
 * Константы и утилиты для обработки ошибок сценария
 *
 * Централизованное место для строк ошибок сервера и пользовательских сообщений.
 */

/**
 * Строки ошибок, возвращаемые сервером Encounter
 * Используются для проверки HTML ответа
 */
export const SCENARIO_SERVER_ERRORS = {
  /** Сценарий закрыт для просмотра */
  ACCESS_DENIED: 'Просмотр сценария игры не разрешен',
  /** Игра не найдена */
  GAME_NOT_FOUND: 'Запрошенная игра не существует'
} as const

/**
 * Человекочитаемые сообщения об ошибках для пользователя
 */
export const SCENARIO_USER_ERRORS = {
  /** Сценарий закрыт */
  ACCESS_DENIED: 'Сценарий закрыт. Проверьте правильность логина/пароля или права доступа к игре.',
  /** Игра не найдена */
  GAME_NOT_FOUND: 'Игра не найдена. Проверьте правильность URL сценария.',
  /** Неверный формат ответа */
  INVALID_RESPONSE: 'Неверный формат ответа сервера',
  /** Не найдены уровни */
  NO_LEVELS: 'Не удалось найти уровни в сценарии. Проверьте правильность URL.',
  /** Общая ошибка загрузки */
  LOAD_ERROR: 'Ошибка загрузки сценария',
  /** Сценарий не найден (404) */
  NOT_FOUND: 'Сценарий не найден. Проверьте правильность URL.',
  /** Доступ запрещен (403) */
  FORBIDDEN: 'Доступ к сценарию запрещен. Возможно, требуется авторизация.'
} as const

/**
 * Проверяет HTML на наличие известных ошибок и возвращает user-friendly сообщение
 * @param html - HTML содержимое страницы сценария
 * @returns сообщение об ошибке или null если ошибок нет
 */
export function checkScenarioHtmlForErrors(html: string): string | null {
  if (html.includes(SCENARIO_SERVER_ERRORS.ACCESS_DENIED)) {
    return SCENARIO_USER_ERRORS.ACCESS_DENIED
  }
  if (html.includes(SCENARIO_SERVER_ERRORS.GAME_NOT_FOUND)) {
    return SCENARIO_USER_ERRORS.GAME_NOT_FOUND
  }
  return null
}
