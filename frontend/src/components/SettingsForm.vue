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
          <!-- Лейбл изменён на "№ уровня" -->
          <label class="form-label">№ уровня</label>
          <input
            v-model="store.levelId"
            placeholder="№ уровня"
            class="form-input h-10 w-full"
            @input="onLevelIdInput"
            :class="{ 'border-red-500': levelValidationError }"
          />
          <!-- Сообщение об ошибке валидации -->
          <p
            v-if="levelValidationError"
            class="text-red-500 text-sm mt-1"
          >
            {{ levelValidationError }}
          </p>
        </div>

        <div>
          <label class="form-label">Тип уровня</label>
          <select v-model="store.uploadType" class="form-select h-10 w-full">
            <option value="olymp">Олимпийка (15 секторов)</option>
            <option value="olymp31">Олимпийка (31 сектор)</option>
            <option value="olymp63">Олимпийка (63 сектора)</option>
            <option value="olymp127">Олимпийка (127 сектора)</option>
          </select>
        </div>
      </div>

      <!-- Ошибка общего порядка (проверка домена/игры и авторизации) -->
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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUploadStore } from '../store'
import { useAuthStore } from '../store/auth'

const store = useUploadStore()
const authStore = useAuthStore()
const router = useRouter()

watch(
  () => store.uploadType,
  (val, oldVal) => {
    store.setUploadType(val, oldVal)
  },
  { immediate: true }
)

// Общая ошибка проверки (домен/игра/авторизация)
const error = ref('')

// Ошибка валидации поля "№ уровня"
const levelValidationError = ref('')

async function fetchGamesList() {
  const url = `https://${store.domain}.en.cx/home?json=1`
  return axios.get(url)
}

/**
 * onLevelIdInput — оставляет в поле только цифры и проверяет непустоту.
 */
function onLevelIdInput(event: Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value
  // Оставляем только цифры
  const filtered = raw.replace(/[^0-9]/g, '')
  if (filtered !== raw) {
    store.levelId = filtered
  }
  // Валидация: непустое и только цифры
  if (!filtered) {
    levelValidationError.value = 'Поле «№ уровня» обязательно и должно содержать только цифры'
  } else {
    levelValidationError.value = ''
  }
}

async function onContinue() {
  error.value = ''

  // Проверяем домен и ID игры
  if (!store.domain.trim()) {
    error.value = 'Пожалуйста, укажите домен.'
    return
  }
  if (!String(store.gameId).trim()) {
    error.value = 'Пожалуйста, укажите ID игры.'
    return
  }
  // Проверяем "№ уровня"
  if (!String(store.levelId).trim()) {
    levelValidationError.value = 'Поле «№ уровня» обязательно и должно содержать только цифры'
    return
  }
  if (!/^[0-9]+$/.test(store.levelId)) {
    levelValidationError.value = 'Поле «№ уровня» должно содержать только цифры'
    return
  }
  levelValidationError.value = ''

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

  // Авторизуемся через authStore
  await authStore.authenticate(store.domain)
  if (!authStore.loggedIn) {
    error.value = `Ошибка авторизации: ${authStore.error}`
    return
  }

  // Переходим к загрузке
  router.push('/upload')
}
</script>

<style scoped>
/* Опционально обводка красным при ошибке */
.border-red-500 {
  border-color: #f56565;
  border-width: 2px;
}
</style>
