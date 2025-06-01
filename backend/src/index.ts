import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import axios from 'axios'

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(express.json())

// 1) Логин
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body
  try {
    const resp = await axios.post(
      'https://world.en.cx/login/signin?json=1',
      new URLSearchParams({
        Login: login,
        Password: password,
        ddlNetwork: '1'
      }),
      { withCredentials: true }
    )
    const data = resp.data
    if (data.Error === 0) {
      // Передаём куки клиенту
      const setCookie = resp.headers['set-cookie'] as string[]
      setCookie.forEach(c => res.append('Set-Cookie', c))
      res.json({ success: true })
    } else {
      res.json({ success: false, message: data.Message })
    }
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 2) Заливка
app.post('/api/upload', async (req, res) => {
  const { gameId, levelId, config, sectors, bonuses } = req.body
  // TODO: тут будем формировать form-data и отправлять 3 запроса
  // для начала — просто лог
  console.log('Upload payload:', req.body)
  res.json({ success: true })
})

app.listen(3000, () => console.log('Backend listening on http://localhost:3000'))
