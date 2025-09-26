/**
 * Утилита для извлечения имени домена из различных форматов input'а пользователя
 *
 * Поддерживаемые форматы:
 * - "tech" -> "tech"
 * - "tech.en.cx" -> "tech"
 * - "https://tech.en.cx/" -> "tech"
 * - "http://tech.en.cx" -> "tech"
 * - "tech.en.cx/" -> "tech"
 */

/**
 * Извлекает имя домена из строки ввода пользователя
 *
 * @param input - Строка домена в любом поддерживаемом формате
 * @returns Очищенное имя домена или исходная строка если не удалось распарсить
 */
export function extractDomainName(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Убираем пробелы по краям
  const trimmedInput = input.trim()

  if (!trimmedInput) {
    return ''
  }

  try {
    // Случай 1: Полный URL с протоколом
    if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
      const url = new globalThis.URL(trimmedInput)
      const hostname = url.hostname

      // Извлекаем первую часть хоста (до первой точки)
      const domainParts = hostname.split('.')
      return domainParts[0] || ''
    }

    // Случай 2: Домен без протокола, но с доменной зоной
    if (trimmedInput.includes('.')) {
      // Убираем завершающий слеш если есть
      const cleanInput = trimmedInput.replace(/\/$/, '')

      // Проверяем, что это похоже на домен (содержит .en.cx или другую зону)
      const parts = cleanInput.split('.')

      // Возвращаем первую часть
      return parts[0] || ''
    }

    // Случай 3: Простое имя домена без точек
    // Убираем возможные лишние символы
    const cleanDomain = trimmedInput.replace(/[^a-zA-Z0-9-]/g, '')
    return cleanDomain

  } catch (error: unknown) {
    // В случае ошибки парсинга URL возвращаем исходное значение
    console.warn('[extractDomainName] Ошибка парсинга домена:', error)

    // Последняя попытка - просто очищаем от лишних символов
    return trimmedInput.replace(/[^a-zA-Z0-9-]/g, '')
  }
}

/**
 * Проверяет, является ли строка валидным именем домена Encounter
 *
 * @param domainName - Имя домена для проверки
 * @returns true если домен валиден для Encounter
 */
export function isValidEncounterDomain(domainName: string): boolean {
  if (!domainName || typeof domainName !== 'string') {
    return false
  }

  const cleanName = domainName.trim()

  // Проверяем базовые правила:
  // - только латинские буквы, цифры и дефисы
  // - длина от 1 до 63 символов (стандарт DNS)
  // - не начинается и не заканчивается дефисом
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

  return domainRegex.test(cleanName)
}

/**
 * Type guard для проверки корректности домена
 */
export function isDomainString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}