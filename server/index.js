// server/index.js

const express = require('express')
const session = require('express-session')
const axios = require('axios')
const axiosRetry = require('axios-retry')
const bodyParser = require('body-parser')

const app = express()

// Порт (если 3000 занят, можно задать через ENV)
const PORT = process.env.PORT || 3001

// Сессии для хранения куки авторизации
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'encounter-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false, // Не создавать сессию для каждого запроса
    rolling: true, // Продлевать сессию при каждом запросе
    cookie: {
      secure: false, // Устанавливайте true для HTTPS в продакшене
      httpOnly: true, // Защита от XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
      sameSite: 'lax', // CSRF защита, совместимая с redirect'ами
    },
    name: 'encounter.sid', // Кастомное имя cookie для безопасности
  })
)
// Разбираем JSON и form-urlencoded
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Глобальные ретраи для запросов к EN: GET → 429/5xx/сеть; POST → 429/сеть
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  shouldResetTimeout: true,
  retryCondition: (error) => {
    const method = (error.config?.method || '').toLowerCase()
    const status = error.response?.status
    const noResponse = !error.response
    if (method === 'get') {
      return noResponse || status === 429 || (status >= 500 && status < 600)
    }
    if (method === 'post') {
      return noResponse || status === 429
    }
    return false
  },
})

// Добавлено: утилита для обновления authCookie при получении нового Set-Cookie
/**
 * Проверяет заголовок Set-Cookie ответа proxyRes и, если там пришёл новый
 * ASP.NET_SessionId (или любой другой куки), обновляет сохранённый authCookie
 * в сессии пользователя.
 */
function refreshAuthCookie(req, proxyRes) {
  const setCookie = proxyRes?.headers?.['set-cookie']
  if (!setCookie || setCookie.length === 0) return

  // Текущие куки в виде объекта { name: value }
  const current = {}
  if (req.session.authCookie) {
    req.session.authCookie.split('; ').forEach(kv => {
      const [k, ...rest] = kv.split('=')
      current[k] = rest.join('=') // значение может содержать '='
    })
  }

  // Обновляем/добавляем куки из Set-Cookie
  const cookiesArr = Array.isArray(setCookie) ? setCookie : [setCookie]
  cookiesArr.forEach(c => {
    const [pair] = c.split(';') // берём «name=value»
    const idx = pair.indexOf('=')
    if (idx > -1) {
      const name = pair.slice(0, idx)
      const value = pair.slice(idx + 1)
      current[name] = value
    }
  })

  // Собираем обратно
  req.session.authCookie = Object.entries(current)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

// === Логин ===
app.post('/api/auth/login', async (req, res) => {
  const { login, password, domain } = req.body
  if (!login || !password || !domain) {
    return res.status(400).send('Missing login, password, or domain')
  }
  try {
    const loginRes = await axios.post(
      `https://${domain}.en.cx/Login.aspx?lang=ru`,
      new URLSearchParams({
        Login: login,
        Password: password,
        ddlNetwork: '1',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 0,
        validateStatus: null,
      }
    )
    // Сохраняем куки
    const setCookie = loginRes.headers['set-cookie'] || []
    req.session.authCookie = Array.isArray(setCookie)
      ? setCookie.map(c => c.split(';')[0]).join('; ')
      : setCookie.split(';')[0]

    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err)
        return res.status(500).send('Session error')
      }
      res.send({ ok: true })
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).send('Login error')
  }
})

// === Upload_Tasks ===
app.post('/api/admin/task', async (req, res) => {
  const { domain, gid, level, inputTask } = req.body
  const url = `https://${domain}.en.cx/Administration/Games/TaskEdit.aspx?gid=${gid}&level=${level}`
  console.log('[proxyAdminTask] ▶', url)
  console.log('[proxyAdminTask] ▶ payload →', { inputTask })

  try {
    const proxyRes = await axios.post(
      url,
      new URLSearchParams({ inputTask }).toString(),
      {
        headers: { Cookie: req.session.authCookie },
        maxRedirects: 0,
        validateStatus: null,
      }
    )
    // Обновляем authCookie, если EN прислал новый
    refreshAuthCookie(req, proxyRes)
    const clientStatus = proxyRes.status === 302 ? 200 : proxyRes.status
    console.log('[proxyAdminTask] ◀', proxyRes.status, '→ client', clientStatus)
    res.status(clientStatus).send(proxyRes.data)
  } catch (err) {
    console.error('[proxyAdminTask] Error:', err.response?.status, err.message)
    res.status(500).send('Upload task error')
  }
})

// === Upload_Sectors ===
app.post('/api/admin/sector', async (req, res) => {
  const { domain, gid, level, txtSectorName, savesector, ...rest } = req.body
  const url = `https://${domain}.en.cx/Administration/Games/LevelEditor.aspx?gid=${gid}&level=${level}`

  const payloadObj = {
    txtSectorName: txtSectorName || '',
    savesector: savesector || ' ',
    ...rest,
  }

  console.log('[proxyAdminSector] ▶', url)
  console.log('[proxyAdminSector] ▶ payload →', payloadObj)

  try {
    const proxyRes = await axios.post(
      url,
      new URLSearchParams(payloadObj).toString(),
      {
        headers: { Cookie: req.session.authCookie },
        maxRedirects: 0,
        validateStatus: null,
      }
    )
    // Обновляем authCookie, если EN прислал новый
    refreshAuthCookie(req, proxyRes)
    const clientStatus = proxyRes.status === 302 ? 200 : proxyRes.status
    console.log('[proxyAdminSector] ◀', proxyRes.status, '→ client', clientStatus)
    res.status(clientStatus).send(proxyRes.data)
  } catch (err) {
    console.error('[proxyAdminSector] Error:', err.response?.status, err.message)
    res.status(500).send('Upload sector error')
  }
})

// === Upload_Bonuses ===
app.post('/api/admin/bonus', async (req, res) => {
  // Пришли все поля бонуса, включая уже найденное имя чекбокса level_<…>=on
  const { domain, gid, level, ...payload } = req.body
  // Меняем URL на BonusEdit.aspx с параметрами action=add
  const url = `https://${domain}.en.cx/Administration/Games/BonusEdit.aspx?gid=${gid}&level=${level}&bonus=0&action=save`
  console.log('[proxyAdminBonus] ▶', url)
  console.log('[proxyAdminBonus] ▶ payload →', payload)

  try {
    const proxyRes = await axios.post(
      url,
      new URLSearchParams(payload).toString(),
      {
        headers: { Cookie: req.session.authCookie },
        maxRedirects: 0,
        validateStatus: null,
      }
    )
    // Обновляем authCookie, если EN прислал новый
    refreshAuthCookie(req, proxyRes)
    const clientStatus = proxyRes.status === 302 ? 200 : proxyRes.status
    console.log('[proxyAdminBonus] ◀', proxyRes.status, '→ client', clientStatus)
    res.status(clientStatus).send(proxyRes.data)
  } catch (err) {
    console.error('[proxyAdminBonus] Error:', err.response?.status, err.message)
    res.status(500).send('Upload bonus error')
  }
})

// === НОВЫЙ маршрут: возвращает HTML формы BonusEdit.aspx для парсинга чекбоксов ===
app.get('/api/admin/bonus-form', async (req, res) => {
  const { domain, gid, level } = req.query
  if (!domain || !gid || !level) {
    return res.status(400).send('Missing domain, gid or level')
  }

  // Тот же URL, но с ?action=add — чтобы оказаться сразу на форме добавления/редактирования бонуса
  const url = `https://${domain}.en.cx/Administration/Games/BonusEdit.aspx?gid=${gid}&level=${level}&bonus=0&action=save`
  console.log('[proxyGetBonusForm] ▶', url)

  try {
    // Выполняем GET с куками из сессии
    const proxyRes = await axios.get(url, {
      headers: { Cookie: req.session.authCookie },
    })
    // Обновляем authCookie, если EN прислал новый
    refreshAuthCookie(req, proxyRes)
    // Возвращаем чистый HTML страницы
    res.status(200).send(proxyRes.data)
  } catch (err) {
    console.error('[proxyGetBonusForm] Error:', err.response?.status, err.message)
    res.status(500).send('Error fetching bonus form')
  }
})

// === Старт сервера ===
app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`)
})
