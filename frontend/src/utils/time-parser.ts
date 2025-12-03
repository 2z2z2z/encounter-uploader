/**
 * Утилиты для парсинга и форматирования времени
 * Поддерживаемые форматы:
 * - Полный: "20 минут", "1 час", "1 час 30 минут", "2 часа 15 минут", "1 минуту"
 * - Сокращенный: "20м", "1ч", "1ч 30м", "30с", "2мин.", "5сек."
 * - С точками: "20м.", "1ч.", "5мин.", "30сек."
 * - Дни: "1 день", "2 дня", "5 дней", "1д"
 * - Комбинации: "1 день 2 часа 30 минут 15 секунд"
 */

/**
 * Парсит строку времени и возвращает количество секунд
 * @param timeStr - строка времени для парсинга
 * @returns количество секунд
 */
export function parseTimeToSeconds(timeStr: string | null): number {
  if (!timeStr) return 0

  let totalSeconds = 0

  // Ищем дни (день, дня, дней, д, д.)
  const daysMatch = timeStr.match(/(\d+)\s*(?:день|дня|дней|д\.?)(?:\s|$)/i)
  if (daysMatch) {
    totalSeconds += parseInt(daysMatch[1], 10) * 24 * 60 * 60
  }

  // Ищем часы (час, часа, часов, ч, ч.)
  const hoursMatch = timeStr.match(/(\d+)\s*(?:час(?:а|ов)?|ч\.?)(?:\s|$)/i)
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 60 * 60
  }

  // Ищем минуты (минут, минуты, минута, минуту, мин, мин., м, м.)
  const minutesMatch = timeStr.match(/(\d+)\s*(?:минут[уаы]?|мин\.?|м\.?)(?:\s|$)/i)
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1], 10) * 60
  }

  // Ищем секунды (секунд, секунды, секунда, секунду, сек, сек., с)
  const secondsMatch = timeStr.match(/(\d+)\s*(?:секунд[уаы]?|сек\.?|с)(?:\s|$)/i)
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1], 10)
  }

  return totalSeconds
}

/**
 * Форматирует секунды в компактную строку "Xд Xч Xм Xс"
 * @param totalSeconds - количество секунд
 * @returns отформатированная строка
 */
export function formatSecondsToString(totalSeconds: number): string {
  if (totalSeconds === 0) return '0м'

  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}д`)
  if (hours > 0) parts.push(`${hours}ч`)
  if (minutes > 0) parts.push(`${minutes}м`)
  if (seconds > 0) parts.push(`${seconds}с`)

  return parts.join(' ')
}
