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
                  v-model="levelV2Store.domain"
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
                  v-model="levelV2Store.gameId"
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
                  v-model="levelV2Store.levelId"
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
                  v-model="selectedLevelType"
                  :options="levelTypeOptions"
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
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useLevelV2Store } from './level-system-v2/store'
import type { LevelTypeId } from './level-system-v2/types'
import { getAllLevelTypes } from './level-system-v2/configs'
import { useAuthStore } from '../store/auth'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FloatLabel from 'primevue/floatlabel'

const levelV2Store = useLevelV2Store()
const authStore = useAuthStore()
const router = useRouter()

const levelTypeOptions = computed(() => {
  return getAllLevelTypes().flatMap((config) => {
    if (config.subtypes && config.subtypes.length > 0) {
      return config.subtypes.map((subtype) => ({
        label: `${config.name} (${subtype.name})`,
        value: `${config.id}:${subtype.id}`,
      }))
    }

    return [{
      label: config.name,
      value: config.id,
    }]
  })
})

function resolveSelectionKey(typeId: string, subtype?: string | null): string {
  if (subtype && subtype.length > 0) {
    return `${typeId}:${subtype}`
  }
  return typeId
}

function parseSelectionKey(value: string): { typeId: LevelTypeId; subtype?: string } {
  if (value.includes(':')) {
    const [typeId, subtype] = value.split(':')
    return { typeId: typeId as LevelTypeId, subtype: subtype || undefined }
  }
  if (value.startsWith('olymp')) {
    const subtype = value.slice('olymp'.length)
    return { typeId: 'olymp', subtype: subtype || undefined }
  }
  if (value === '100500') {
    return { typeId: 'type100500' }
  }
  return { typeId: value as LevelTypeId }
}

const selectedLevelType = ref(resolveSelectionKey(levelV2Store.levelType, levelV2Store.subtypeId))

watch(
  () => resolveSelectionKey(levelV2Store.levelType, levelV2Store.subtypeId || undefined),
  (key) => {
    if (selectedLevelType.value !== key) {
      selectedLevelType.value = key
    }
  },
  { immediate: true }
)

watch(
  selectedLevelType,
  (key, previous) => {
    if (!key || key === previous) {
      return
    }

    const { typeId, subtype } = parseSelectionKey(key)
    if (typeId === levelV2Store.levelType && (subtype || '') === (levelV2Store.subtypeId || '')) {
      return
    }

    levelV2Store.initializeLevelType(typeId, subtype, true)
  }
)

const error = ref('')
const levelValidationError = ref('')

async function fetchGamesList() {
  const url = `https://${levelV2Store.domain}.en.cx/home?json=1`
  return axios.get(url)
}

function onLevelIdInput(event: globalThis.Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value
  const filtered = raw.replace(/[^0-9]/g, '')
  if (filtered !== raw) {
    levelV2Store.levelId = filtered
  }
  if (!filtered) {
    levelValidationError.value = 'Поле «ID уровня» должно содержать только цифры'
  } else {
    levelValidationError.value = ''
  }
}

async function onContinue() {
  error.value = ''

  const inTestMode = authStore.isTestMode
  if (!inTestMode) {
    if (!levelV2Store.domain.trim()) {
      error.value = 'Пожалуйста, укажите домен.'
      return
    }
    if (!String(levelV2Store.gameId).trim()) {
      error.value = 'Пожалуйста, укажите ID игры.'
      return
    }
  }

  if (!String(levelV2Store.levelId).trim()) {
    levelValidationError.value = 'Поле «ID уровня» должно содержать только цифры'
    return
  }
  if (!/^[0-9]+$/.test(levelV2Store.levelId)) {
    levelValidationError.value = 'Поле «ID уровня» принимает только цифры'
    return
  }
  levelValidationError.value = ''

  if (!inTestMode) {
    try {
      const res = await fetchGamesList()
      const ct = res.headers['content-type'] || ''
      if (!ct.includes('application/json')) {
        error.value = 'Ответ сервера содержит неверный формат.'
        return
      }
      const { ActiveGames = [], ComingGames = [] } = res.data
      const allGames = [...ActiveGames, ...ComingGames]
      if (!allGames.some((g: Record<string, unknown>) => String(g.GameID) === String(levelV2Store.gameId))) {
        error.value = 'Игра с указанным ID не найдена на домене.'
        return
      }
    } catch (e: unknown) {
      error.value = `Ошибка при проверке домена/игры: ${e instanceof Error ? e.message : String(e)}`
      return
    }
  }

  if (!inTestMode) {
    await authStore.authenticate(levelV2Store.domain)
    if (!authStore.loggedIn) {
      error.value = `Ошибка авторизации: ${authStore.error}`
      return
    }
  }

  const { typeId, subtype } = parseSelectionKey(selectedLevelType.value)
  levelV2Store.initializeLevelType(typeId, subtype, true)

  const path = subtype ? `/v2/${typeId}/${subtype}` : `/v2/${typeId}`
  router.push(path)
}
</script>





