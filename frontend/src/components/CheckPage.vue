<template>
  <div class="min-h-screen flex items-start justify-center bg-surface-50 p-4">
    <div class="w-full max-w-[2000px] flex flex-col gap-4">

      <!-- 1. HEADER (классы из LevelHeader.vue) -->
      <div class="flex max-md:flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 bg-surface-50">
        <!-- Left: Game name + scenario link -->
        <div class="flex items-center flex-wrap gap-x-4 gap-y-2">
          <div class="text-2xl font-semibold text-surface-900">
            {{ checkerStore.gameName || 'Проверка сценария' }}
          </div>
          <a
            v-if="checkerStore.scenarioUrl"
            :href="checkerStore.scenarioUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline text-sm"
            :title="checkerStore.scenarioUrl"
          >
            <i class="pi pi-external-link mr-1"></i>сценарий
          </a>
        </div>
        <!-- Right: Meta info -->
        <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-surface-600">
          <span v-if="gameTypeLabel">
            тип: <strong class="text-surface-900">{{ gameTypeLabel }}</strong>
          </span>
          <span v-if="scenarioDomain">
            домен: <strong class="text-surface-900">{{ scenarioDomain }}</strong>
          </span>
          <span v-if="checkerStore.checkDateTime">
            проверено: <strong class="text-surface-900">{{ formattedCheckDateTime }}</strong>
          </span>
        </div>
      </div>

      <!-- 2. MAIN CARD -->
      <Card>
        <template #content>

          <!-- 2a. DASHBOARD (классы из LevelControlPanel, без collapse) -->
          <div class="rounded-xl bg-violet-50 mb-4 overflow-hidden">
            <div class="grid gap-x-6 gap-y-4 py-4 px-5 grid-cols-2 sm:grid-cols-5">
              <!-- Виджет: Уровней -->
              <div class="text-center">
                <div class="text-3xl font-bold text-violet-900">{{ checkerStore.stats.totalLevels }}</div>
                <div class="text-sm text-violet-700">Уровней</div>
              </div>
              <!-- Виджет: Заполненность (только для Точек) -->
              <div v-if="!isEncounter" class="text-center">
                <div class="text-3xl font-bold text-violet-900">{{ completenessPercent }}%</div>
                <div class="text-sm text-violet-700">Заполненность</div>
              </div>
              <!-- Виджет: Секторов -->
              <div class="text-center">
                <div class="text-3xl font-bold text-violet-900">{{ checkerStore.stats.totalSectors }}</div>
                <div class="text-sm text-violet-700">Секторов</div>
              </div>
              <!-- Виджет: Подсказок -->
              <div class="text-center">
                <div class="text-3xl font-bold text-violet-900">{{ checkerStore.stats.totalHints }}</div>
                <div class="text-sm text-violet-700">Подсказок</div>
              </div>
              <!-- Виджет: Время по апам -->
              <div class="text-center">
                <div class="text-3xl font-bold text-violet-900">{{ totalAutoTransitionTime }}</div>
                <div class="text-sm text-violet-700">Время по апам</div>
              </div>
              <!-- Виджет: Бонусное время (только для Схватки) -->
              <div v-if="isEncounter" class="text-center">
                <div class="text-3xl font-bold text-violet-900">{{ totalBonusTime }}</div>
                <div class="text-sm text-violet-700">Бонусное время</div>
              </div>
            </div>
          </div>

          <!-- 2b. LOADING -->
          <div v-if="checkerStore.isLoading" class="flex flex-col items-center gap-4 py-12">
            <ProgressSpinner />
            <div class="text-lg text-surface-700">
              Анализ сценария... {{ checkerStore.loadingProgress }}%
            </div>
          </div>

          <!-- 2c. ERROR -->
          <Message v-else-if="checkerStore.error" severity="error" :closable="false">
            {{ checkerStore.error }}
          </Message>

          <!-- 2d. TABLE + LEGEND -->
          <template v-else-if="checkerStore.levels.length > 0">
            <div class="check-content">
              <DataTable
                :value="checkerStore.levels"
                scrollable
                :scroll-height="tableScrollHeight"
                :rows="100"
                :paginator="checkerStore.levels.length > 100"
                striped-rows
                responsive-layout="scroll"
                class="p-datatable-sm"
              >
                <Column field="number" header="№" style="width: 50px" />
                <Column header="Название" style="min-width: 200px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.name)"></i>
                      <span v-if="data.name" class="text-sm truncate" :title="data.name">
                        {{ data.name }}
                      </span>
                      <span v-else class="text-sm text-surface-400">Уровень {{ data.number }}</span>
                    </div>
                  </template>
                </Column>
                <Column header="Автопереход" style="min-width: 120px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.autoTransition)"></i>
                      <span v-if="data.autoTransition" class="text-sm truncate" :title="data.autoTransition">
                        {{ data.autoTransition }}
                      </span>
                    </div>
                  </template>
                </Column>
                <Column header="Штраф" style="min-width: 100px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.penalty)"></i>
                      <span v-if="data.penalty" class="text-sm truncate" :title="data.penalty">
                        {{ data.penalty }}
                      </span>
                    </div>
                  </template>
                </Column>
                <Column v-if="!isEncounter" header="Местонахождение" style="min-width: 120px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.codesLocation)"></i>
                      <span v-if="data.codesLocation" class="text-sm truncate max-w-60" :title="data.codesLocation">
                        {{ data.codesLocation }}
                      </span>
                    </div>
                  </template>
                </Column>
                <Column v-if="!isEncounter" header="Тип кодов" style="min-width: 100px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.codesType)"></i>
                      <span v-if="data.codesType" class="text-sm truncate" :title="data.codesType">
                        {{ data.codesType }}
                      </span>
                    </div>
                  </template>
                </Column>
                <Column v-if="!isEncounter" header="Части" style="min-width: 80px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.codesParts)"></i>
                      <span v-if="data.codesParts" class="text-sm">{{ data.codesParts }}</span>
                    </div>
                  </template>
                </Column>
                <Column header="ФО" style="min-width: 100px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.codesFormat)"></i>
                      <span v-if="data.codesFormat" class="text-sm truncate" :title="data.codesFormat">
                        {{ data.codesFormat }}
                      </span>
                    </div>
                  </template>
                </Column>
                <Column header="Подсказки" style="min-width: 100px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.hints)"></i>
                      <span class="text-sm">{{ data.hintsCount }}</span>
                    </div>
                  </template>
                </Column>
                <Column header="Секторы" style="min-width: 100px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <i :class="getStatusIcon(data.checks.sectors)"></i>
                      <span class="text-sm">
                        {{ data.sectorsWithAnswers }}/{{ data.sectorsCount }}
                      </span>
                    </div>
                  </template>
                </Column>
                <Column v-if="isEncounter" header="Бонусы" style="min-width: 100px">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <template v-if="data.bonusCount === 0">
                        <span class="text-surface-400">—</span>
                      </template>
                      <template v-else>
                        <i :class="getStatusIcon(data.checks.bonuses)"></i>
                        <span class="text-sm">{{ data.bonusesWithAnswers }}/{{ data.bonusCount }}</span>
                      </template>
                    </div>
                  </template>
                </Column>
                <Column v-if="isEncounter" header="Бонусное время" style="max-width: 80px">
                  <template #body="{ data }">
                    <span v-if="data.bonusTime" class="text-sm">{{ data.bonusTime }}</span>
                    <span v-else class="text-surface-400">—</span>
                  </template>
                </Column>
              </DataTable>
            </div>

            <!-- Legend -->
            <div class="flex items-center gap-6 text-sm text-surface-600 mt-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle text-green-500"></i>
                <span>Заполнено</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-exclamation-triangle text-yellow-500"></i>
                <span>Предупреждение</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-times-circle text-red-500"></i>
                <span>Не заполнено</span>
              </div>
            </div>
          </template>

          <!-- 2e. EMPTY STATE -->
          <div v-else class="flex flex-col items-center gap-4 py-12 text-surface-500">
            <i class="pi pi-file-excel text-4xl"></i>
            <div>Нет данных для отображения</div>
          </div>

          <!-- 2f. FOOTER (классы из LevelFooter + NavigationButtons/ActionButtons) -->
          <div class="mt-10 gap-x-10 gap-y-5 flex flex-wrap justify-between">
            <!-- Left: Назад -->
            <Button
              icon="pi pi-arrow-left"
              label="Назад"
              severity="secondary"
              text
              class="h-10 px-4 text-nowrap max-xs:w-full"
              @click="goBack"
            />
            <!-- Right: Перепроверить -->
            <Button
              icon="pi pi-refresh"
              label="Перепроверить"
              class="h-10 px-4 text-nowrap max-xs:w-full"
              :loading="checkerStore.isLoading"
              @click="loadScenario"
            />
          </div>

        </template>
      </Card>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import axios from 'axios'
import { useCheckerStore, type CheckStatus, GAME_TYPE_LABELS } from '@/store/checker'
import { parseScenarioHtml } from '@/services/scenario-parser'
import { checkScenarioHtmlForErrors, SCENARIO_USER_ERRORS } from '@/services/scenario-errors'
import { parseTimeToSeconds, formatSecondsToString } from '@/utils/time-parser'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const checkerStore = useCheckerStore()
const { height: windowHeight } = useWindowSize()

/**
 * Высота таблицы (как в LevelContent.vue)
 */
const tableScrollHeight = computed<string>(() => {
  const HEADER_HEIGHT = 70
  const DASHBOARD_HEIGHT = 80
  const FOOTER_HEIGHT = 100
  const PADDINGS = 100
  const MIN_TABLE_HEIGHT = 300

  const totalOffset = HEADER_HEIGHT + DASHBOARD_HEIGHT + FOOTER_HEIGHT + PADDINGS
  const calculatedHeight = windowHeight.value - totalOffset

  return `${Math.max(calculatedHeight, MIN_TABLE_HEIGHT)}px`
})

/**
 * Форматированная дата проверки
 */
const formattedCheckDateTime = computed<string>(() => {
  if (!checkerStore.checkDateTime) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(checkerStore.checkDateTime)
})

/**
 * Извлекает домен из URL сценария (например, "126.en.cx")
 */
const scenarioDomain = computed<string>(() => {
  if (!checkerStore.scenarioUrl) return ''
  const match = checkerStore.scenarioUrl.match(/^https?:\/\/([a-zA-Z0-9-]+\.en\.cx)/)
  return match ? match[1] : ''
})

/**
 * Label типа игры для отображения
 */
const gameTypeLabel = computed<string>(() => {
  if (!checkerStore.gameType) return ''
  return GAME_TYPE_LABELS[checkerStore.gameType]
})

/**
 * Проверка типа игры "Схватка"
 */
const isEncounter = computed<boolean>(() => checkerStore.gameType === 'encounter')

/**
 * Суммарное время по всем автопереходам
 */
const totalAutoTransitionTime = computed<string>(() => {
  const totalSeconds = checkerStore.levels.reduce((sum, level) => {
    return sum + parseTimeToSeconds(level.autoTransition)
  }, 0)
  return formatSecondsToString(totalSeconds)
})

/**
 * Суммарное бонусное время по всем уровням (только для Схватки)
 */
const totalBonusTime = computed<string>(() => {
  const totalSeconds = checkerStore.levels.reduce((sum, level) => {
    return sum + parseTimeToSeconds(level.bonusTime)
  }, 0)
  return formatSecondsToString(totalSeconds)
})

/**
 * Процент заполненности полей по всем уровням
 * Считает поля со статусом 'ok' или 'warning' как заполненные
 * Для "Схватка" - bonuses вместо codesLocation и codesType
 */
const completenessPercent = computed<number>(() => {
  if (checkerStore.levels.length === 0) return 0

  // Разный набор полей для разных типов игры
  // Для Схватки: без codesLocation, codesType, codesParts + добавляем bonuses
  const checkFields: Array<keyof typeof checkerStore.levels[0]['checks']> = isEncounter.value
    ? ['name', 'bonuses', 'codesFormat', 'hints', 'sectors', 'autoTransition', 'penalty']
    : ['name', 'codesLocation', 'codesType', 'codesParts', 'codesFormat', 'hints', 'sectors', 'autoTransition', 'penalty']

  let filledCount = 0
  const totalCount = checkerStore.levels.length * checkFields.length

  for (const level of checkerStore.levels) {
    // Проверка на существование checks
    if (!level.checks) continue

    for (const field of checkFields) {
      const status = level.checks[field]
      if (status === 'ok' || status === 'warning') {
        filledCount++
      }
    }
  }

  // Защита от деления на 0
  return totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0
})

/**
 * Возвращает классы иконки для статуса проверки
 */
function getStatusIcon(status: CheckStatus): string {
  switch (status) {
    case 'ok':
      return 'pi pi-check-circle text-green-500'
    case 'warning':
      return 'pi pi-exclamation-triangle text-yellow-500'
    case 'error':
      return 'pi pi-times-circle text-red-500'
    default:
      return 'pi pi-question-circle text-surface-400'
  }
}

/**
 * Загружает и парсит сценарий
 */
async function loadScenario(): Promise<void> {
  const url = checkerStore.scenarioUrl
  if (!url) {
    checkerStore.setError('URL сценария не указан')
    return
  }

  checkerStore.startLoading()

  try {
    // Этап 1: Загрузка HTML (30%)
    checkerStore.setProgress(10)
    const response = await axios.get('/api/scenario', {
      params: { url },
      withCredentials: true
    })

    checkerStore.setProgress(30)

    // Проверяем что получили HTML
    if (typeof response.data !== 'string') {
      throw new Error(SCENARIO_USER_ERRORS.INVALID_RESPONSE)
    }

    // Проверяем на известные ошибки сервера
    const serverError = checkScenarioHtmlForErrors(response.data)
    if (serverError) {
      throw new Error(serverError)
    }

    // Этап 2: Парсинг (70%)
    checkerStore.setProgress(50)
    const parsed = parseScenarioHtml(response.data)
    checkerStore.setProgress(70)

    // Проверяем результаты парсинга
    if (parsed.levels.length === 0) {
      throw new Error(SCENARIO_USER_ERRORS.NO_LEVELS)
    }

    // Этап 3: Сохранение результатов (100%)
    checkerStore.setProgress(90)
    checkerStore.setGameName(parsed.gameName)
    checkerStore.setLevels(parsed.levels)
    checkerStore.setCheckDateTime(new Date())
  } catch (err: unknown) {
    console.error('[CheckPage] Error loading scenario:', err)

    let errorMessage: string = SCENARIO_USER_ERRORS.LOAD_ERROR
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        errorMessage = SCENARIO_USER_ERRORS.NOT_FOUND
      } else if (err.response?.status === 403) {
        errorMessage = SCENARIO_USER_ERRORS.FORBIDDEN
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      }
    } else if (err instanceof Error) {
      errorMessage = err.message
    }

    checkerStore.setError(errorMessage)
  }
}

/**
 * Возврат на страницу настроек
 */
function goBack(): void {
  checkerStore.clearCheck()
  router.push('/settings')
}

// Загружаем сценарий при монтировании
onMounted(() => {
  if (checkerStore.scenarioUrl && checkerStore.levels.length === 0) {
    loadScenario()
  }
})
</script>

<style scoped>
.check-content {
  width: 100%;
}

.check-content :deep(.p-datatable-tbody > tr) {
  transition: background-color 0.2s ease;
}

.check-content :deep(.p-datatable-tbody > tr:hover) {
  background-color: rgba(99, 102, 241, 0.05) !important;
}

.check-content :deep(.p-datatable-tbody > tr > td) {
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
}

.check-content :deep(.p-datatable-thead > tr > th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--p-surface-0);
  font-weight: 600;
}
</style>
