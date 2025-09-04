<template>
  <div>
    <LevelUploadLayout title="100500 секторов и бонусов"
      :showTitle="true"
      :showPreview="false"
      :containerClass="'container max-w-[120rem] mx-auto bg-white p-12 rounded-md shadow-sm'"
      :showMeta="true"
      :showBack="true"
      :showCommonActions="true"
      @back="$router.push('/settings')"
      @clear="onClear" @export="() => (showExport = true)" @importChange="importData">
      <template #controls>
        <!-- Tabs -->
        <div class="flex flex-wrap items-center gap-2 mt-0 mb-6 w-full">
          <button
            v-for="(_, idx) in tabs"
            :key="idx"
            @click="activeTab = idx"
            :class="activeTab === idx ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'"
            class="px-4 py-2 rounded-md min-w-[100px]"
          >
            Блок {{ idx + 1 }}
          </button>
          <button @click="addTab" class="px-4 py-2 rounded-md bg-green-500 text-white">+</button>
          <button v-if="tabs.length > 1" @click="removeCurrentTab" class="px-4 py-2 rounded-md bg-red-500 text-white">-</button>
        </div>

        <!-- Controls (2 rows) -->
        <div v-if="currentTab" class="flex flex-col gap-4 w-full">
          <div class="flex flex-wrap items-end gap-4">
            <div class="flex-1 min-w-[200px]" v-if="hasControl('sectorPattern')">
              <label class="form-label">Название секторов</label>
              <input v-model="currentTab.sectorPattern" placeholder="Текст или &" class="form-input h-10 w-full" />
            </div>
            <div class="flex-1 min-w-[200px]" v-if="hasControl('bonusPattern')">
              <label class="form-label">Название бонусов</label>
              <input v-model="currentTab.bonusPattern" placeholder="Текст или &" class="form-input h-10 w-full" />
            </div>
            <div v-if="hasControl('quickBonusTime')">
              <label class="form-label">Бонусное время (ч, м, с)</label>
              <div class="flex items-center gap-2">
                <input type="number" min="0" v-model.number="currentTab.quickTime.hours" placeholder="ч" class="form-input h-10 w-16 text-center" />
                <input type="number" min="0" v-model.number="currentTab.quickTime.minutes" placeholder="м" class="form-input h-10 w-16 text-center" />
                <input type="number" min="0" v-model.number="currentTab.quickTime.seconds" placeholder="с" class="form-input h-10 w-16 text-center" />
                <label class="flex items-center gap-1 ml-2">
                  <input type="checkbox" v-model="currentTab.quickTime.negative" class="cursor-pointer" />
                  <span class="text-gray-500">–</span>
                </label>
              </div>
            </div>
            <div v-if="hasControl('quickDelay')">
              <label class="form-label">Задержка (ч, м, с)</label>
              <div class="flex items-center gap-2">
                <input type="number" min="0" v-model.number="quickDelayHours" placeholder="ч" class="form-input h-10 w-16 text-center" />
                <input type="number" min="0" v-model.number="quickDelayMinutes" placeholder="м" class="form-input h-10 w-16 text-center" />
                <input type="number" min="0" v-model.number="quickDelaySeconds" placeholder="с" class="form-input h-10 w-16 text-center" />
              </div>
            </div>
            <div v-if="hasControl('quickRelativeLimit')">
              <label class="form-label">Ограничение (ч, м, с)</label>
              <div class="flex items-center gap-2">
                <input type="number" min="0" v-model.number="quickRelativeLimitHours" placeholder="ч" class="form-input h-10 w-16 text-center" />
                <input type="number" min="0" v-model.number="quickRelativeLimitMinutes" placeholder="м" class="form-input h-10 w-16 text-center" />
                <input type="number" min="0" v-model.number="quickRelativeLimitSeconds" placeholder="с" class="form-input h-10 w-16 text-center" />
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-end gap-4">
            <div class="flex-1 min-w-[200px]" v-if="hasControl('bonusTaskPattern')">
              <label class="form-label">Бонусные задания</label>
              <textarea v-model="currentTab.bonusTaskPattern" placeholder="Текст или код" class="form-input w-full textarea-collapsible-lg"></textarea>
            </div>
            <div class="flex-1 min-w-[200px]" v-if="hasControl('bonusHintPattern')">
              <label class="form-label">Подсказки (по факту выполнения)</label>
              <textarea v-model="currentTab.bonusHintPattern" placeholder="Текст или код" class="form-input w-full textarea-collapsible-lg"></textarea>
            </div>
            <button v-if="hasControl('levelsModal')" @click="openLevelsModal('bulk')" type="button" class="form-button h-10 px-4">Уровни бонусов</button>
            <button @click="showCodes = true" type="button" class="form-button h-10 px-4">Добавить коды</button>
          </div>
        </div>
      </template>

      <template #table>
        <!-- Table -->
        <div v-if="currentTab" class="overflow-x-auto">
          <table class="min-w-full table-fixed border-collapse text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="p-2 text-left w-8">#</th>
                <th class="p-2 text-left w-1/3">Ответ</th>
                <th class="p-2 text-center">Сектор</th>
                <th class="p-2 text-center">Бонус</th>
                <th class="p-2 text-left w-40">Уровни бонуса</th>
                <th class="p-2 text-left w-20">Бонусное время</th>
                <th class="p-2 text-left w-20">Задержка</th>
                <th class="p-2 text-left w-20">Ограничение</th>
                <th class="p-2 text-left">Название сектора</th>
                <th class="p-2 text-left">Название бонуса</th>
                <th class="p-2 text-left w-72">Бонусное задание</th>
                <th class="p-2 text-left w-72">Подсказка</th>
                <th class="p-2 w-6"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in currentTab.rows" :key="row.number" class="border-t border-gray-200">
                <td class="p-2">{{ row.number }}</td>
                <td class="p-2">
                  <div class="flex flex-col gap-1">
                    <div
                      v-for="(_, idx) in row.variants"
                      :key="idx"
                      class="flex items-center gap-1"
                    >
                      <input
                        v-model="row.variants[idx]"
                        placeholder="код"
                        class="form-input h-8 min-w-[150px] flex-1"
                      />
                      <button
                        v-if="idx === row.variants.length - 1 && idx < 9"
                        @click="addVariant(row)"
                        type="button"
                        class="h-8 w-8 rounded-md bg-green-500 text-white cursor-pointer"
                      >
                        ＋
                      </button>
                      <button
                        v-if="idx > 0"
                        @click="removeVariant(row, idx)"
                        type="button"
                        class="h-8 w-8 rounded-md bg-red-500 text-white cursor-pointer"
                      >
                        −
                      </button>
                    </div>
                  </div>
                </td>
                <td class="p-2 text-center">
                  <input type="checkbox" v-model="row.inSector" class="cursor-pointer" />
                </td>
                <td class="p-2 text-center">
                  <div class="inline-flex items-center gap-2">
                    <input type="checkbox" v-model="row.inBonus" class="cursor-pointer" />
                    <button
                      type="button"
                      class="text-blue-600 hover:underline"
                      @click="openLevelsModal('row', row)"
                    >уровни</button>
                  </div>
                </td>
                <td class="p-2 min-w-[120px]">
                  <div class="text-gray-700">
                    <template v-if="row.allLevels">все уровни</template>
                    <template v-else-if="rowSelectedLevelsDisplay(row).length">
                      {{ rowSelectedLevelsShortStr(row) }}
                    </template>
                    <template v-else>—</template>
                  </div>
                </td>
                <td class="p-2">
                  <div class="flex items-center gap-1">
                    <input type="number" min="0" v-model.number="row.bonusTime.hours" placeholder="ч" class="no-spin form-input h-8 w-10 px-1 text-center" />
                    <input type="number" min="0" v-model.number="row.bonusTime.minutes" placeholder="м" class="no-spin form-input h-8 w-10 px-1 text-center" />
                    <input type="number" min="0" v-model.number="row.bonusTime.seconds" placeholder="с" class="no-spin form-input h-8 w-10 px-1 text-center" />
                    <label class="flex items-center gap-1 ml-2">
                      <input type="checkbox" v-model="row.bonusTime.negative" class="cursor-pointer" />
                      <span class="text-gray-500">–</span>
                    </label>
                  </div>
                </td>
                <td class="p-2">
                  <div class="flex items-center gap-1">
                    <input type="number" min="0" v-model.number="row.delay.hours" placeholder="ч" class="no-spin form-input h-8 w-10 px-1 text-center" />
                    <input type="number" min="0" v-model.number="row.delay.minutes" placeholder="м" class="no-spin form-input h-8 w-10 px-1 text-center" />
                    <input type="number" min="0" v-model.number="row.delay.seconds" placeholder="с" class="no-spin form-input h-8 w-10 px-1 text-center" />
                  </div>
                </td>
                <td class="p-2">
                  <div class="flex items-center gap-1">
                    <input type="number" min="0" v-model.number="row.relativeLimit.hours" placeholder="ч" class="no-spin form-input h-8 w-10 px-1 text-center" />
                    <input type="number" min="0" v-model.number="row.relativeLimit.minutes" placeholder="м" class="no-spin form-input h-8 w-10 px-1 text-center" />
                    <input type="number" min="0" v-model.number="row.relativeLimit.seconds" placeholder="с" class="no-spin form-input h-8 w-10 px-1 text-center" />
                  </div>
                </td>
                <td class="p-2">
                  <input v-model="row.sectorName" class="form-input h-8 w-full min-w-[150px]" placeholder="Название сектора" />
                </td>
                <td class="p-2">
                  <input v-model="row.bonusName" class="form-input h-8 w-full min-w-[150px]" placeholder="Название бонуса" />
                </td>
                <td class="p-2">
                  <textarea v-model="row.bonusTask" class="form-input py-1 w-full min-w-[190px] textarea-collapsible" placeholder="HTML/текст бонусного задания"></textarea>
                </td>
                <td class="p-2">
                  <textarea v-model="row.bonusHint" class="form-input py-1 w-full min-w-[190px] textarea-collapsible" placeholder="HTML/текст подсказки"></textarea>
                </td>
                <td class="p-2 text-right align-top">
                  <button
                    type="button"
                    @click="removeRow(row)"
                    class="h-6 w-6 leading-none text-gray-400 hover:text-red-600"
                    title="Удалить ответ"
                  >✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template #rightActions>
        <label v-if="combineSectorsAvailable" class="flex items-center gap-1">
          <input type="checkbox" v-model="combineSectors" class="cursor-pointer" />
          <span>Объединить сектора (БМП)</span>
        </label>
        <button @click="onSendSectors" type="button" class="form-button h-10 px-4">Залить секторы</button>
        <button @click="onSendBonuses" type="button" class="form-button h-10 px-4">Залить бонусы</button>
      </template>
    </LevelUploadLayout>

    <!-- Levels select modal -->
    <transition name="fade">
      <div v-if="showLevels" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-md w-[90%] max-w-2xl space-y-4 relative">
          <button
            @click="closeLevelsModal()"
            type="button"
            class="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer"
          >✕</button>
          <h3 class="text-lg font-medium">Доступность бонуса</h3>
          <div class="flex items-center gap-6 text-sm">
            <label class="inline-flex items-center gap-2">
              <input type="radio" value="all" v-model="levelsModeRadio" class="cursor-pointer" />
              <span>На всех уровнях</span>
            </label>
            <label class="inline-flex items-center gap-2">
              <input type="radio" value="custom" v-model="levelsModeRadio" class="cursor-pointer" />
              <span>На указанных уровнях:</span>
            </label>
          </div>
          <div class="max-h-80 overflow-auto">
            <div v-if="loadingLevels" class="text-sm text-gray-500">Загрузка…</div>
            <div v-else class="border border-gray-200/50 rounded p-2" v-show="levelsModeRadio === 'custom'">
              <div class="grid gap-1" style="grid-template-columns: repeat(20, minmax(0, 1fr));">
                <label v-for="lvl in availableLevels" :key="lvl.label" class="flex flex-col items-center gap-0 text-xs">
                  <input
                    type="checkbox"
                    class="cursor-pointer"
                    :value="lvl.label"
                    v-model="selectedLevelLabels"
                  />
                  <span class="leading-tight mt-0.5">{{ lvl.label }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button @click="toggleSelectAll" type="button" class="form-button h-10 px-4" :disabled="levelsModeRadio !== 'custom'">Отметить все</button>
              <button @click="refreshLevels" type="button" class="form-button h-10 px-4">Обновить</button>
            </div>
            <div class="flex items-center gap-2">
              <button @click="applyLevels" class="form-button h-10 px-4">Применить</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Add codes modal -->
    <transition name="fade">
      <div v-if="showCodes" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-md w-[90%] max-w-2xl space-y-4 relative">
          <button
            @click="showCodes = false"
            type="button"
            class="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer"
          >✕</button>
          <textarea v-model="codesText" class="form-input h-40 w-full" placeholder="Каждый код с новой строки"></textarea>
          <p class="text-sm text-right text-gray-500">{{ codesCount }} кодов</p>
          <div class="flex flex-col sm:flex-row sm:items-end mt-4 gap-4">
            <div class="flex flex-1 w-full sm:w-auto items-stretch gap-0">
              <select
                v-model.number="genDigits"
                class="form-select h-10 w-24 sm:w-30 rounded-r-none mb-0 border border-gray-200"
              >
                <option v-for="n in 9" :key="n" :value="n + 1">{{ n + 1 }} знак.</option>
              </select>
              <div class="relative">
                <div class="absolute inset-y-0 end-0 flex items-center pe-5 pointer-events-none">
                  <label class="w-4 h-6 text-gray-500 dark:text-gray-400">шт.</label>
                </div>
                <input
                  type="number"
                  min="1"
                  v-model.number="genCount"
                  class="form-input h-10 flex-1 w-full bg-white rounded-none mb-0 border border-gray-200"
                  placeholder="количество"
                />
              </div>
              <button
                @click="generateCodes(genDigits)"
                type="button"
                class="form-button h-10 px-4 rounded-l-none whitespace-nowrap"
              >
                Сгенерить
              </button>
            </div>
            <div class="flex gap-2 self-end sm:self-auto">
              <button @click="codesText = ''" class="form-button bg-red-500 h-10 px-4">Очистить</button>
              <button @click="applyCodes" class="form-button h-10 px-4">Готово</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Export format modal -->
    <transition name="fade">
      <div v-if="showExport" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-md w-[90%] max-w-sm space-y-4 relative">
          <button @click="showExport = false" type="button" class="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer">✕</button>
          <h3 class="text-lg font-medium">Экспортировать как…</h3>
          <div class="flex gap-2 justify-end">
            <button @click="exportDataAs('json')" class="form-button h-10 px-4">JSON</button>
            <button @click="exportDataAs('csv')" class="form-button h-10 px-4">CSV</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useUploadStore } from '../../../store'
import { useAuthStore } from '../../../store/auth'
import { useProgressStore } from '../../../store/progress'
import { sendSector, sendBonuses, fetchBonusLevels, type Answer } from '../../../services/uploader'
import { startUploadVisibilityTracking, stopUploadVisibilityTracking, showCompletionNotification } from '../../../utils/visibility'
import { useNotification } from '../../../composables/useNotification'
import { useConfirm } from 'primevue/useconfirm'
import { serializeCsv, parseCsv, downloadBlob } from '../../../utils/csv'
import { getTypeConfig } from '../../level-system/registry/types'
import type { ControlId } from '../../level-system/registry/schema'
import LevelUploadLayout from '../../LevelUploadLayout.vue'

const store = useUploadStore()
const authStore = useAuthStore()
const progress = useProgressStore()
const notify = useNotification()
const confirm = useConfirm()

  interface Row {
  number: number
    variants: string[]
  bonusTime: { hours: number; minutes: number; seconds: number; negative: boolean }
  delay: { hours: number; minutes: number; seconds: number }
  relativeLimit: { hours: number; minutes: number; seconds: number }
  sectorName: string
  bonusName: string
  bonusTask?: string
  bonusHint?: string
  inSector: boolean
  inBonus: boolean
  /** Дополнительные уровни для бонуса (к базовому уровню из настроек). */
  targetLevels?: string[]
  /** Если true — бонус на всех уровнях. */
  allLevels?: boolean
}
interface TabData {
  sectorPattern: string
  bonusPattern: string
  bonusTaskPattern?: string
  bonusHintPattern?: string
  quickTime: { hours: number; minutes: number; seconds: number; negative: boolean }
  /** Массовая задержка для текущего блока (не сохраняется между перезагрузками) */
  quickDelay?: { hours: number; minutes: number; seconds: number }
  /** Массовое ограничение для текущего блока (не сохраняется между перезагрузками) */
  quickRelativeLimit?: { hours: number; minutes: number; seconds: number }
  rows: Row[]
}

const storageKey = 'type100500-tabs'
const tabs = ref<TabData[]>([createTab()])
const activeTab = ref(0)
const showCodes = ref(false)
const codesText = ref('')
const codesCount = computed(() =>
  codesText.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l).length
)
const genCount = ref(1)
const genDigits = ref(4)
const combineSectors = ref(false)
const showExport = ref(false)
// Конфиг типа управляет наличием чекбокса БМП
const typeCfg = computed(() => getTypeConfig(store.uploadType))
const combineSectorsAvailable = computed(() => !!typeCfg.value?.buttons?.combineSectorsAvailable)
function hasControl(id: ControlId) {
  const cfg = typeCfg.value
  return !!cfg?.controls?.includes(id)
}

// Локальные контролы для массового заполнения задержки/ограничения (не сохраняются)
const quickDelayHours = ref<number>(0)
const quickDelayMinutes = ref<number>(0)
const quickDelaySeconds = ref<number>(0)
const quickRelativeLimitHours = ref<number>(0)
const quickRelativeLimitMinutes = ref<number>(0)
const quickRelativeLimitSeconds = ref<number>(0)

// Levels selection state
const showLevels = ref(false)
const levelsMode = ref<'row' | 'bulk'>('row')
const levelsRow = ref<Row | null>(null)
const availableLevels = ref<Array<{ label: string; name: string }>>([])
const loadingLevels = ref(false)
const selectedLevelLabels = ref<string[]>([])
const levelsModeRadio = ref<'all' | 'custom'>('custom')

function rowSelectedLevelsDisplay(row: Row): string[] {
  // Для отображения в таблице: текущий базовый уровень + дополнительные
  const base = String(store.levelId || '').trim()
  const extra = Array.isArray(row.targetLevels) ? row.targetLevels : []
  const set = new Set<string>()
  if (base) set.add(base)
  for (const l of extra) if (l) set.add(String(l))
  return Array.from(set)
}

function rowSelectedLevelsShortStr(row: Row): string {
  const arr = rowSelectedLevelsDisplay(row)
  if (arr.length <= 5) return arr.join(', ')
  return arr.slice(0, 5).join(', ') + ', …'
}

async function ensureLevelsLoaded() {
  if (availableLevels.value.length) return
  await refreshLevels()
}

async function refreshLevels() {
  try {
    loadingLevels.value = true
    const list = await fetchBonusLevels(store.domain, store.gameId, store.levelId)
    availableLevels.value = list
  } catch (e: any) {
    notify.error('Не удалось загрузить список уровней', e.message || String(e))
  } finally {
    loadingLevels.value = false
  }
}

function openLevelsModal(mode: 'row' | 'bulk', row?: Row) {
  levelsMode.value = mode
  levelsRow.value = mode === 'row' ? (row || null) : null
  // Начальное состояние — выбран только текущий уровень из настроек
  const base = String(store.levelId || '').trim()
  let preselected: string[] = base ? [base] : []
  levelsModeRadio.value = 'custom'
  if (mode === 'row' && row) {
    const extras = Array.isArray(row.targetLevels) ? row.targetLevels : []
    preselected = Array.from(new Set([...
      preselected,
      ...extras.map((x) => String(x))
    ]))
    levelsModeRadio.value = row.allLevels ? 'all' : 'custom'
  }
  selectedLevelLabels.value = preselected
  showLevels.value = true
  ensureLevelsLoaded()
}

function closeLevelsModal() {
  showLevels.value = false
}

function applyLevels() {
  // Сохраняем только дополнительные уровни (без базового)
  const base = String(store.levelId || '').trim()
  const extras = selectedLevelLabels.value.filter((l) => l && l !== base)
  if (levelsMode.value === 'row' && levelsRow.value) {
    levelsRow.value.targetLevels = extras
    levelsRow.value.allLevels = levelsModeRadio.value === 'all'
  } else if (levelsMode.value === 'bulk' && currentTab.value) {
    for (const r of currentTab.value.rows) {
      r.targetLevels = extras.slice()
      r.allLevels = levelsModeRadio.value === 'all'
    }
  }
  closeLevelsModal()
}

function toggleSelectAll() {
  if (!availableLevels.value.length) return
  if (selectedLevelLabels.value.length === availableLevels.value.length) {
    selectedLevelLabels.value = []
  } else {
    selectedLevelLabels.value = availableLevels.value.map((l) => l.label)
  }
}

function createTab(): TabData {
  return {
    sectorPattern: '',
    bonusPattern: '',
    bonusTaskPattern: '',
    bonusHintPattern: '',
    quickTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
    quickDelay: { hours: 0, minutes: 0, seconds: 0 },
    quickRelativeLimit: { hours: 0, minutes: 0, seconds: 0 },
    rows: [],
  }
}

function addTab() {
  tabs.value.push(createTab())
  activeTab.value = tabs.value.length - 1
}

function removeCurrentTab() {
  if (tabs.value.length <= 1) return
  tabs.value.splice(activeTab.value, 1)
  if (activeTab.value >= tabs.value.length) {
    activeTab.value = tabs.value.length - 1
  }
}

const currentTab = computed(() => tabs.value[activeTab.value])

onMounted(() => {
  const raw = localStorage.getItem(storageKey)
  if (raw) {
    try {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        tabs.value = arr.map((t: any) => ({ ...createTab(), rows: (t.rows || []).map((r: any) => ({
            number: r.number,
            // миграция: старое поле answer → variants
            variants: Array.isArray(r.variants)
              ? r.variants
              : [typeof r.answer === 'string' ? r.answer : ''],
            bonusTime: r.bonusTime || { hours: 0, minutes: 0, seconds: 0, negative: false },
            delay: r.delay || { hours: 0, minutes: 0, seconds: 0 },
            relativeLimit: r.relativeLimit || { hours: 0, minutes: 0, seconds: 0 },
            sectorName: r.sectorName || '',
            bonusName: r.bonusName || '',
            bonusTask: typeof r.bonusTask === 'string' ? r.bonusTask : '',
            bonusHint: typeof r.bonusHint === 'string' ? r.bonusHint : '',
            inSector: r.inSector !== false,
            inBonus: r.inBonus !== false,
            targetLevels: Array.isArray(r.targetLevels) ? r.targetLevels : [],
            allLevels: !!r.allLevels,
          })) }))
      } else {
        tabs.value = [createTab()]
      }
    } catch {
      tabs.value = [createTab()]
    }
  }

  watch(
    tabs,
    (val) => {
      const plain = val.map((t) => ({ rows: t.rows }))
      localStorage.setItem(storageKey, JSON.stringify(plain))
    },
    { deep: true }
  )

  watch(
    [() => currentTab.value?.sectorPattern, () => activeTab.value],
    ([val, tabIdx], [old, oldTabIdx]) => {
      if (tabIdx !== oldTabIdx) return
      if (val === old) return
      const t = tabs.value[tabIdx]
      if (!t || val === undefined) return
      t.rows.forEach((r, idx) => {
        r.sectorName = val.replace(/&/g, String(idx + 1))
      })
    }
  )

  watch(
    [() => currentTab.value?.bonusPattern, () => activeTab.value],
    ([val, tabIdx], [old, oldTabIdx]) => {
      if (tabIdx !== oldTabIdx) return
      if (val === old) return
      const t = tabs.value[tabIdx]
      if (!t || val === undefined) return
      t.rows.forEach((r, idx) => {
        r.bonusName = val.replace(/&/g, String(idx + 1))
      })
    }
  )

  // Массовая подстановка «Бонусных заданий» по шаблону
  watch(
    [() => currentTab.value?.bonusTaskPattern, () => activeTab.value],
    ([val, tabIdx], [old, oldTabIdx]) => {
      if (tabIdx !== oldTabIdx) return
      if (val === old) return
      const t = tabs.value[tabIdx]
      if (!t || val === undefined) return
      t.rows.forEach((r, idx) => {
        r.bonusTask = (val || '').replace(/&/g, String(idx + 1))
      })
    }
  )

  // Массовая подстановка «Подсказок» по шаблону
  watch(
    [() => currentTab.value?.bonusHintPattern, () => activeTab.value],
    ([val, tabIdx], [old, oldTabIdx]) => {
      if (tabIdx !== oldTabIdx) return
      if (val === old) return
      const t = tabs.value[tabIdx]
      if (!t || val === undefined) return
      t.rows.forEach((r, idx) => {
        r.bonusHint = (val || '').replace(/&/g, String(idx + 1))
      })
    }
  )

  watch(
    [() => (currentTab.value?.quickTime ? { ...currentTab.value.quickTime } : undefined), () => activeTab.value],
    ([qt, tabIdx], [old, oldTabIdx]) => {
      if (tabIdx !== oldTabIdx) return
      if (!qt || JSON.stringify(qt) === JSON.stringify(old)) return
      const t = tabs.value[tabIdx]
      if (!t) return
      t.rows.forEach((r) => (r.bonusTime = { ...qt }))
    },
    { deep: true }
  )
  // Массовая подстановка «Задержка» и «Ограничение» по контролам блока
  watch([quickDelayHours, quickDelayMinutes, quickDelaySeconds, () => activeTab.value], () => {
    const t = currentTab.value
    if (!t) return
    const it = { hours: Number(quickDelayHours.value) || 0, minutes: Number(quickDelayMinutes.value) || 0, seconds: Number(quickDelaySeconds.value) || 0 }
    t.rows.forEach((r) => (r.delay = { ...it }))
  })
  watch([quickRelativeLimitHours, quickRelativeLimitMinutes, quickRelativeLimitSeconds, () => activeTab.value], () => {
    const t = currentTab.value
    if (!t) return
    const it = { hours: Number(quickRelativeLimitHours.value) || 0, minutes: Number(quickRelativeLimitMinutes.value) || 0, seconds: Number(quickRelativeLimitSeconds.value) || 0 }
    t.rows.forEach((r) => (r.relativeLimit = { ...it }))
  })
  // Загрузим список уровней один раз при открытии страницы
  ensureLevelsLoaded()
})

function generateRandomCode(len: number, used: Set<string>): string {
  while (true) {
    let code = ''
    while (code.length < len) {
      const d = Math.floor(Math.random() * 10).toString()
      if (code.length >= 2 && code[code.length - 1] === d && code[code.length - 2] === d) {
        continue
      }
      code += d
    }
    if (!used.has(code)) {
      used.add(code)
      return code
    }
  }
}

function generateCodes(len: number) {
  if (len < 2 || len > 10) {
    notify.warn('Некорректное количество знаков', 'Количество знаков должно быть от 2 до 10')
    return
  }

  const existing = new Set<string>()
  tabs.value.forEach((t) => t.rows.forEach((r) => {
    (Array.isArray(r.variants) ? r.variants : []).forEach((v) => existing.add((v || '').trim()))
  }))
  codesText.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
    .forEach((c) => existing.add(c))

  const max = Math.pow(10, len)
  const available = max - existing.size
  if (genCount.value > available) {
    notify.warn('Невозможно сгенерировать коды', `Невозможно сгенерировать ${genCount.value} уникальных кодов. Доступно только ${available}.`)
    return
  }

  const arr: string[] = []
  for (let i = 0; i < genCount.value; i++) {
    arr.push(generateRandomCode(len, existing))
  }
  codesText.value = arr.join('\n')
}

function applyCodes() {
  const t = currentTab.value
  if (!t) return
  const lines = codesText.value.split(/\r?\n/).map((l) => l.trim()).filter((l) => l)
  lines.forEach((code) => {
    const num = t.rows.length + 1
    t.rows.push({
      number: num,
        variants: [code],
      bonusTime: { ...t.quickTime },
      delay: { hours: 0, minutes: 0, seconds: 0 },
      relativeLimit: { hours: 0, minutes: 0, seconds: 0 },
      sectorName: t.sectorPattern.replace(/&/g, String(num)),
      bonusName: t.bonusPattern.replace(/&/g, String(num)),
        bonusTask: '',
        bonusHint: '',
      inSector: true,
      inBonus: true,
      targetLevels: [],
    })
  })
  codesText.value = ''
  showCodes.value = false
}

// Управление вариантами ответов (используется в шаблоне)
function addVariant(row: { variants: string[] }) {
  if (!Array.isArray(row.variants)) row.variants = ['']
  if (row.variants.length < 10) row.variants.push('')
}
function removeVariant(row: { variants: string[] }, idx: number) {
  if (!Array.isArray(row.variants)) row.variants = ['']
  if (row.variants.length > 1) row.variants.splice(idx, 1)
}

function onClear() {
  tabs.value[activeTab.value] = createTab()
}

function exportDataAs(format: 'json' | 'csv') {
  if (format === 'csv') {
    const rows: Array<Record<string, string>> = []
    tabs.value.forEach((t, tabIdx) => {
      t.rows.forEach((r) => {
        rows.push({
          tab: String(tabIdx + 1),
          number: String(r.number || ''),
          variants: (Array.isArray(r.variants) ? r.variants : []).join(' | '),
          inSector: r.inSector ? '1' : '0',
          inBonus: r.inBonus ? '1' : '0',
          bonusHours: String(r.bonusTime?.hours ?? ''),
          bonusMinutes: String(r.bonusTime?.minutes ?? ''),
          bonusSeconds: String(r.bonusTime?.seconds ?? ''),
          bonusNegative: r.bonusTime?.negative ? '1' : '0',
          delayHours: String(r.delay?.hours ?? ''),
          delayMinutes: String(r.delay?.minutes ?? ''),
          delaySeconds: String(r.delay?.seconds ?? ''),
          validHours: String(r.relativeLimit?.hours ?? ''),
          validMinutes: String(r.relativeLimit?.minutes ?? ''),
          validSeconds: String(r.relativeLimit?.seconds ?? ''),
          sectorName: r.sectorName || '',
          bonusName: r.bonusName || '',
          bonusTask: r.bonusTask || '',
          bonusHint: r.bonusHint || '',
          allLevels: r.allLevels ? '1' : '0',
          targetLevels: Array.isArray(r.targetLevels) ? r.targetLevels.join(';') : '',
        })
      })
    })
    const csv = serializeCsv(rows)
    downloadBlob(csv, '100500.csv', 'text/csv')
  } else {
    const plain = tabs.value.map((t) => ({
      sectorPattern: t.sectorPattern,
      bonusPattern: t.bonusPattern,
      bonusTaskPattern: t.bonusTaskPattern || '',
      bonusHintPattern: t.bonusHintPattern || '',
      quickTime: { ...t.quickTime },
      rows: t.rows,
    }))
    const blob = new Blob([JSON.stringify(plain, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '100500.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  showExport.value = false
}

function removeRow(row: Row) {
  const t = currentTab.value
  if (!t) return
  const idx = t.rows.findIndex((r) => r === row)
  if (idx === -1) return
  t.rows.splice(idx, 1)
  // перенумеруем
  t.rows.forEach((r, i) => (r.number = i + 1))
}

function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const text = String(reader.result || '')
      const trimmed = text.trim()
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const arr = JSON.parse(text)
        if (Array.isArray(arr)) {
          tabs.value = arr.map((t: any) => {
            const tab = createTab()
            tab.sectorPattern = typeof t.sectorPattern === 'string' ? t.sectorPattern : ''
            tab.bonusPattern = typeof t.bonusPattern === 'string' ? t.bonusPattern : ''
            tab.bonusTaskPattern = typeof t.bonusTaskPattern === 'string' ? t.bonusTaskPattern : ''
            tab.bonusHintPattern = typeof t.bonusHintPattern === 'string' ? t.bonusHintPattern : ''
            if (t.quickTime && typeof t.quickTime === 'object') {
              tab.quickTime = {
                hours: Number(t.quickTime.hours) || 0,
                minutes: Number(t.quickTime.minutes) || 0,
                seconds: Number(t.quickTime.seconds) || 0,
                negative: !!t.quickTime.negative,
              }
            }
            tab.rows = (t.rows || []).map((r: any) => ({
              number: r.number,
              variants: Array.isArray(r.variants)
                ? r.variants
                : [typeof r.answer === 'string' ? r.answer : ''],
              bonusTime: r.bonusTime || { hours: 0, minutes: 0, seconds: 0, negative: false },
              delay: r.delay || { hours: 0, minutes: 0, seconds: 0 },
              relativeLimit: r.relativeLimit || { hours: 0, minutes: 0, seconds: 0 },
              sectorName: r.sectorName || '',
              bonusName: r.bonusName || '',
              bonusTask: typeof r.bonusTask === 'string' ? r.bonusTask : '',
              bonusHint: typeof r.bonusHint === 'string' ? r.bonusHint : '',
              inSector: r.inSector !== false,
              inBonus: r.inBonus !== false,
              targetLevels: Array.isArray(r.targetLevels) ? r.targetLevels : [],
              allLevels: !!r.allLevels,
            }))
            return tab
          })
          activeTab.value = 0
        } else {
          notify.error('Неверный формат JSON', 'Ожидается массив объектов')
        }
      } else {
        const rows = parseCsv(text)
        if (!rows.length) {
          notify.warn('CSV пустой', 'Файл не содержит данных')
          return
        }
        // Группируем по полю tab (1..N). Если нет, отправляем в таб 1
        const byTab = new Map<number, Array<Record<string, string>>>()
        for (const r of rows) {
          const t = Math.max(1, Number(r.tab) || 1)
          if (!byTab.has(t)) byTab.set(t, [])
          byTab.get(t)!.push(r)
        }
        const maxTab = Math.max(...Array.from(byTab.keys()))
        const newTabs: any[] = []
        for (let t = 1; t <= maxTab; t++) {
          const tab = createTab()
          const list = (byTab.get(t) || [])
            const mapped = list.map((r: Record<string, string>) => ({
            number: Number(r.number) || 0,
            variants: (r.variants || '').split('|').map((s: string) => s.trim()).filter(Boolean),
            bonusTime: {
              hours: Number(r.bonusHours) || 0,
              minutes: Number(r.bonusMinutes) || 0,
              seconds: Number(r.bonusSeconds) || 0,
              negative: r.bonusNegative === '1' || /true|-/i.test(r.bonusNegative || ''),
            },
              delay: {
                hours: Number(r.delayHours) || 0,
                minutes: Number(r.delayMinutes) || 0,
                seconds: Number(r.delaySeconds) || 0,
              },
              relativeLimit: {
                hours: Number(r.validHours) || 0,
                minutes: Number(r.validMinutes) || 0,
                seconds: Number(r.validSeconds) || 0,
              },
            sectorName: r.sectorName || '',
            bonusName: r.bonusName || '',
            bonusTask: r.bonusTask || '',
            bonusHint: r.bonusHint || '',
            inSector: r.inSector === '1' || /true/i.test(r.inSector || ''),
            inBonus: r.inBonus === '1' || /true/i.test(r.inBonus || ''),
            targetLevels: (r.targetLevels || '')
              .split(';')
              .map((s: string) => s.trim())
              .filter(Boolean),
            allLevels: r.allLevels === '1' || /true/i.test(r.allLevels || ''),
          }))
          mapped.sort((a, b) => a.number - b.number)
          tab.rows = mapped.map((a: any, idx: number) => ({ ...a, number: idx + 1 }))
          newTabs.push(tab)
        }
        tabs.value = newTabs.length ? newTabs : [createTab()]
        activeTab.value = 0
      }
    } catch (err) {
      notify.error('Ошибка при импорте', (err as any)?.message || 'Не удалось обработать файл')
    }
  }
  reader.readAsText(file)
}

async function onSendSectors() {
  try {
    // Подтверждение пользователя
    const confirmed = await new Promise<boolean>((resolve) => {
      confirm.require({
        message: '⚠️ ВАЖНО: Во время заливки секторов НЕ переключайтесь на другие вкладки браузера и не сворачивайте его, чтобы процесс заливки не был приостановлен.\n\nПродолжить заливку?',
        header: 'Подтверждение заливки',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Продолжить',
        rejectLabel: 'Отмена',
        accept: () => resolve(true),
        reject: () => resolve(false)
      })
    })
    if (!confirmed) return

    // Начинаем отслеживание видимости
    startUploadVisibilityTracking('сектора')

    if (combineSectors.value) {
      if (tabs.value.length <= 1) {
        notify.warn('Для объединения необходимо больше одного блока')
        stopUploadVisibilityTracking()
        return
      }
      const firstLen = tabs.value[0].rows.length
      if (!tabs.value.every((t) => t.rows.length === firstLen)) {
        notify.warn('Количество ответов во всех блоках должно совпадать')
        stopUploadVisibilityTracking()
        return
      }
      const total = firstLen
      const rowsList: Row[][] = []
      for (let i = 0; i < firstLen; i++) {
        rowsList.push(tabs.value.map((t) => t.rows[i]))
      }
      progress.start('sector', total)
      for (const rows of rowsList) {
        // Проверяем паузу перед каждой группой секторов
        await progress.waitForResume()
        if (!rows.every((r) => r.inSector)) {
          progress.update('Пропуск')
          continue
        }
        const variants: string[] = []
        for (const r of rows) {
          const arr = Array.isArray(r.variants) ? r.variants : []
          for (const v of arr) variants.push(v)
        }
        progress.update(`Сектор ${rows[0].number}`)
        await sendSector(
          store.domain,
          store.gameId,
          store.levelId,
          variants,
          '',
          rows[0].sectorName
        )
      }
      progress.finish()
    } else {
      const rowsToSend: Row[] = []
      for (const t of tabs.value) {
        for (const row of t.rows) {
          if (!row.inSector) continue
          rowsToSend.push(row)
        }
      }

      if (rowsToSend.length === 0) {
        notify.info('Нет отмеченных секторов для отправки')
        stopUploadVisibilityTracking()
        return
      }

      progress.start('sector', rowsToSend.length)
      for (const row of rowsToSend) {
        // Проверяем паузу перед каждым сектором
        await progress.waitForResume()
        progress.update(`Сектор ${row.number}`)
        await sendSector(
          store.domain,
          store.gameId,
          store.levelId,
          (Array.isArray(row.variants) && row.variants.length ? row.variants : ['']),
          '',
          row.sectorName
        )
      }
      progress.finish()
    }

    // Останавливаем отслеживание и показываем уведомление о завершении
    stopUploadVisibilityTracking()
    const sectorsCount = combineSectors.value ? 
      tabs.value[0]?.rows?.filter(r => r.inSector).length || 0 :
      tabs.value.reduce((sum, t) => sum + t.rows.filter(r => r.inSector).length, 0)
    showCompletionNotification('сектора', sectorsCount)
    notify.success('Все сектора отправлены', `Успешно отправлено: ${sectorsCount} секторов`)
  } catch (e: any) {
    // Останавливаем отслеживание в случае ошибки
    stopUploadVisibilityTracking()
    notify.error('Ошибка отправки секторов', e.message)
  }
}

async function onSendBonuses() {
  try {
    const bonusRows: Answer[] = []
    for (const t of tabs.value) {
      for (const row of t.rows) {
        if (!row.inBonus) continue
        bonusRows.push({
          number: row.number,
          variants: (Array.isArray(row.variants) && row.variants.length ? row.variants : ['']),
          inSector: true,
          inBonus: true,
          allLevels: !!row.allLevels,
          bonusTime: { ...row.bonusTime },
          delay: row.delay ? { ...row.delay } : { hours: 0, minutes: 0, seconds: 0 },
          relativeLimit: row.relativeLimit ? { ...row.relativeLimit } : { hours: 0, minutes: 0, seconds: 0 },
          closedText: '',
          displayText: '',
          bonusName: row.bonusName,
          noHint: true,
          bonusTask: typeof row.bonusTask === 'string' ? row.bonusTask : '',
          bonusHint: typeof row.bonusHint === 'string' ? row.bonusHint : '',
          targetLevels: Array.isArray(row.targetLevels) ? row.targetLevels : [],
        })
      }
    }

    if (bonusRows.length === 0) {
      notify.info('Нет отмеченных бонусов для отправки')
      return
    }

    // Подтверждение пользователя
    const confirmed = await new Promise<boolean>((resolve) => {
      confirm.require({
        message: '⚠️ ВАЖНО: Во время заливки бонусов НЕ переключайтесь на другие вкладки браузера и не сворачивайте его, чтобы процесс заливки не был приостановлен.\n\nПродолжить заливку?',
        header: 'Подтверждение заливки',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Продолжить',
        rejectLabel: 'Отмена',
        accept: () => resolve(true),
        reject: () => resolve(false)
      })
    })
    if (!confirmed) return

    // Начинаем отслеживание видимости
    startUploadVisibilityTracking('бонусы')

    // Перелогинимся перед массовой загрузкой, чтобы продлить сессию
    await authStore.authenticate(store.domain)

    progress.start('bonus', bonusRows.length)
    for (let idx = 0; idx < bonusRows.length; idx++) {
      // Проверяем паузу перед каждым бонусом
      await progress.waitForResume()
      const b = bonusRows[idx]
      progress.update(`Бонус ${b.number}`)
      await sendBonuses(store.domain, store.gameId, store.levelId, [b])

      // Каждые 25 бонусов обновляем авторизацию, чтобы избежать истечения сессии
      if ((idx + 1) % 25 === 0) {
        await authStore.authenticate(store.domain)
      }
    }
    progress.finish()

    // Останавливаем отслеживание и показываем уведомление о завершении
    stopUploadVisibilityTracking()
    showCompletionNotification('бонусы', bonusRows.length)
    notify.success('Все бонусы отправлены', `Успешно отправлено: ${bonusRows.length} бонусов`)
  } catch (e: any) {
    // Останавливаем отслеживание в случае ошибки
    stopUploadVisibilityTracking()
    notify.error('Ошибка отправки бонусов', e.message)
  }

}
  
  
 </script>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* Убираем спиннеры у числовых инпутов внутри таблицы */
input.no-spin[type=number]::-webkit-outer-spin-button,
input.no-spin[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input.no-spin[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
