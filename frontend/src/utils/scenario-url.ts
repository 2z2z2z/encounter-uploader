/**
 * Утилиты для работы с URL сценария Encounter
 *
 * Единственный источник истины для валидации и парсинга URL сценариев.
 * При изменении regex необходимо также обновить server/index.js:409
 */

/**
 * Регулярное выражение для валидации URL сценария
 * Формат: https://{subdomain}.en.cx/GameScenario.aspx?gid={gameId}
 *
 * @example
 * https://126.en.cx/GameScenario.aspx?gid=12345
 * https://demo.en.cx/GameScenario.aspx?gid=67890
 */
export const SCENARIO_URL_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.en\.cx\/GameScenario\.aspx\?gid=\d+$/

/**
 * Проверяет валидность URL сценария
 * @param url - URL для проверки
 * @returns true если URL соответствует формату сценария
 */
export function isValidScenarioUrl(url: string): boolean {
  if (!url) return false
  return SCENARIO_URL_REGEX.test(url)
}

/**
 * Извлекает домен (поддомен) из URL сценария
 * @param url - URL сценария
 * @returns поддомен (например, "126") или null если URL невалиден
 *
 * @example
 * extractDomainFromUrl("https://126.en.cx/GameScenario.aspx?gid=12345")
 * // returns "126"
 */
export function extractDomainFromUrl(url: string): string | null {
  if (!isValidScenarioUrl(url)) return null
  const match = url.match(/^https:\/\/([a-zA-Z0-9-]+)\.en\.cx\//)
  return match ? match[1] : null
}

/**
 * Извлекает ID игры из URL сценария
 * @param url - URL сценария
 * @returns ID игры или null если URL невалиден
 *
 * @example
 * extractGameIdFromUrl("https://126.en.cx/GameScenario.aspx?gid=12345")
 * // returns "12345"
 */
export function extractGameIdFromUrl(url: string): string | null {
  if (!isValidScenarioUrl(url)) return null
  const match = url.match(/gid=(\d+)/)
  return match ? match[1] : null
}
