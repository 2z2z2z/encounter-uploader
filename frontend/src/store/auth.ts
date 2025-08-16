import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const username = ref('')
    const password = ref('') // Не сохраняется в localStorage согласно плану безопасности
    const domain = ref('') // Добавлено для удобства
    const loggedIn = ref(false)
    const error = ref('')
    
    const isTestMode = computed(() => {
      return username.value === 'test' && password.value === 'test'
    })

    const isAuthenticated = computed(() => {
      return loggedIn.value && (isTestMode.value || username.value)
    })

    function setCredentials(u: string, p: string, d?: string) {
      username.value = u
      password.value = p
      if (d) domain.value = d
    }

    async function authenticate(authDomain: string) {
      error.value = ''
      domain.value = authDomain
      
      // Тестовый режим: test/test — авторизацию пропускаем
      if (isTestMode.value) {
        loggedIn.value = true
        return
      }
      
      try {
        await axios.post(
          '/api/auth/login',
          { login: username.value, password: password.value, domain: authDomain },
          { withCredentials: true }
        )
        loggedIn.value = true
      } catch (err: any) {
        error.value = err.response?.data || err.message
        loggedIn.value = false
      }
    }

    function logout() {
      // Очищаем все данные при выходе
      username.value = ''
      password.value = ''
      domain.value = ''
      loggedIn.value = false
      error.value = ''
    }

    return {
      // State
      username,
      password,
      domain,
      loggedIn,
      error,
      
      // Computed
      isTestMode,
      isAuthenticated,
      
      // Actions
      setCredentials,
      authenticate,
      logout
    }
  },
  {
    // Согласно плану рефакторинга Фаза 6.3: исключить пароль из persist
    persist: {
      pick: ['username', 'domain', 'loggedIn'] // Пароль НЕ сохраняется для безопасности
    }
  }
)
