<template>
  <div class="min-h-screen bg-blue-50 py-8">
    <div class="container mx-auto bg-white p-12 rounded-md shadow-sm">
      <h1 class="text-2xl font-semibold text-center">
        100500 секторов и бонусов
      </h1>
      <p class="text-sm text-gray-500 text-center mb-0">
        автор: <strong>{{ authStore.username }}</strong>,
        домен: <strong>{{ store.domain }}</strong>,
        игра: <strong>{{ store.gameId }}</strong>,
        уровень: <strong>{{ store.levelId }}</strong>
      </p>

      <!-- Tabs -->
      <div class="flex flex-wrap items-center gap-2 mt-6 mb-6">
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
        <button
          v-if="tabs.length > 1"
          @click="removeCurrentTab"
          class="px-4 py-2 rounded-md bg-red-500 text-white"
        >
          -
        </button>
      </div>

      <!-- Tab content -->
      <div v-if="currentTab" class="space-y-8">
        <!-- Controls -->
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="form-label">Название секторов</label>
            <input
              v-model="currentTab.sectorPattern"
              placeholder="Текст или &"
              class="form-input h-10 w-full"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="form-label">Название бонусов</label>
            <input
              v-model="currentTab.bonusPattern"
              placeholder="Текст или &"
              class="form-input h-10 w-full"
            />
          </div>
          <div>
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
          <button @click="showCodes = true" type="button" class="form-button h-10 px-4 flex-1">Добавить коды</button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full table-fixed border-collapse text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="p-2 text-left w-8">#</th>
                <th class="p-2 text-left w-1/3">Ответ</th>
                <th class="p-2 text-center">Сектор</th>
                <th class="p-2 text-center">Бонус</th>
                <th class="p-2 text-left w-32">Бонусное время</th>
                <th class="p-2 text-left">Название сектора</th>
                <th class="p-2 text-left">Название бонуса</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in currentTab.rows" :key="row.number" class="border-t border-gray-200">
                <td class="p-2">{{ row.number }}</td>
                <td class="p-2">
                  <input v-model="row.answer" class="form-input h-8 w-full min-w-[150px]" placeholder="код" />
                </td>
                <td class="p-2 text-center">
                  <input type="checkbox" v-model="row.inSector" class="cursor-pointer" />
                </td>
                <td class="p-2 text-center">
                  <input type="checkbox" v-model="row.inBonus" class="cursor-pointer" />
                </td>
                <td class="p-2">
                  <div class="flex items-center gap-1">
                    <input type="number" min="0" v-model.number="row.bonusTime.hours" placeholder="ч" class="form-input h-8 w-16 text-center" />
                    <input type="number" min="0" v-model.number="row.bonusTime.minutes" placeholder="м" class="form-input h-8 w-16 text-center" />
                    <input type="number" min="0" v-model.number="row.bonusTime.seconds" placeholder="с" class="form-input h-8 w-16 text-center" />
                    <label class="flex items-center gap-1 ml-2">
                      <input type="checkbox" v-model="row.bonusTime.negative" class="cursor-pointer" />
                      <span class="text-gray-500">–</span>
                    </label>
                  </div>
                </td>
                <td class="p-2">
                  <input v-model="row.sectorName" class="form-input h-8 w-full min-w-[150px]" placeholder="Название сектора" />
                </td>
                <td class="p-2">
                  <input v-model="row.bonusName" class="form-input h-8 w-full min-w-[150px]" placeholder="Название бонуса" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Buttons bottom -->
      <div class="flex flex-wrap justify-between gap-2 mt-8">
        <div>
          <button @click="$router.push('/settings')" class="form-button bg-gray-400 hover:bg-gray-500 h-10 px-4">Назад</button>
        </div>
        <div class="flex flex-wrap gap-2 px-4">
          <button @click="onClear" type="button" class="form-button h-10 px-4">Очистить</button>
          <button @click="exportData" type="button" class="form-button h-10 px-4">Экспорт</button>
          <label class="form-button h-10 px-4 cursor-pointer">
            Импорт
            <input type="file" @change="importData" accept=".json" class="hidden" />
          </label>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <label class="flex items-center gap-1">
            <input type="checkbox" v-model="combineSectors" class="cursor-pointer" />
            <span>Объединить секторы (БМП)</span>
          </label>
          <button @click="onSendSectors" type="button" class="form-button h-10 px-4">Залить секторы</button>
          <button @click="onSendBonuses" type="button" class="form-button h-10 px-4">Залить бонусы</button>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useUploadStore } from '../../../store'
import { useAuthStore } from '../../../store/auth'
import { useProgressStore } from '../../../store/progress'
import { sendSector, sendBonuses, type Answer } from '../../../services/uploader'
import { showUploadWarning, startUploadVisibilityTracking, stopUploadVisibilityTracking, showCompletionNotification } from '../../../utils/visibility'

const store = useUploadStore()
const authStore = useAuthStore()
const progress = useProgressStore()

interface Row {
  number: number
  answer: string
  bonusTime: { hours: number; minutes: number; seconds: number; negative: boolean }
  sectorName: string
  bonusName: string
  inSector: boolean
  inBonus: boolean
}
interface TabData {
  sectorPattern: string
  bonusPattern: string
  quickTime: { hours: number; minutes: number; seconds: number; negative: boolean }
  rows: Row[]
}

const storageKey = 'type100500-tabs'
const tabs = ref<TabData[]>([])
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

function createTab(): TabData {
  return {
    sectorPattern: '',
    bonusPattern: '',
    quickTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
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
        tabs.value = arr.map((t: any) => ({ ...createTab(), rows: t.rows || [] }))
      } else {
        tabs.value = [createTab()]
      }
    } catch {
      tabs.value = [createTab()]
    }
  } else {
    tabs.value = [createTab()]
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
    () => currentTab.value?.sectorPattern,
    (val, old) => {
      if (val === old) return
      const t = currentTab.value
      if (!t || val === undefined) return
      t.rows.forEach((r, idx) => {
        r.sectorName = val.replace(/&/g, String(idx + 1))
      })
    }
  )

  watch(
    () => currentTab.value?.bonusPattern,
    (val, old) => {
      if (val === old) return
      const t = currentTab.value
      if (!t || val === undefined) return
      t.rows.forEach((r, idx) => {
        r.bonusName = val.replace(/&/g, String(idx + 1))
      })
    }
  )

  watch(
    () => ({ ...currentTab.value?.quickTime }),
    (qt, old) => {
      if (!currentTab.value) return
      if (JSON.stringify(qt) === JSON.stringify(old)) return
      currentTab.value.rows.forEach((r) => (r.bonusTime = { ...qt }))
    },
    { deep: true }
  )
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
    alert('Количество знаков должно быть от 2 до 10')
    return
  }

  const existing = new Set<string>()
  tabs.value.forEach((t) => t.rows.forEach((r) => existing.add(r.answer.trim())))
  codesText.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
    .forEach((c) => existing.add(c))

  const max = Math.pow(10, len)
  const available = max - existing.size
  if (genCount.value > available) {
    alert(
      `Невозможно сгенерировать ${genCount.value} уникальных кодов. Доступно только ${available}.`
    )
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
      answer: code,
      bonusTime: { ...t.quickTime },
      sectorName: t.sectorPattern.replace(/&/g, String(num)),
      bonusName: t.bonusPattern.replace(/&/g, String(num)),
      inSector: true,
      inBonus: true,
    })
  })
  codesText.value = ''
  showCodes.value = false
}

function onClear() {
  tabs.value[activeTab.value] = createTab()
}

function exportData() {
  const plain = tabs.value.map((t) => ({ rows: t.rows }))
  const blob = new Blob([JSON.stringify(plain, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '100500.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const arr = JSON.parse(reader.result as string)
      if (Array.isArray(arr)) {
        tabs.value = arr.map((t: any) => ({ ...createTab(), rows: t.rows || [] }))
        activeTab.value = 0
      } else {
        alert('Неверный формат JSON')
      }
    } catch {
      alert('Ошибка при разборе JSON')
    }
  }
  reader.readAsText(file)
}

async function onSendSectors() {
  try {
    // Показываем предупреждение пользователю
    if (!showUploadWarning('сектора')) {
      return
    }

    // Начинаем отслеживание видимости
    startUploadVisibilityTracking('сектора')

    if (combineSectors.value) {
      if (tabs.value.length <= 1) {
        alert('❌ Для объединения необходимо больше одного блока')
        stopUploadVisibilityTracking()
        return
      }
      const firstLen = tabs.value[0].rows.length
      if (!tabs.value.every((t) => t.rows.length === firstLen)) {
        alert('❌ Количество ответов во всех блоках должно совпадать')
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
        if (!rows.every((r) => r.inSector)) {
          progress.update('Пропуск')
          continue
        }
        const variants = rows.map((r) => r.answer)
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
        alert('ℹ️ Нет отмеченных секторов для отправки')
        stopUploadVisibilityTracking()
        return
      }

      progress.start('sector', rowsToSend.length)
      for (const row of rowsToSend) {
        progress.update(`Сектор ${row.number}`)
        await sendSector(
          store.domain,
          store.gameId,
          store.levelId,
          [row.answer],
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
    alert('✅ Все сектора отправлены')
  } catch (e: any) {
    // Останавливаем отслеживание в случае ошибки
    stopUploadVisibilityTracking()
    alert('❌ Ошибка отправки секторов: ' + e.message)
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
          variants: [row.answer],
          inSector: true,
          inBonus: true,
          bonusTime: { ...row.bonusTime },
          closedText: '',
          displayText: '',
          bonusName: row.bonusName,
          noHint: true,
        })
      }
    }

    if (bonusRows.length === 0) {
      alert('ℹ️ Нет отмеченных бонусов для отправки')
      return
    }

    // Показываем предупреждение пользователю
    if (!showUploadWarning('бонусы')) {
      return
    }

    // Начинаем отслеживание видимости
    startUploadVisibilityTracking('бонусы')

    // Перелогинимся перед массовой загрузкой, чтобы продлить сессию
    await authStore.authenticate(store.domain)

    progress.start('bonus', bonusRows.length)
    for (let idx = 0; idx < bonusRows.length; idx++) {
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
    alert('✅ Все бонусы отправлены')
  } catch (e: any) {
    // Останавливаем отслеживание в случае ошибки
    stopUploadVisibilityTracking()
    alert('❌ Ошибка отправки бонусов: ' + e.message)
  }
}
</script>

<script lang="ts">
export default {}
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
</style>
