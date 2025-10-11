import DOMPurify from 'dompurify'

export interface SanitizeOptions {
  allowStyles?: boolean
}

export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  if (options.allowStyles) {
    // Для предпросмотра используем минимальную санитизацию
    // DOMPurify агрессивно удаляет <style> теги, поэтому используем ручную фильтрацию
    // Убираем только очевидно опасный контент: <script> и опасные атрибуты
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Удаляем <script>
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '') // Удаляем on* атрибуты (onclick, onerror и т.д.)
      .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '') // Удаляем on* атрибуты без кавычек

    return sanitized
  }

  // Стандартная строгая конфигурация для остального контента
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
