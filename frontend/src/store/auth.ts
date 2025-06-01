import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const username = ref('')
    const password = ref('')
    const loggedIn = ref(false)
    const error = ref('')

    function setCredentials(u: string, p: string) {
      username.value = u
      password.value = p
    }

    async function authenticate(domain: string) {
      error.value = ''
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
      setCredentials,
      authenticate,
    }
  },
  {
    persist: true,
  }
)
