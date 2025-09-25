/**
 * Транспортный слой для отправки данных в Encounter API
 *
 * Унифицированный модуль для всех HTTP запросов к API сервера.
 * Отделен от логики создания пейлоадов для четкого разделения ответственности.
 */

import axios, { isAxiosError } from 'axios'
import { useProgressStore } from '../store/progress'

/**
 * Задержка между запросами (в миллисекундах).
 */
const SLEEP_MS = Number(import.meta.env.VITE_SLEEP_MS ?? 1200)

/**
 * Ждёт заданное количество миллисекунд с поддержкой паузы.
 */
async function sleep(ms: number): Promise<void> {
  const progress = useProgressStore()

  // Проверяем паузу перед началом сна
  if (progress.pauseRequested) {
    await progress.waitForResume()
  }

  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

/**
 * Проверяет статус паузы и ожидает возобновления если необходимо
 */
async function checkPauseStatus(): Promise<void> {
  const progress = useProgressStore()

  if (progress.pauseRequested) {
    await progress.waitForResume()
  }
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.message) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}

function getErrorStatus(error: unknown): number {
  if (isAxiosError(error)) {
    return error.response?.status ?? 0
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const candidate = (error as { status?: unknown }).status
    if (typeof candidate === 'number') {
      return candidate
    }
  }
  return 0
}

/**
 * Отправка задания (Task)
 */
export async function sendTask(
  payload: globalThis.URLSearchParams
) {
  const progress = useProgressStore()

  // Проверяем паузу перед выполнением запроса
  await checkPauseStatus()

  const url = '/api/admin/task'

  console.log('[sendTask] ▶ POST', url)
  console.log('[sendTask] ▶ payload →', payload.toString())

  try {
    const res = await axios.post(
      url,
      payload.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      }
    )
    console.log('[sendTask] ◀ status=', res.status)

    if (res.status >= 400) {
      progress.reportError(`Ошибка отправки задания: HTTP ${res.status}`)
      progress.pause() // Ставим заливку на паузу при HTTP ошибке
    }

    console.log(`[sendTask] sleeping ${SLEEP_MS}ms before next step…`)
    const t0 = Date.now()
    await sleep(SLEEP_MS)
    const t1 = Date.now()
    console.log(`[sendTask] actual sleep: ${t1 - t0}ms`)

    return res.data
  } catch (error: unknown) {
    console.error('[sendTask] Ошибка отправки задания:', error)
    const status = getErrorStatus(error)
    const fallbackMessage = getErrorMessage(error)
    const message = `Ошибка отправки задания: ${status ? `HTTP ${status}` : fallbackMessage || 'Неизвестная ошибка'}`
    progress.reportError(message)
    progress.pause() // Ставим заливку на паузу при ошибке
    throw error
  }
}

/**
 * Отправка сектора
 */
export async function sendSector(
  payload: globalThis.URLSearchParams
) {
  const progress = useProgressStore()

  // Проверяем паузу перед выполнением запроса
  await checkPauseStatus()

  const url = '/api/admin/sector'

  console.log(`[sendSector] ▶ POST ${url}`)
  console.log(`[sendSector] ▶ payload →`, payload.toString())

  try {
    const res = await axios.post(
      url,
      payload.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      }
    )
    console.log('[sendSector] ◀ status=', res.status)

    if (res.status >= 400) {
      progress.reportError(`Ошибка отправки сектора: HTTP ${res.status}`)
      progress.pause() // Ставим заливку на паузу при HTTP ошибке
    }

    console.log(`[sendSector] sleeping ${SLEEP_MS}ms before next sector…`)
    const t0 = Date.now()
    await sleep(SLEEP_MS)
    const t1 = Date.now()
    console.log(`[sendSector] actual sleep: ${t1 - t0}ms`)

    return res.data
  } catch (error: unknown) {
    console.error('[sendSector] Ошибка отправки сектора:', error)
    const status = getErrorStatus(error)
    const fallbackMessage = getErrorMessage(error)
    const message = `Ошибка отправки сектора: ${status ? `HTTP ${status}` : fallbackMessage || 'Неизвестная ошибка'}`
    progress.reportError(message)
    progress.pause() // Ставим заливку на паузу при ошибке
    throw error
  }
}

/**
 * Отправка бонуса
 */
export async function sendBonus(
  payload: globalThis.URLSearchParams
) {
  const progress = useProgressStore()

  // Проверяем паузу перед выполнением запроса
  await checkPauseStatus()

  const url = '/api/admin/bonus'

  console.log(`[sendBonus] ▶ POST ${url}`)
  console.log(`[sendBonus] ▶ payload →`, payload.toString())

  try {
    const res = await axios.post(
      url,
      payload.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      }
    )
    console.log('[sendBonus] ◀ status=', res.status)

    if (res.status >= 400) {
      const bonusNumber = payload.get('txtBonusName') || 'неизвестный'
      progress.reportError(`Ошибка отправки бонуса ${bonusNumber}: HTTP ${res.status}`)
      progress.pause() // Ставим заливку на паузу при HTTP ошибке
    }

    console.log(`[sendBonus] sleeping ${SLEEP_MS}ms before next bonus…`)
    const t0 = Date.now()
    await sleep(SLEEP_MS)
    const t1 = Date.now()
    console.log(`[sendBonus] actual sleep: ${t1 - t0}ms`)

    return res.data
  } catch (error: unknown) {
    console.error('[sendBonus] Ошибка отправки бонуса:', error)
    const status = getErrorStatus(error)
    const fallbackMessage = getErrorMessage(error)
    const bonusNumber = payload.get('txtBonusName') || 'неизвестный'
    const message = `Ошибка отправки бонуса ${bonusNumber}: ${status ? `HTTP ${status}` : fallbackMessage || 'Неизвестная ошибка'}`
    progress.reportError(message)
    progress.pause() // Ставим заливку на паузу при ошибке
    throw error
  }
}

/**
 * Получение HTML формы для бонусов (для извлечения маппинга уровней)
 */
export async function fetchBonusForm(
  domain: string,
  gameId: string | number,
  levelId: string | number
): Promise<string> {
  const urlForm = `/api/admin/bonus-form?domain=${encodeURIComponent(
    domain
  )}&gid=${encodeURIComponent(String(gameId))}&level=${encodeURIComponent(
    String(levelId)
  )}`

  console.log(`[fetchBonusForm] ▶ GET ${urlForm}`)
  const formRes = await axios.get(urlForm, { withCredentials: true })
  return formRes.data as string
}

/**
 * Получение списка доступных уровней из формы BonusEdit
 */
export async function fetchBonusLevels(
  domain: string,
  gameId: string | number,
  levelId: string | number
): Promise<Array<{ label: string; name: string }>> {
  const htmlText = await fetchBonusForm(domain, gameId, levelId)

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, 'text/html')
  const inputs = Array.from(doc.querySelectorAll('input[name^="level_"]')) as HTMLInputElement[]

  const result: Array<{ label: string; name: string }> = []

  for (const inp of inputs) {
    const nameAttr = inp.getAttribute('name') || ''
    let labelText = ''
    const wrapper = inp.closest('.levelWrapper')
    if (wrapper) {
      const span = wrapper.querySelector('span')
      if (span) labelText = span.textContent?.trim() || ''
    }
    if (!labelText) {
      const siblingText = inp.nextSibling?.textContent ?? ''
      const match = (siblingText || nameAttr).toString().match(/\d+/)
      const candidate = match ? match[0] : ''
      labelText = candidate
    }
    if (labelText) {
      result.push({ label: labelText, name: nameAttr })
    }
  }

  return result
}