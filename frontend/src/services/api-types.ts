/**
 * Type guards и типы для API ответов
 */

// ===== RESPONSE TYPES =====

export interface ApiSuccessResponse {
  ok: boolean
  status: number
  data?: unknown
}

export interface ApiErrorResponse {
  ok: false
  status: number
  error: string
  message: string
}

export interface BonusLevel {
  label: string
  name: string
}

// ===== TYPE GUARDS =====

/**
 * Проверяет, что ответ является успешным API ответом
 */
export function isApiSuccessResponse(value: unknown): value is ApiSuccessResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof (value as Record<string, unknown>).ok === 'boolean' &&
    'status' in value &&
    typeof (value as Record<string, unknown>).status === 'number'
  )
}

/**
 * Проверяет, что ответ является ошибкой API
 */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    (value as Record<string, unknown>).ok === false &&
    'status' in value &&
    typeof (value as Record<string, unknown>).status === 'number' &&
    'error' in value &&
    typeof (value as Record<string, unknown>).error === 'string'
  )
}

/**
 * Проверяет, что значение является строкой HTML
 */
export function isHtmlString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    (value.includes('<') || value.includes('>'))
  )
}

/**
 * Проверяет, что значение является массивом BonusLevel
 */
export function isBonusLevelsArray(value: unknown): value is BonusLevel[] {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every((item): item is BonusLevel =>
    typeof item === 'object' &&
    item !== null &&
    'label' in item &&
    typeof (item as Record<string, unknown>).label === 'string' &&
    'name' in item &&
    typeof (item as Record<string, unknown>).name === 'string'
  )
}

/**
 * Проверяет, что значение является объектом Axios error
 */
export function isAxiosErrorLike(error: unknown): error is {
  response?: { status: number; data?: unknown }
  message: string
  isAxiosError: boolean
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string' &&
    ('isAxiosError' in error || 'response' in error)
  )
}

/**
 * Безопасно извлекает HTTP статус из ошибки
 */
export function getErrorStatus(error: unknown): number {
  if (isAxiosErrorLike(error) && error.response?.status) {
    return error.response.status
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const candidate = (error as Record<string, unknown>).status
    if (typeof candidate === 'number') {
      return candidate
    }
  }
  return 0
}

/**
 * Безопасно извлекает сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosErrorLike(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}