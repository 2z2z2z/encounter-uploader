<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 py-8">
    <div class="w-full max-w-6xl">
      <Card>
        <template #title>Статистика загрузок</template>
        <template #content>
          <div class="space-y-6">
            <!-- Фильтр по времени -->
            <div class="space-y-1">
              <FloatLabel variant="on">
                <Select
                  id="timePeriod"
                  v-model="selectedPeriod"
                  :options="periodOptions"
                  option-label="label"
                  option-value="value"
                  fluid
                  class="transition-all duration-200"
                  @change="onPeriodChange"
                />
                <label for="timePeriod">Период</label>
              </FloatLabel>
            </div>

            <!-- Сообщение об ошибке -->
            <Message
              v-if="error"
              severity="error"
              :closable="false"
            >
              {{ error }}
            </Message>

            <!-- Загрузка -->
            <div v-if="isLoading" class="flex justify-center py-8">
              <ProgressSpinner />
            </div>

            <!-- Основная статистика -->
            <div v-else-if="stats" class="space-y-6">
              <!-- Уведомление о пустых данных -->
              <Message
                v-if="stats.tasks === 0 && stats.sectors === 0 && stats.bonuses === 0"
                severity="info"
                :closable="false"
              >
                Статистика пуста. Данные появятся после первых загрузок через приложение.
              </Message>

              <!-- Общие метрики -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card class="border border-surface-200">
                  <template #content>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-primary mb-2">{{ stats.tasks }}</div>
                      <div class="text-surface-600">Заданий загружено</div>
                    </div>
                  </template>
                </Card>

                <Card class="border border-surface-200">
                  <template #content>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-primary mb-2">{{ stats.sectors }}</div>
                      <div class="text-surface-600">Секторов загружено</div>
                    </div>
                  </template>
                </Card>

                <Card class="border border-surface-200">
                  <template #content>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-primary mb-2">{{ stats.bonuses }}</div>
                      <div class="text-surface-600">Бонусов загружено</div>
                    </div>
                  </template>
                </Card>

                <Card class="border border-surface-200">
                  <template #content>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-secondary mb-2">{{ stats.uniqueGames }}</div>
                      <div class="text-surface-600">Уникальных игр</div>
                    </div>
                  </template>
                </Card>

                <Card class="border border-surface-200">
                  <template #content>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-secondary mb-2">{{ stats.uniqueUsers }}</div>
                      <div class="text-surface-600">Пользователей</div>
                    </div>
                  </template>
                </Card>

                <Card class="border border-surface-200">
                  <template #content>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-secondary mb-2">{{ stats.uniqueDomains }}</div>
                      <div class="text-surface-600">Доменов</div>
                    </div>
                  </template>
                </Card>
              </div>

              <!-- Общая сводка -->
              <Card>
                <template #title>Сводка по периодам</template>
                <template #content>
                  <DataTable
                    :value="summaryData"
                    striped-rows
                    responsive-layout="scroll"
                  >
                    <Column field="period" header="Период" />
                    <Column field="tasks" header="Задания" />
                    <Column field="sectors" header="Секторы" />
                    <Column field="bonuses" header="Бонусы" />
                    <Column field="uniqueGames" header="Игры" />
                    <Column field="uniqueUsers" header="Пользователи" />
                    <Column field="uniqueDomains" header="Домены" />
                  </DataTable>
                </template>
              </Card>
            </div>

            <!-- Метаинформация -->
            <Card v-if="rawStats?.meta" class="bg-surface-100">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-info-circle text-primary"></i>
                  Информация о данных
                </div>
              </template>
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-database text-blue-500"></i>
                    <span><strong>Всего записей:</strong> {{ rawStats.meta.totalRecords }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-refresh text-green-500"></i>
                    <span><strong>Последнее обновление:</strong> {{ formatDateTime(rawStats.meta.lastUpdate) }}</span>
                  </div>
                  <div v-if="rawStats.meta.oldestRecord" class="flex items-center gap-2">
                    <i class="pi pi-calendar text-orange-500"></i>
                    <span><strong>Первая запись:</strong> {{ formatDateTime(rawStats.meta.oldestRecord) }}</span>
                  </div>
                  <div v-if="rawStats.meta.newestRecord" class="flex items-center gap-2">
                    <i class="pi pi-clock text-purple-500"></i>
                    <span><strong>Последняя активность:</strong> {{ formatDateTime(rawStats.meta.newestRecord) }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Детализация по доменам -->
            <Card v-if="rawStats?.breakdown?.domains && rawStats.breakdown.domains.length > 0">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-globe text-blue-500"></i>
                  Статистика по доменам
                </div>
              </template>
              <template #content>
                <DataTable
                  :value="rawStats.breakdown.domains"
                  striped-rows
                  responsive-layout="scroll"
                  :rows="10"
                  :paginator="rawStats.breakdown.domains.length > 10"
                >
                  <Column field="domain" header="Домен" sortable />
                  <Column field="tasks" header="Задания" sortable />
                  <Column field="sectors" header="Секторы" sortable />
                  <Column field="bonuses" header="Бонусы" sortable />
                  <Column field="uniqueGames" header="Игр" sortable />
                  <Column field="gameIds" header="ID игр">
                    <template #body="{ data }">
                      <div class="max-w-xs truncate" :title="data.gameIds.join(', ')">
                        {{ data.gameIds.slice(0, 3).join(', ') }}
                        <span v-if="data.gameIds.length > 3" class="text-surface-500">
                          и ещё {{ data.gameIds.length - 3 }}
                        </span>
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>

            <!-- Детализация по играм -->
            <Card v-if="rawStats?.breakdown?.games && rawStats.breakdown.games.length > 0">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-gamepad-2 text-green-500"></i>
                  Топ активных игр
                </div>
              </template>
              <template #content>
                <DataTable
                  :value="topGames"
                  striped-rows
                  responsive-layout="scroll"
                  :rows="15"
                  :paginator="topGames.length > 15"
                >
                  <Column field="domain" header="Домен" sortable />
                  <Column field="gameId" header="ID игры" sortable />
                  <Column field="tasks" header="Задания" sortable />
                  <Column field="sectors" header="Секторы" sortable />
                  <Column field="bonuses" header="Бонусы" sortable />
                  <Column field="total" header="Всего" sortable />
                </DataTable>
              </template>
            </Card>

            <!-- Дебаг: показать что rawStats содержит мета -->
            <div v-if="!rawStats?.meta && rawStats" class="text-sm text-surface-500">
              Отладка: rawStats есть, но meta нет. Ключи: {{ Object.keys(rawStats) }}
            </div>

            <!-- Кнопка обновления -->
            <div class="flex justify-center">
              <Button
                label="Обновить статистику"
                icon="pi pi-refresh"
                :loading="isLoading"
                @click="fetchStats"
                class="transition-all duration-200"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// PrimeVue components
import Card from 'primevue/card'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FloatLabel from 'primevue/floatlabel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

interface StatsData {
  tasks: number
  sectors: number
  bonuses: number
  uniqueGames: number
  uniqueUsers: number
  uniqueDomains: number
}

interface DomainStats {
  domain: string
  tasks: number
  sectors: number
  bonuses: number
  uniqueGames: number
  gameIds: string[]
}

interface GameStats {
  domain: string
  gameId: string
  tasks: number
  sectors: number
  bonuses: number
}

interface ApiStatsResponse {
  allTime: StatsData
  month: StatsData
  week: StatsData
  day: StatsData
  meta?: {
    lastUpdate: string
    totalRecords: number
    oldestRecord: string | null
    newestRecord: string | null
  }
  breakdown?: {
    domains: DomainStats[]
    games: GameStats[]
  }
}

const isLoading = ref(false)
const error = ref('')
const rawStats = ref<ApiStatsResponse | null>(null)
const selectedPeriod = ref('allTime')

const periodOptions = [
  { label: 'За все время', value: 'allTime' },
  { label: 'За месяц', value: 'month' },
  { label: 'За неделю', value: 'week' },
  { label: 'За день', value: 'day' }
]

const stats = computed(() => {
  if (!rawStats.value) return null

  const periodData = rawStats.value[selectedPeriod.value as keyof ApiStatsResponse]
  if (!periodData || typeof periodData !== 'object') return null

  // Type guard для проверки что это StatsData
  const isStatsData = (data: unknown): data is StatsData => {
    return typeof data === 'object' && data !== null &&
           'tasks' in data && 'sectors' in data && 'bonuses' in data
  }

  if (!isStatsData(periodData)) return null

  // Дополнительная защита от некорректных значений на клиенте
  return {
    tasks: Math.max(0, Number(periodData.tasks) || 0),
    sectors: Math.max(0, Number(periodData.sectors) || 0),
    bonuses: Math.max(0, Number(periodData.bonuses) || 0),
    uniqueGames: Math.max(0, Number(periodData.uniqueGames) || 0),
    uniqueUsers: Math.max(0, Number(periodData.uniqueUsers) || 0),
    uniqueDomains: Math.max(0, Number(periodData.uniqueDomains) || 0)
  }
})

const summaryData = computed(() => {
  if (!rawStats.value) return []

  // Функция для безопасного извлечения числовых значений
  const safeNumber = (value: unknown): number => {
    if (typeof value === 'number' && !isNaN(value)) return Math.max(0, value)
    return 0
  }

  // Функция для безопасного извлечения данных периода
  const safePeriodData = (periodData: unknown) => {
    if (!periodData || typeof periodData !== 'object') {
      return { tasks: 0, sectors: 0, bonuses: 0, uniqueGames: 0, uniqueUsers: 0, uniqueDomains: 0 }
    }
    const data = periodData as Record<string, unknown>
    return {
      tasks: safeNumber(data.tasks),
      sectors: safeNumber(data.sectors),
      bonuses: safeNumber(data.bonuses),
      uniqueGames: safeNumber(data.uniqueGames),
      uniqueUsers: safeNumber(data.uniqueUsers),
      uniqueDomains: safeNumber(data.uniqueDomains)
    }
  }

  const allTime = safePeriodData(rawStats.value.allTime)
  const month = safePeriodData(rawStats.value.month)
  const week = safePeriodData(rawStats.value.week)
  const day = safePeriodData(rawStats.value.day)

  return [
    {
      period: 'За все время',
      ...allTime
    },
    {
      period: 'За месяц',
      ...month
    },
    {
      period: 'За неделю',
      ...week
    },
    {
      period: 'За день',
      ...day
    }
  ]
})

const topGames = computed(() => {
  if (!rawStats.value?.breakdown?.games) return []

  return rawStats.value.breakdown.games
    .map(game => ({
      ...game,
      total: game.tasks + game.sectors + game.bonuses
    }))
    .sort((a, b) => b.total - a.total)
})

async function fetchStats(): Promise<void> {
  isLoading.value = true
  error.value = ''

  try {
    const response = await axios.get('/api/stats', { withCredentials: true })
    rawStats.value = response.data
    console.log('[StatsPage] Statistics loaded:', rawStats.value)
  } catch (err: unknown) {
    console.error('[StatsPage] Error loading statistics:', err)
    const message = err instanceof Error ? err.message : String(err)
    error.value = `Ошибка загрузки статистики: ${message}`
  } finally {
    isLoading.value = false
  }
}

function onPeriodChange(): void {
  // Статистика уже загружена, просто переключаем отображение
  console.log('[StatsPage] Period changed to:', selectedPeriod.value)
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Неверная дата'

    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.warn('[StatsPage] Error formatting date:', dateString, error)
    return 'Ошибка даты'
  }
}

onMounted(() => {
  fetchStats()
})
</script>