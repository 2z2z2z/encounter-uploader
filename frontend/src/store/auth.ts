import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore(
  'auth',
  () => {
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
        await axios.post(
          '/api/auth/login',
          { login: username.value, password: password.value, domain },
          { withCredentials: true }
        )
        loggedIn.value = true
      } catch (err: any) {
        error.value = err.response?.data || err.message
        loggedIn.value = false
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
  {
    persist: true,
  }
)
