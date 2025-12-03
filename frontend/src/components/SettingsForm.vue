<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 py-8">
    <div class="w-full max-w-lg">
      <Card>
        <template #title>Настройки</template>
        <template #content>
          <form @submit.prevent="onContinue" class="space-y-6">
            <!-- Переключатель режимов -->
            <div class="flex justify-center">
              <SelectButton
                v-model="checkerStore.mode"
                :options="modeOptions"
                option-label="label"
                option-value="value"
                aria-label="Выбор режима"
              />
            </div>

            <!-- Режим Заливатор -->
            <template v-if="checkerStore.mode === 'uploader'">
              <div class="space-y-1">
                <FloatLabel variant="on">
                  <InputText
                    id="domain"
                    v-model="levelStore.domain"
                    :invalid="!!domainValidationError"
                    placeholder="domain или domain.en.cx"
                    fluid
                    class="transition-all duration-200"
                    @input="onDomainInput"
                  />
                  <label for="domain">Домен Encounter</label>
                </FloatLabel>
                <Message
                  v-if="domainValidationError"
                  severity="error"
                  :closable="false"
                  class="mt-1"
                >
                  {{ domainValidationError }}
                </Message>
              </div>

              <div class="space-y-1">
                <FloatLabel variant="on">
                  <InputText
                    id="gameId"
                    v-model="levelStore.gameId"
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
                    v-model="levelStore.levelId"
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
            </template>

            <!-- Режим Проверятор -->
            <template v-else>
              <div class="space-y-1">
                <FloatLabel variant="on">
                  <InputText
                    id="scenarioUrl"
                    v-model="checkerStore.scenarioUrl"
                    :invalid="!!scenarioUrlError"
                    placeholder="https://domain.en.cx/GameScenario.aspx?gid=12345"
                    fluid
                    class="transition-all duration-200"
                    @input="onScenarioUrlInput"
                  />
                  <label for="scenarioUrl">URL сценария</label>
                </FloatLabel>
                <Message
                  v-if="scenarioUrlError"
                  severity="error"
                  :closable="false"
                  class="mt-1"
                >
                  {{ scenarioUrlError }}
                </Message>
              </div>

              <div class="space-y-1">
                <FloatLabel variant="on">
                  <Select
                    id="gameType"
                    v-model="checkerStore.gameType"
                    :options="gameTypeOptions"
                    option-label="label"
                    option-value="value"
                    :invalid="!!gameTypeError"
                    fluid
                    class="transition-all duration-200"
                    @change="gameTypeError = ''"
                  />
                  <label for="gameType">Тип игры</label>
                </FloatLabel>
              </div>
            </template>

            <Message
              v-if="error"
              severity="error"
              :closable="false"
            >
              {{ error }}
            </Message>

            <Button
              type="submit"
              :label="checkerStore.mode === 'uploader' ? 'Продолжить' : 'Проверить'"
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
import { useLevelStore } from '@/store/levels'
import { useCheckerStore, type AppMode, type GameType } from '@/store/checker'
import type { LevelTypeId } from '@/entities/level/types'
import { getAllLevelTypes } from '@/entities/level/configs'
import { useAuthStore } from '../store/auth'
import { extractDomainName, isValidEncounterDomain } from '@/utils/domainExtractor'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FloatLabel from 'primevue/floatlabel'

const levelStore = useLevelStore()
const authStore = useAuthStore()
const checkerStore = useCheckerStore()
const router = useRouter()

/** Опции режимов приложения */
const modeOptions = [
  { label: 'Заливатор', value: 'uploader' as AppMode },
  { label: 'Проверятор', value: 'checker' as AppMode }
]

/** Опции типов игры для проверятора */
const gameTypeOptions = [
  { label: 'Точки', value: 'points' as GameType },
  { label: 'Схватка', value: 'encounter' as GameType }
]

/** Ошибка валидации URL сценария */
const scenarioUrlError = ref('')

/** Ошибка валидации типа игры */
const gameTypeError = ref('')

/** Регулярное выражение для валидации URL сценария */
const SCENARIO_URL_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.en\.cx\/GameScenario\.aspx\?gid=\d+$/

/**
 * Валидирует URL сценария
 */
function validateScenarioUrl(url: string): boolean {
  return SCENARIO_URL_REGEX.test(url)
}

/**
 * Обработчик ввода URL сценария
 */
function onScenarioUrlInput(): void {
  const url = checkerStore.scenarioUrl.trim()
  if (!url) {
    scenarioUrlError.value = ''
    return
  }
  if (!validateScenarioUrl(url)) {
    scenarioUrlError.value = 'Неверный формат URL. Ожидается: https://domain.en.cx/GameScenario.aspx?gid=12345'
  } else {
    scenarioUrlError.value = ''
  }
}

const levelTypeOptions = computed(() => {
  return getAllLevelTypes().reduce((options, config) => {
    if (config.subtypes && config.subtypes.length > 0) {
      const subtypeOptions = config.subtypes.map((subtype) => ({
        label: `${config.name} (${subtype.name})`,
        value: `${config.id}:${subtype.id}`,
      }))
      options.push(...subtypeOptions)
      return options
    }

    options.push({
      label: config.name,
      value: config.id,
    })

    return options
  }, [] as Array<{ label: string; value: string }>)
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

const selectedLevelType = ref(resolveSelectionKey(levelStore.levelType, levelStore.subtypeId))

watch(
  () => resolveSelectionKey(levelStore.levelType, levelStore.subtypeId || undefined),
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
    if (typeId === levelStore.levelType && (subtype || '') === (levelStore.subtypeId || '')) {
      return
    }

    levelStore.initializeLevelType(typeId, subtype, true)
  }
)

const error = ref('')
const levelValidationError = ref('')
const domainValidationError = ref('')

async function fetchGamesList() {
  const url = `https://${levelStore.domain}.en.cx/home?json=1`
  return axios.get(url)
}

function onLevelIdInput(event: globalThis.Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value
  const filtered = raw.replace(/[^0-9]/g, '')
  if (filtered !== raw) {
    levelStore.levelId = filtered
  }
  if (!filtered) {
    levelValidationError.value = 'Поле «ID уровня» должно содержать только цифры'
  } else {
    levelValidationError.value = ''
  }
}

function onDomainInput(event: globalThis.Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value

  // Извлекаем имя домена из любого формата ввода
  const extractedDomain = extractDomainName(raw)

  // Если удалось извлечь домен и он отличается от исходного значения
  if (extractedDomain && extractedDomain !== raw) {
    levelStore.domain = extractedDomain
  }

  // Валидация домена
  if (!extractedDomain) {
    domainValidationError.value = 'Пожалуйста, укажите домен Encounter'
  } else if (!isValidEncounterDomain(extractedDomain)) {
    domainValidationError.value = 'Некорректное имя домена. Используйте латинские буквы, цифры и дефисы'
  } else {
    domainValidationError.value = ''
  }
}

async function onContinue() {
  error.value = ''

  // Режим Проверятор - отдельная логика
  if (checkerStore.mode === 'checker') {
    const url = checkerStore.scenarioUrl.trim()
    if (!url) {
      scenarioUrlError.value = 'Пожалуйста, укажите URL сценария'
      return
    }
    if (!validateScenarioUrl(url)) {
      scenarioUrlError.value = 'Неверный формат URL. Ожидается: https://domain.en.cx/GameScenario.aspx?gid=12345'
      return
    }
    scenarioUrlError.value = ''

    if (!checkerStore.gameType) {
      gameTypeError.value = 'Пожалуйста, выберите тип игры'
      return
    }
    gameTypeError.value = ''

    // Авторизация для доступа к закрытым сценариям
    if (!authStore.isTestMode) {
      const domain = checkerStore.scenarioDomain
      if (domain) {
        await authStore.authenticate(domain)
        if (!authStore.loggedIn) {
          error.value = `Ошибка авторизации: ${authStore.error}`
          return
        }
      }
    }

    router.push('/check')
    return
  }

  // Режим Заливатор - существующая логика без изменений
  const inTestMode = authStore.isTestMode
  if (!inTestMode) {
    // Проверяем валидность домена
    if (!levelStore.domain.trim()) {
      domainValidationError.value = 'Пожалуйста, укажите домен Encounter'
      return
    }
    if (!isValidEncounterDomain(levelStore.domain)) {
      domainValidationError.value = 'Некорректное имя домена. Используйте латинские буквы, цифры и дефисы'
      return
    }
    domainValidationError.value = '' // Очищаем ошибку если валидация прошла

    if (!String(levelStore.gameId).trim()) {
      error.value = 'Пожалуйста, укажите ID игры.'
      return
    }
  }

  if (!String(levelStore.levelId).trim()) {
    levelValidationError.value = 'Поле «ID уровня» должно содержать только цифры'
    return
  }
  if (!/^[0-9]+$/.test(levelStore.levelId)) {
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
      if (!allGames.some((g: Record<string, unknown>) => String(g.GameID) === String(levelStore.gameId))) {
        error.value = 'Игра с указанным ID не найдена на домене.'
        return
      }
    } catch (e: unknown) {
      error.value = `Ошибка при проверке домена/игры: ${e instanceof Error ? e.message : String(e)}`
      return
    }
  }

  if (!inTestMode) {
    await authStore.authenticate(levelStore.domain)
    if (!authStore.loggedIn) {
      error.value = `Ошибка авторизации: ${authStore.error}`
      return
    }
  }

  const { typeId, subtype } = parseSelectionKey(selectedLevelType.value)
  levelStore.initializeLevelType(typeId, subtype, true)

  const path = subtype ? `/${typeId}/${subtype}` : `/${typeId}`
  router.push(path)
}
</script>





