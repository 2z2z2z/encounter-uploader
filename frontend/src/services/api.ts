import axios from 'axios'

export async function loginApi(login: string, password: string) {
  return axios.post('/api/login', { login, password })
}

export async function uploadApi(payload: any) {
  return axios.post('/api/upload', payload)
}
