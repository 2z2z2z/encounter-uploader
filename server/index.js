// server/index.js

const express = require('express')
const session = require('express-session')
const axios = require('axios')
const axiosRetry = require('axios-retry')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

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

// === МОДУЛЬ СТАТИСТИКИ ===
const STATS_FILE = path.join(__dirname, 'stats.json')

/**
 * Создает анонимный хэш для пользователя на основе домена и сессии
 */
function createUserHash(domain, sessionId) {
  return crypto.createHash('sha256').update(`${domain}-${sessionId}`).digest('hex').slice(0, 16)
}

/**
 * Загружает статистику из файла
 */
function loadStats() {
  try {
    if (!fs.existsSync(STATS_FILE)) {
      return { tasks: [], sectors: [], bonuses: [] }
    }
    const data = fs.readFileSync(STATS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('[Stats] Error loading stats:', error)
    return { tasks: [], sectors: [], bonuses: [] }
  }
}

/**
 * Сохраняет статистику в файл
 */
function saveStats(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8')
  } catch (error) {
    console.error('[Stats] Error saving stats:', error)
  }
}

/**
 * Логирует задание
 */
function logTask(domain, gameId, sessionId) {
  try {
    const stats = loadStats()
    const userHash = createUserHash(domain, sessionId)
    stats.tasks.push({
      timestamp: new Date().toISOString(),
      domain,
      gameId: String(gameId),
      userHash
    })
    saveStats(stats)
    console.log('[Stats] Task logged:', { domain, gameId, userHash })
  } catch (error) {
    console.error('[Stats] Error logging task:', error)
  }
}

/**
 * Логирует сектор
 */
function logSector(domain, gameId, sessionId, count = 1) {
  try {
    const stats = loadStats()
    const userHash = createUserHash(domain, sessionId)
    stats.sectors.push({
      timestamp: new Date().toISOString(),
      domain,
      gameId: String(gameId),
      userHash,
      count: Number(count)
    })
    saveStats(stats)
    console.log('[Stats] Sector logged:', { domain, gameId, userHash, count })
  } catch (error) {
    console.error('[Stats] Error logging sector:', error)
  }
}

/**
 * Логирует бонус
 */
function logBonus(domain, gameId, sessionId) {
  try {
    const stats = loadStats()
    const userHash = createUserHash(domain, sessionId)
    stats.bonuses.push({
      timestamp: new Date().toISOString(),
      domain,
      gameId: String(gameId),
      userHash
    })
    saveStats(stats)
    console.log('[Stats] Bonus logged:', { domain, gameId, userHash })
  } catch (error) {
    console.error('[Stats] Error logging bonus:', error)
  }
}

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

    console.log('[Login] Status:', loginRes.status)
    console.log('[Login] Headers:', loginRes.headers)

    // Анализируем результат авторизации
    const cookies = loginRes.headers['set-cookie'] || []
    const hasCookies = cookies.length > 0

    // Проверяем наличие atoken (токен авторизации с uid пользователя)
    const hasAuthToken = cookies.some(cookie =>
      cookie.includes('atoken=') && cookie.includes('uid%3d')
    )

    // Проверяем наличие stoken (сессионный токен)
    const hasSessionToken = cookies.some(cookie =>
      cookie.includes('stoken=')
    )

    console.log('[Login] hasCookies:', hasCookies)
    console.log('[Login] hasAuthToken:', hasAuthToken)
    console.log('[Login] hasSessionToken:', hasSessionToken)

    if (!hasCookies || !hasAuthToken || !hasSessionToken) {
      console.log('[Login] Auth failed - missing required tokens')
      return res.status(401).json({
        error: 'Неверный логин или пароль'
      })
    }

    // Сохраняем куки только при успешной авторизации
    const setCookie = loginRes.headers['set-cookie'] || []
    req.session.authCookie = Array.isArray(setCookie)
      ? setCookie.map(c => c.split(';')[0]).join('; ')
      : setCookie.split(';')[0]

    console.log('[Login] Auth successful, cookies saved')

    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err)
        return res.status(500).json({ error: 'Session error' })
      }
      res.json({ success: true })
    })
  } catch (err) {
    console.error('Login error:', err)
    if (err.code === 'ENOTFOUND') {
      return res.status(400).json({ error: 'Домен не найден' })
    }
    res.status(500).json({ error: 'Ошибка сервера при авторизации' })
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

    // Логируем статистику только при успешной отправке
    if (clientStatus >= 200 && clientStatus < 300) {
      logTask(domain, gid, req.sessionID)
    }

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

    // Логируем статистику только при успешной отправке
    if (clientStatus >= 200 && clientStatus < 300) {
      logSector(domain, gid, req.sessionID, 1)
    }

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

    // Логируем статистику только при успешной отправке
    if (clientStatus >= 200 && clientStatus < 300) {
      logBonus(domain, gid, req.sessionID)
    }

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

// === ENDPOINT СТАТИСТИКИ ===
app.get('/api/stats', async (_req, res) => {
  try {
    const stats = loadStats()

    // Защита от некорректных данных
    const safeTasks = Array.isArray(stats.tasks) ? stats.tasks : []
    const safeSectors = Array.isArray(stats.sectors) ? stats.sectors : []
    const safeBonuses = Array.isArray(stats.bonuses) ? stats.bonuses : []

    // Вычисляем агрегированную статистику
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    function filterByTime(items, timeFilter) {
      if (!Array.isArray(items)) return []

      return items.filter(item => {
        if (!item || !item.timestamp) return false

        try {
          const timestamp = new Date(item.timestamp)
          if (isNaN(timestamp.getTime())) return false

          switch (timeFilter) {
            case 'day': return timestamp >= dayAgo
            case 'week': return timestamp >= weekAgo
            case 'month': return timestamp >= monthAgo
            default: return true // all time
          }
        } catch (e) {
          console.warn('[Stats] Invalid timestamp:', item.timestamp)
          return false
        }
      })
    }

    function getAggregatedStats(timeFilter) {
      const filteredTasks = filterByTime(safeTasks, timeFilter)
      const filteredSectors = filterByTime(safeSectors, timeFilter)
      const filteredBonuses = filterByTime(safeBonuses, timeFilter)

      // Подсчет уникальных значений с защитой от некорректных данных
      const uniqueGames = new Set()
      const uniqueUsers = new Set()
      const uniqueDomains = new Set()

      function addToSets(item) {
        if (item && typeof item.domain === 'string' && typeof item.gameId === 'string') {
          uniqueGames.add(`${item.domain}-${item.gameId}`)
          uniqueDomains.add(item.domain)
        }
        if (item && typeof item.userHash === 'string') {
          uniqueUsers.add(item.userHash)
        }
      }

      filteredTasks.forEach(addToSets)
      filteredSectors.forEach(addToSets)
      filteredBonuses.forEach(addToSets)

      // Подсчет общего количества секторов с защитой от NaN
      const totalSectors = filteredSectors.reduce((sum, item) => {
        const count = Number(item.count) || 1
        return sum + (isNaN(count) ? 1 : Math.max(1, count))
      }, 0)

      return {
        tasks: Math.max(0, filteredTasks.length),
        sectors: Math.max(0, totalSectors),
        bonuses: Math.max(0, filteredBonuses.length),
        uniqueGames: Math.max(0, uniqueGames.size),
        uniqueUsers: Math.max(0, uniqueUsers.size),
        uniqueDomains: Math.max(0, uniqueDomains.size)
      }
    }

    // Собираем детализацию по доменам и играм
    function getDomainsAndGames() {
      const allRecords = [...safeTasks, ...safeSectors, ...safeBonuses]
      const domainStats = new Map()
      const gameStats = new Map()

      allRecords.forEach(record => {
        if (record && typeof record.domain === 'string' && typeof record.gameId === 'string') {
          const domain = record.domain
          const gameKey = `${record.domain}-${record.gameId}`

          // Статистика по доменам
          if (!domainStats.has(domain)) {
            domainStats.set(domain, { tasks: 0, sectors: 0, bonuses: 0, games: new Set() })
          }
          const domainStat = domainStats.get(domain)
          domainStat.games.add(record.gameId)

          // Статистика по играм
          if (!gameStats.has(gameKey)) {
            gameStats.set(gameKey, { domain: record.domain, gameId: record.gameId, tasks: 0, sectors: 0, bonuses: 0 })
          }

          // Увеличиваем счетчики в зависимости от типа записи
          if (safeTasks.includes(record)) {
            domainStat.tasks++
            gameStats.get(gameKey).tasks++
          } else if (safeSectors.includes(record)) {
            const count = Number(record.count) || 1
            domainStat.sectors += count
            gameStats.get(gameKey).sectors += count
          } else if (safeBonuses.includes(record)) {
            domainStat.bonuses++
            gameStats.get(gameKey).bonuses++
          }
        }
      })

      // Преобразуем в массивы для отправки
      const domains = Array.from(domainStats.entries()).map(([domain, stats]) => ({
        domain,
        tasks: stats.tasks,
        sectors: stats.sectors,
        bonuses: stats.bonuses,
        uniqueGames: stats.games.size,
        gameIds: Array.from(stats.games).sort()
      })).sort((a, b) => a.domain.localeCompare(b.domain))

      const games = Array.from(gameStats.values())
        .sort((a, b) => {
          const domainCompare = a.domain.localeCompare(b.domain)
          return domainCompare !== 0 ? domainCompare : a.gameId.localeCompare(b.gameId)
        })

      return { domains, games }
    }

    const { domains, games } = getDomainsAndGames()

    const result = {
      allTime: getAggregatedStats('all'),
      month: getAggregatedStats('month'),
      week: getAggregatedStats('week'),
      day: getAggregatedStats('day'),
      meta: {
        lastUpdate: new Date().toISOString(),
        totalRecords: safeTasks.length + safeSectors.length + safeBonuses.length,
        oldestRecord: getOldestRecord([...safeTasks, ...safeSectors, ...safeBonuses]),
        newestRecord: getNewestRecord([...safeTasks, ...safeSectors, ...safeBonuses])
      },
      breakdown: {
        domains,
        games: games.slice(0, 50) // Ограничиваем количество игр для производительности
      }
    }

    console.log('[Stats] Statistics requested:', result)
    res.json(result)
  } catch (error) {
    console.error('[Stats] Error getting statistics:', error)
    res.status(500).json({ error: 'Error loading statistics' })
  }
})

// Вспомогательные функции для метаданных
function getOldestRecord(records) {
  if (!Array.isArray(records) || records.length === 0) return null

  let oldest = null
  records.forEach(record => {
    if (record && record.timestamp) {
      try {
        const timestamp = new Date(record.timestamp)
        if (!isNaN(timestamp.getTime()) && (!oldest || timestamp < oldest)) {
          oldest = timestamp
        }
      } catch (e) {
        // Игнорируем некорректные временные метки
      }
    }
  })

  return oldest ? oldest.toISOString() : null
}

function getNewestRecord(records) {
  if (!Array.isArray(records) || records.length === 0) return null

  let newest = null
  records.forEach(record => {
    if (record && record.timestamp) {
      try {
        const timestamp = new Date(record.timestamp)
        if (!isNaN(timestamp.getTime()) && (!newest || timestamp > newest)) {
          newest = timestamp
        }
      } catch (e) {
        // Игнорируем некорректные временные метки
      }
    }
  })

  return newest ? newest.toISOString() : null
}

// === Старт сервера ===
app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`)
})
