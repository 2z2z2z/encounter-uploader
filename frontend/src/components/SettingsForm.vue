<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 py-8">
    <div class="w-full max-w-lg">
      <Card>
        <template #title>Настройки</template>
        <template #content>
          <form @submit.prevent="onContinue" class="space-y-6">
            <div class="space-y-1">
              <FloatLabel variant="on">
                <InputText
                  id="domain"
                  v-model="store.domain"
                  fluid
                  class="transition-all duration-200"
                />
                <label for="domain">Домен Encounter</label>
              </FloatLabel>
            </div>

            <div class="space-y-1">
              <FloatLabel variant="on">
                <InputText
                  id="gameId"
                  v-model="store.gameId"
                  fluid
                  class="transition-all duration-200"
                />
                <label for="gameId">ID игры</label>
              </FloatLabel>
            </div>

            <div class="space-y-1">
              <FloatLabel variant="on">
                <InputText
                  id="levelId"
                  v-model="store.levelId"
                  :invalid="!!levelValidationError"
                  fluid
                  class="transition-all duration-200"
                  @input="onLevelIdInput"
                />
                <label for="levelId">№ уровня</label>
              </FloatLabel>
              <Message 
                v-if="levelValidationError" 
                severity="error" 
                :closable="false"
                class="mt-1"
              >
                {{ levelValidationError }}
              </Message>
            </div>

            <div class="space-y-1">
              <FloatLabel variant="on">
                <Select
                  id="uploadType"
                  v-model="store.uploadType"
                  :options="uploadTypeOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Выберите тип уровня"
                  fluid
                  class="transition-all duration-200"
                />
                <label for="uploadType">Тип уровня</label>
              </FloatLabel>
            </div>

            <Message 
              v-if="error" 
              severity="error" 
              :closable="false"
            >
              {{ error }}
            </Message>

            <Button 
              type="submit" 
              label="Продолжить"
              fluid
              class="transition-all duration-200"
            />
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUploadStore } from '../store'
import { useAuthStore } from '../store/auth'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FloatLabel from 'primevue/floatlabel'

const store = useUploadStore()
const authStore = useAuthStore()
const router = useRouter()

const uploadTypeOptions = [
  { label: 'Олимпийка (15 секторов)', value: 'olymp15' },
  { label: 'Олимпийка (31 сектор)', value: 'olymp31' },
  { label: 'Олимпийка (63 сектора)', value: 'olymp63' },
  { label: 'Олимпийка (127 сектора)', value: 'olymp127' },
  { label: '100500 секторов и бонусов', value: '100500' }
]

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
function onLevelIdInput(event: globalThis.Event) {
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

  // В тестовом режиме (логин/пароль = test/test) пропускаем проверки домена и ID игры
  const inTestMode = authStore.isTestMode
  if (!inTestMode) {
    // Проверяем домен и ID игры только вне тестового режима
    if (!store.domain.trim()) {
      error.value = 'Пожалуйста, укажите домен.'
      return
    }
    if (!String(store.gameId).trim()) {
      error.value = 'Пожалуйста, укажите ID игры.'
      return
    }
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

  if (!inTestMode) {
    try {
      const res = await fetchGamesList()
      const ct = res.headers['content-type'] || ''
      if (!ct.includes('application/json')) {
        error.value = 'Указан неверный домен.'
        return
      }
      const { ActiveGames = [], ComingGames = [] } = res.data
      const all = [...ActiveGames, ...ComingGames]
      if (!all.some((g: Record<string, unknown>) => String(g.GameID) === String(store.gameId))) {
        error.value = 'Игра с указанным ID не найдена на этом домене.'
        return
      }
    } catch (e: unknown) {
      error.value = `Ошибка при проверке домена/игры: ${e instanceof Error ? e.message : String(e)}`
      return
    }
  }

  // Авторизация: в тестовом режиме пропускаем
  if (!inTestMode) {
    await authStore.authenticate(store.domain)
    if (!authStore.loggedIn) {
      error.value = `Ошибка авторизации: ${authStore.error}`
      return
    }
  }

  // Переходим к загрузке
  router.push('/upload')
}
</script>


