import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { useTestUrlMode } from '../composables/useTestUrlMode'
import { isTestUrlMode } from '../utils/testMode'

export const useAuthStore = defineStore(
  'auth',
  () => {
    useTestUrlMode() // для побочных эффектов
    const username = ref('')
    const password = ref('')
    const loggedIn = ref(false)
    const error = ref('')
    
    const isTestMode = computed(() => {
      return username.value === 'test' && password.value === 'test'
    })

    function setCredentials(u: string, p: string) {
      username.value = u
      password.value = p
    }

    async function authenticate(domain: string) {
      error.value = ''
      // Тестовый режим: test/test — авторизацию пропускаем
      if (isTestMode.value) {
        loggedIn.value = true
        return
      }
      try {
        const response = await axios.post(
          '/api/auth/login',
          { login: username.value, password: password.value, domain },
          { withCredentials: true }
        )

        // Проверяем успешность авторизации по ответу
        if (response.data.success) {
          loggedIn.value = true
        } else {
          loggedIn.value = false
          error.value = 'Ошибка авторизации'
        }
      } catch (err: unknown) {
        loggedIn.value = false

        // Обработка различных типов ошибок
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { data?: { error?: string }, status?: number } }).response
          if (response?.data?.error) {
            error.value = response.data.error
          } else if (response?.status === 401) {
            error.value = 'Неверный логин или пароль'
          } else if (response?.status === 400) {
            error.value = 'Домен не найден'
          } else {
            error.value = 'Ошибка сервера при авторизации'
          }
        } else if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Неизвестная ошибка'
        }
      }
    }

    return {
      username,
      password,
      loggedIn,
      error,
      isTestMode,
      setCredentials,
      authenticate,
    }
  },
  isTestUrlMode() ? {} : {
    persist: {
      pick: ['username', 'password', 'loggedIn']
    }
  }
)
