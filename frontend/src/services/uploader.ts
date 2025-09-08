// src/services/uploader.ts

import axios from 'axios'
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

/**
 * Проверяет, является ли текст ссылкой (http:// или https://).
 * Если да – возвращает <a><img>…, иначе возвращает сам текст.
 */
function formatClosedText(text: string): string {
  const trimmed = text.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    return `<a href="${trimmed}" target="_blank"><img src="${trimmed}" style="max-width: 150px; max-height: 150px;"></a>`
  }
  return text
}

/**
 * Описание одного сектора/бонуса.
 */
export interface Answer {
  number: number
  variants: string[]
  inSector: boolean
  inBonus: boolean
  /** Если true — бонус доступен на всех уровнях (rbAllLevels=0), иначе — на указанных (rbAllLevels=1). */
  allLevels?: boolean
  bonusTime: {
    hours: number
    minutes: number
    seconds: number
    negative: boolean
  }
  /** Задержка появления бонуса (chkDelay + txtDelay*) */
  delay?: {
    hours: number
    minutes: number
    seconds: number
  }
  /** Ограничение (относительное время) работы бонуса (chkRelativeLimit + txtValid*) */
  relativeLimit?: {
    hours: number
    minutes: number
    seconds: number
  }
  closedText: string
  displayText: string
  sectorName?: string
  bonusName?: string
  noHint?: boolean
  /** Текст/HTML бонусного задания → textarea name=txtTask */
  bonusTask?: string
  /** Текст/HTML подсказки → textarea name=txtHelp */
  bonusHint?: string
  /**
   * Дополнительные уровни (метки), для которых нужно отметить чекбоксы при создании бонуса.
   * Это значения-ярлыки, отображаемые на форме EN (например, "12", "13").
   * Уровень из настроек (параметр level) будет добавлен автоматически и может не указываться здесь.
   */
  targetLevels?: string[]
}

// ==== БИЛДЕРЫ PAYLOAD ====
export function buildTaskPayload(domain: string, gid: string | number, level: string | number, html: string): globalThis.URLSearchParams {
  const params = new globalThis.URLSearchParams()
  params.append('domain', domain)
  params.append('gid', String(gid))
  params.append('level', String(level))
  params.append('inputTask', html)
  return params
}

export function buildSectorPayload(
  domain: string,
  gid: string | number,
  level: string | number,
  variants: string[],
  sectorName = ''
): globalThis.URLSearchParams {
  const params = new globalThis.URLSearchParams()
  params.append('domain', domain)
  params.append('gid', String(gid))
  params.append('level', String(level))
  params.append('txtSectorName', sectorName)
  params.append('savesector', ' ')
  variants.forEach((v, idx) => {
    params.append(`txtAnswer_${idx}`, v)
    params.append(`ddlAnswerFor_${idx}`, '0')
  })
  return params
}

export function buildBonusPayload(
  base: { domain: string; gid: string | number; level: string | number },
  bonus: Answer,
  levelLabelToName: Record<string, string>
): globalThis.URLSearchParams {
  const params = new globalThis.URLSearchParams()
  params.append('domain', base.domain)
  params.append('gid', String(base.gid))
  params.append('level', String(base.level))
  params.append('txtBonusName', bonus.bonusName || '')
  params.append('txtTask', typeof bonus.bonusTask === 'string' ? bonus.bonusTask : '')
  if (typeof bonus.bonusHint === 'string') {
    params.append('txtHelp', bonus.bonusHint)
  } else {
    const hint = bonus.noHint
      ? ''
      : `<script type="text/javascript">document.getElementById("${base.level}_${String(
          bonus.number
        ).padStart(2, '0')}").innerHTML="${
          bonus.displayText
            ? `<p class='up'>${bonus.displayText.replace(/"/g, '\\"')}</p>`
            : bonus.closedText.replace(/"/g, '\\"')
        }";</script>`
    params.append('txtHelp', hint)
  }
  bonus.variants.forEach((v, idx) => params.append(`answer_-${idx + 1}`, v))
  params.append('txtHours', String(bonus.bonusTime.hours))
  params.append('txtMinutes', String(bonus.bonusTime.minutes))
  params.append('txtSeconds', String(bonus.bonusTime.seconds))
  if (bonus.bonusTime.negative) params.append('negative', 'on')
  if (bonus.delay && (bonus.delay.hours || bonus.delay.minutes || bonus.delay.seconds)) {
    params.append('chkDelay', 'on')
    params.append('txtDelayHours', String(bonus.delay.hours || 0))
    params.append('txtDelayMinutes', String(bonus.delay.minutes || 0))
    params.append('txtDelaySeconds', String(bonus.delay.seconds || 0))
  }
  if (bonus.relativeLimit && (bonus.relativeLimit.hours || bonus.relativeLimit.minutes || bonus.relativeLimit.seconds)) {
    params.append('chkRelativeLimit', 'on')
    params.append('txtValidHours', String(bonus.relativeLimit.hours || 0))
    params.append('txtValidMinutes', String(bonus.relativeLimit.minutes || 0))
    params.append('txtValidSeconds', String(bonus.relativeLimit.seconds || 0))
  }
  const isAllLevels = !!bonus.allLevels
  params.append('rbAllLevels', isAllLevels ? '0' : '1')
  if (!isAllLevels) {
    const selected = new Set<string>([String(base.level), ...(Array.isArray(bonus.targetLevels) ? bonus.targetLevels.map(String) : [])])
    for (const lbl of selected) {
      const chk = levelLabelToName[lbl]
      if (chk) params.append(chk, 'on')
    }
  }
  return params
}
/**
 * 1) Отправка «Задания».
 */
export async function sendTask(
  domain: string,
  gameid: string | number,
  level: string | number,
  inputTask: string
) {
  const progress = useProgressStore()
  
  // Проверяем паузу перед выполнением запроса
  await checkPauseStatus()
  
  const url = '/api/admin/task'
  const params = buildTaskPayload(domain, gameid, level, inputTask)

  console.log('[sendTask] ▶ POST', url)
  console.log('[sendTask] ▶ payload →', params.toString())

  try {
    const res = await axios.post(
      url,
      params.toString(),
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
  } catch (error: any) {
    console.error('[sendTask] Ошибка отправки задания:', error)
    const status = error.response?.status || 0
    const message = `Ошибка отправки задания: ${status ? `HTTP ${status}` : error.message || 'Неизвестная ошибка'}`
    progress.reportError(message)
    progress.pause() // Ставим заливку на паузу при ошибке
    throw error
  }
}

/**
 * 2) Отправка «Секторов» — POST /api/admin/sector
 * Для олимпийки поле txtSectorName пустое, но при необходимости
 * можно передать его через параметр sectorName.
*/
export async function sendSector(
  domain: string,
  gameid: string | number,
  level: string | number,
  variants: string[],
  closedRaw: string,
  sectorName = ''
) {
  const progress = useProgressStore()
  
  // Проверяем паузу перед выполнением запроса
  await checkPauseStatus()
  
  const url = '/api/admin/sector'

  // Для предпросмотра будет использоваться formatClosedText(closedRaw),
  // но в самом запросе txtSectorName может быть передано отдельно.
  const formattedClosed = formatClosedText(closedRaw)

  const params = buildSectorPayload(domain, gameid, level, variants, sectorName)

  console.log(`[sendSector] ▶ POST ${url}`)
  console.log(`[sendSector] ▶ payload →`, params.toString())
  console.log(`[sendSector] (закрытый сектор для предпросмотра) →`, formattedClosed)

  try {
    const res = await axios.post(
      url,
      params.toString(),
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
  } catch (error: any) {
    console.error('[sendSector] Ошибка отправки сектора:', error)
    const status = error.response?.status || 0
    const message = `Ошибка отправки сектора: ${status ? `HTTP ${status}` : error.message || 'Неизвестная ошибка'}`
    progress.reportError(message)
    progress.pause() // Ставим заливку на паузу при ошибке
    throw error
  }
}

/**
 * 3) Отправка «Бонусов» …
 */
export async function sendBonuses(
  domain: string,
  gameid: string | number,
  level: string | number,
  answers: Answer[]
) {
  const bonusesToSend = answers.filter((a) => a.inBonus)
  if (bonusesToSend.length === 0) {
    console.log('[sendBonuses] Нет помеченных бонусов → ничего не отправляем.')
    return
  }

  // Постараемся один раз получить форму бонусов и извлечь:
  // 1) Имя чекбокса для текущего уровня
  // 2) Полную карту всех уровней: label (отображаемое значение) → name (атрибут чекбокса)
  let checkboxName: string | null = null
  let levelLabelToName: Record<string, string> = {}
  const MAX_RETRIES = 3

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Проверяем паузу перед каждой попыткой получения формы
      await checkPauseStatus()
      const urlForm = `/api/admin/bonus-form?domain=${encodeURIComponent(
        domain
      )}&gid=${encodeURIComponent(String(gameid))}&level=${encodeURIComponent(
        String(level)
      )}`

      console.log(`[sendBonuses] ▶ GET ${urlForm}  (attempt ${attempt})`)
      const formRes = await axios.get(urlForm, { withCredentials: true })
      const htmlText = formRes.data as string

      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlText, 'text/html')

      const inputs = Array.from(
        doc.querySelectorAll('input[name^="level_"]')
      ) as HTMLInputElement[]
      for (const inp of inputs) {
        const nameAttr = inp.getAttribute('name') || ''
        let labelText = ''
        const wrapper = inp.closest('.levelWrapper')
        if (wrapper) {
          const span = wrapper.querySelector('span')
          if (span) labelText = span.textContent?.trim() || ''
        }
        if (!labelText) {
          // Fallback: попытаемся извлечь число из соседних текстов или самого nameAttr
          const siblingText = inp.nextSibling && (inp.nextSibling as any).textContent
          const candidate = (siblingText || nameAttr).toString().match(/\d+/)?.[0] || ''
          labelText = candidate
        }
        if (labelText) {
          levelLabelToName[labelText] = nameAttr
        }
      }

      const nameForCurrentLevel = levelLabelToName[String(level)]
      if (nameForCurrentLevel) {
        checkboxName = nameForCurrentLevel
        console.log(`[sendBonuses] найден чекбокс "${checkboxName}" для уровня ${level}`)
      }

      if (!checkboxName) {
        console.warn(
          `[sendBonuses] ❗ Чекбокс для уровня ${level} не найден (attempt ${attempt})`
        )
        if (attempt < MAX_RETRIES) {
          console.log(`[sendBonuses] Ждём ${SLEEP_MS}ms, затем повтор…`)
          await sleep(SLEEP_MS)
          continue
        }
      }
      break
    } catch (err: any) {
      console.error(
        `[sendBonuses] Ошибка GET bonus-form (attempt ${attempt}):`,
        err.message || err
      )
      if (attempt < MAX_RETRIES) {
        console.log(`[sendBonuses] Ждём ${SLEEP_MS}ms, затем повтор…`)
        await sleep(SLEEP_MS)
      } else {
        console.error('[sendBonuses] Все попытки получить форму бонуса исчерпаны.')
        const progress = useProgressStore()
        const status = err.response?.status || 0
        const message = `Ошибка получения формы бонуса: ${status ? `HTTP ${status}` : err.message || 'Неизвестная ошибка'}`
        progress.reportError(message)
        progress.pause() // Ставим заливку на паузу при ошибке
      }
    }
  }

  if (!checkboxName) {
    throw new Error(
      `Не удалось определить чекбокс для уровня ${level}. Проверьте авторизацию и доступность страницы бонусов.`
    )
  }

  for (const bonus of bonusesToSend) {
    // Проверяем паузу перед отправкой каждого бонуса
    await checkPauseStatus()
    
    const url = '/api/admin/bonus'
    const params = buildBonusPayload({ domain, gid: gameid, level }, bonus, levelLabelToName)

    console.log(`[sendBonuses] ▶ POST ${url}`)
    console.log(`[sendBonuses] ▶ payload →`, params.toString())

    try {
      const res = await axios.post(
        url,
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }
      )
      console.log('[sendBonuses] ◀ status=', res.status)

      if (res.status >= 400) {
        const progress = useProgressStore()
        progress.reportError(`Ошибка отправки бонуса №${bonus.number}: HTTP ${res.status}`)
        progress.pause() // Ставим заливку на паузу при HTTP ошибке
      }
    } catch (err: any) {
      console.error('[sendBonuses] Ошибка отправки бонуса', err.message || err)
      const progress = useProgressStore()
      const status = err.response?.status || 0
      const message = `Ошибка отправки бонуса №${bonus.number}: ${status ? `HTTP ${status}` : err.message || 'Неизвестная ошибка'}`
      progress.reportError(message)
      progress.pause() // Ставим заливку на паузу при ошибке
    }

    console.log(`[sendBonuses] sleeping ${SLEEP_MS}ms before next bonus…`)
    const t0 = Date.now()
    await sleep(SLEEP_MS)
    const t1 = Date.now()
    console.log(`[sendBonuses] actual sleep: ${t1 - t0}ms`)
  }
}

/**
 * Возвращает список доступных уровней из формы BonusEdit: label (отображаемое число) и name (атрибут чекбокса).
 */
export async function fetchBonusLevels(
  domain: string,
  gameid: string | number,
  level: string | number
): Promise<Array<{ label: string; name: string }>> {
  const urlForm = `/api/admin/bonus-form?domain=${encodeURIComponent(
    domain
  )}&gid=${encodeURIComponent(String(gameid))}&level=${encodeURIComponent(
    String(level)
  )}`
  const res = await axios.get(urlForm, { withCredentials: true })
  const htmlText = res.data as string
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
      const siblingText = inp.nextSibling && (inp.nextSibling as any).textContent
      const candidate = (siblingText || nameAttr).toString().match(/\d+/)?.[0] || ''
      labelText = candidate
    }
    if (labelText) {
      result.push({ label: labelText, name: nameAttr })
    }
  }
  return result
}
