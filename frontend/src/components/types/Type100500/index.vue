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
      <div class="flex items-center gap-2 mt-6 mb-4">
        <button
          v-for="(t, idx) in tabs"
          :key="idx"
          @click="activeTab = idx"
          :class="activeTab === idx ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'"
          class="px-4 py-2 rounded-md"
        >
          Блок {{ idx + 1 }}
        </button>
        <button @click="addTab" class="px-4 py-2 rounded-md bg-green-500 text-white">＋</button>
      </div>

      <!-- Tab content -->
      <div v-if="currentTab" class="space-y-4">
        <!-- Controls -->
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="form-label">Название секторов</label>
            <input v-model="currentTab.sectorPattern" class="form-input h-10 w-full" />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="form-label">Название бонусов</label>
            <input v-model="currentTab.bonusPattern" class="form-input h-10 w-full" />
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
          <button @click="showCodes = true" type="button" class="form-button h-10 px-4">Добавить коды</button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full table-fixed border-collapse text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="p-2 text-left w-8">#</th>
                <th class="p-2 text-left w-1/3">Ответ</th>
                <th class="p-2 text-left w-32">Бонусное время</th>
                <th class="p-2 text-left">Название сектора</th>
                <th class="p-2 text-left">Название бонуса</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in currentTab.rows" :key="row.number" class="border-t border-gray-200">
                <td class="p-2">{{ row.number }}</td>
                <td class="p-2">
                  <input v-model="row.answer" class="form-input h-8 w-full" placeholder="код" />
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
                  <input v-model="row.sectorName" class="form-input h-8 w-full" placeholder="Название сектора" />
                </td>
                <td class="p-2">
                  <input v-model="row.bonusName" class="form-input h-8 w-full" placeholder="Название бонуса" />
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
        <div class="flex flex-wrap gap-2">
          <button @click="onSendSectors" type="button" class="form-button h-10 px-4">Залить секторы</button>
          <button @click="onSendBonuses" type="button" class="form-button h-10 px-4">Залить бонусы</button>
        </div>
      </div>
    </div>

    <!-- Add codes modal -->
    <transition name="fade">
      <div v-if="showCodes" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-md w-[90%] max-w-xl space-y-4">
          <textarea v-model="codesText" class="form-input h-40 w-full" placeholder="Коды, каждый с новой строки"></textarea>
          <div class="text-right">
            <button @click="applyCodes" class="form-button h-10 px-4">Готово</button>
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
import { sendSector, sendBonuses, Answer } from '../../../services/uploader'

const store = useUploadStore()
const authStore = useAuthStore()

interface Row {
  number: number
  answer: string
  bonusTime: { hours: number; minutes: number; seconds: number; negative: boolean }
  sectorName: string
  bonusName: string
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

const currentTab = computed(() => tabs.value[activeTab.value])

onMounted(() => {
  const raw = localStorage.getItem(storageKey)
  if (raw) {
    try {
      tabs.value = JSON.parse(raw)
    } catch {
      tabs.value = [createTab()]
    }
  } else {
    tabs.value = [createTab()]
  }
})

watch(
  tabs,
  (val) => {
    localStorage.setItem(storageKey, JSON.stringify(val))
  },
  { deep: true }
)

watch(
  () => currentTab.value?.sectorPattern,
  (val) => {
    const t = currentTab.value
    if (!t || val === undefined) return
    t.rows.forEach((r, idx) => {
      r.sectorName = val.replace(/&/g, String(idx + 1))
    })
  }
)

watch(
  () => currentTab.value?.bonusPattern,
  (val) => {
    const t = currentTab.value
    if (!t || val === undefined) return
    t.rows.forEach((r, idx) => {
      r.bonusName = val.replace(/&/g, String(idx + 1))
    })
  }
)

watch(
  () => ({ ...currentTab.value?.quickTime }),
  (qt) => {
    const t = currentTab.value
    if (!t) return
    t.rows.forEach((r) => (r.bonusTime = { ...qt }))
  },
  { deep: true }
)

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
    })
  })
  codesText.value = ''
  showCodes.value = false
}

function onClear() {
  tabs.value[activeTab.value] = createTab()
}

function exportData() {
  const blob = new Blob([JSON.stringify(tabs.value, null, 2)], { type: 'application/json' })
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
        tabs.value = arr
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
  for (const t of tabs.value) {
    for (const row of t.rows) {
      await sendSector(
        store.domain,
        store.gameId,
        store.levelId,
        [row.answer],
        '',
        row.sectorName
      )
    }
  }
  alert('✅ Все сектора отправлены')
}

async function onSendBonuses() {
  for (const t of tabs.value) {
    for (const row of t.rows) {
      const b: Answer = {
        number: row.number,
        variants: [row.answer],
        inSector: true,
        inBonus: true,
        bonusTime: { ...row.bonusTime },
        closedText: '',
        displayText: '',
        bonusName: row.bonusName,
        noHint: true,
      }
      await sendBonuses(store.domain, store.gameId, store.levelId, [b])
    }
  }
  alert('✅ Все бонусы отправлены')
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
