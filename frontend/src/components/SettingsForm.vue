<template>
  <div class="min-h-screen flex items-center justify-center bg-blue-50 py-8">
    <div class="bg-white p-12 rounded-md shadow-sm w-full max-w-lg space-y-6">
      <h1 class="text-2xl font-semibold text-center">Настройки</h1>
      <p class="text-sm text-gray-500 text-center mb-4">
        автор: <strong>{{ authStore.username }}</strong>,
        домен: <strong>{{ store.domain }}</strong>,
        игра: <strong>{{ store.gameId }}</strong>,
        уровень: <strong>{{ store.levelId }}</strong>
      </p>

      <div class="space-y-4">
        <div>
          <label class="form-label">Домен Encounter</label>
          <input
            v-model="store.domain"
            placeholder="Например, 126"
            class="form-input h-10 w-full"
          />
        </div>

        <div>
          <label class="form-label">ID игры</label>
          <input
            v-model="store.gameId"
            placeholder="ID вашей игры"
            class="form-input h-10 w-full"
          />
        </div>

        <div>
          <label class="form-label">ID уровня</label>
          <input
            v-model="store.levelId"
            placeholder="ID уровня"
            class="form-input h-10 w-full"
          />
        </div>

        <div>
          <label class="form-label">Тип уровня</label>
          <select v-model="store.uploadType" class="form-select h-10 w-full">
            <option value="olymp">Олимпийка (15 секторов)</option>
          </select>
        </div>
      </div>

      <div v-if="error" class="text-red-500 text-sm">
        {{ error }}
      </div>

      <div class="flex justify-end">
        <button @click="onContinue" class="form-button h-10 px-6">
          Продолжить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUploadStore } from '../store'
import { useAuthStore } from '../store/auth'

const store = useUploadStore()
const authStore = useAuthStore()
const router = useRouter()
const error = ref('')

async function fetchGamesList() {
  const url = `https://${store.domain}.en.cx/home?json=1`
  return axios.get(url)
}

async function onContinue() {
  error.value = ''

  if (!store.domain.trim()) {
    error.value = 'Пожалуйста, укажите домен.'
    return
  }
  if (!String(store.gameId).trim()) {
    error.value = 'Пожалуйста, укажите ID игры.'
    return
  }

  try {
    const res = await fetchGamesList()
    const ct = res.headers['content-type'] || ''
    if (!ct.includes('application/json')) {
      error.value = 'Сервер не вернул JSON. Проверьте домен.'
      return
    }
    const { ActiveGames = [], ComingGames = [] } = res.data
    const all = [...ActiveGames, ...ComingGames]
    if (!all.some((g: any) => String(g.GameID) === String(store.gameId))) {
      error.value = 'Игра с указанным ID не найдена на этом домене.'
      return
    }
  } catch (e: any) {
    error.value = `Ошибка при проверке домена/игры: ${e.message}`
    return
  }

  // вызываем action authenticate — теперь TS видит эту функцию
  await authStore.authenticate(store.domain)
  if (!authStore.loggedIn) {
    error.value = `Ошибка авторизации: ${authStore.error}`
    return
  }

  router.push('/upload')
}
</script>
