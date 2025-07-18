// src/services/uploader.ts

import axios from 'axios'

/**
 * Задержка между запросами (в миллисекундах).
 */
const SLEEP_MS = 1200

/** 
 * Ждёт заданное количество миллисекунд. 
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  bonusTime: {
    hours: number
    minutes: number
    seconds: number
    negative: boolean
  }
  closedText: string
  displayText: string
  sectorName?: string
  bonusName?: string
  noHint?: boolean
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
  const url = '/api/admin/task'
  const params = new URLSearchParams()
  params.append('domain', domain)
  params.append('gid', String(gameid))
  params.append('level', String(level))
  params.append('inputTask', inputTask)

  console.log('[sendTask] ▶ POST', url)
  console.log('[sendTask] ▶ payload →', params.toString())

  const res = await axios.post(
    url,
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true,
    }
  )
  console.log('[sendTask] ◀ status=', res.status)

  console.log(`[sendTask] sleeping ${SLEEP_MS}ms before next step…`)
  const t0 = Date.now()
  await sleep(SLEEP_MS)
  const t1 = Date.now()
  console.log(`[sendTask] actual sleep: ${t1 - t0}ms`)

  return res.data
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
  const url = '/api/admin/sector'

  // Для предпросмотра будет использоваться formatClosedText(closedRaw),
  // но в самом запросе txtSectorName может быть передано отдельно.
  const formattedClosed = formatClosedText(closedRaw)

  const params = new URLSearchParams()
  params.append('domain', domain)
  params.append('gid', String(gameid))
  params.append('level', String(level))

  // Название сектора (если не указано — пустая строка)
  params.append('txtSectorName', sectorName)
  params.append('savesector', ' ')
  variants.forEach((v, idx) => {
    params.append(`txtAnswer_${idx}`, v)
    params.append(`ddlAnswerFor_${idx}`, '0')
  })

  console.log(`[sendSector] ▶ POST ${url}`)
  console.log(`[sendSector] ▶ payload →`, params.toString())
  console.log(`[sendSector] (закрытый сектор для предпросмотра) →`, formattedClosed)

  const res = await axios.post(
    url,
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true,
    }
  )
  console.log('[sendSector] ◀ status=', res.status)

  console.log(`[sendSector] sleeping ${SLEEP_MS}ms before next sector…`)
  const t0 = Date.now()
  await sleep(SLEEP_MS)
  const t1 = Date.now()
  console.log(`[sendSector] actual sleep: ${t1 - t0}ms`)

  return res.data
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

  let checkboxName: string | null = null
  const MAX_RETRIES = 3

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
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
        const wrapper = inp.closest('.levelWrapper')
        if (!wrapper) continue
        const span = wrapper.querySelector('span')
        if (!span) continue
        if (span.textContent?.trim() === String(level)) {
          checkboxName = inp.getAttribute('name')
          console.log(`[sendBonuses] найден чекбокс "${checkboxName}" для уровня ${level}`)
          break
        }
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
      }
    }
  }

  if (!checkboxName) {
    throw new Error(
      `Не удалось определить чекбокс для уровня ${level}. Проверьте авторизацию и доступность страницы бонусов.`
    )
  }

  for (const bonus of bonusesToSend) {
    const url = '/api/admin/bonus'
    const params = new URLSearchParams()
    params.append('domain', domain)
    params.append('gid', String(gameid))
    params.append('level', String(level))

    // Название бонуса (если не указано — пустая строка)
    params.append('txtBonusName', bonus.bonusName || '')

    // txtHelp — вставка «открытого сектора» в таблицу
    const hint = bonus.noHint
      ? ''
      : `<script type="text/javascript">document.getElementById("${level}_${String(
          bonus.number
        ).padStart(2, '0')}").innerHTML="${
          bonus.displayText
            ? `<p class='up'>${bonus.displayText.replace(/"/g, '\\"')}</p>`
            : bonus.closedText.replace(/"/g, '\\"')
        }";</script>`
    params.append('txtHelp', hint)

    // Варианты бонуса: answer_-1, answer_-2, …
    bonus.variants.forEach((v, idx) => {
      params.append(`answer_-${idx + 1}`, v)
    })

    // Время бонуса
    params.append('txtHours', String(bonus.bonusTime.hours))
    params.append('txtMinutes', String(bonus.bonusTime.minutes))
    params.append('txtSeconds', String(bonus.bonusTime.seconds))
    if (bonus.bonusTime.negative) {
      params.append('negative', 'on')
    }

    // Отмечаем чекбокс нужного уровня
    params.append(checkboxName, 'on')

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
    } catch (err: any) {
      console.error('[sendBonuses] Ошибка отправки бонуса', err.message || err)
    }

    console.log(`[sendBonuses] sleeping ${SLEEP_MS}ms before next bonus…`)
    const t0 = Date.now()
    await sleep(SLEEP_MS)
    const t1 = Date.now()
    console.log(`[sendBonuses] actual sleep: ${t1 - t0}ms`)
  }
}
