<template>
  <div class="min-h-screen bg-blue-50 py-8">
    <div class="container mx-auto bg-white p-12 rounded-md shadow-sm">
      <!-- Заголовок -->
      <h1 class="text-2xl font-semibold text-center">
        {{ levelTypeLabel }}
      </h1>

      <!-- Информация об авторе и настройках -->
      <p class="text-sm text-gray-500 text-center mb-0">
        автор: <strong>{{ authStore.username }}</strong>,
        домен: <strong>{{ store.domain }}</strong>,
        игра: <strong>{{ store.gameId }}</strong>,
        уровень: <strong>{{ store.levelId }}</strong>
      </p>

      <!-- Ошибка валидации/отправки -->
      <div v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</div>

      <!-- Глобальные контролы -->
      <div class="flex flex-wrap justify-between items-end gap-4 mt-8 mb-8">
        <!-- Режим закрытия уровня -->
        <div class="flex-1 min-w-[160px]">
          <label class="form-label">Закрытие уровня</label>
          <select
            v-model="sectorMode"
            @change="applySectorMode"
            class="form-select h-10 w-full cursor-pointer"
          >
            <option value="all">Все сектора</option>
            <option value="initialAndFinal">Начальные + финал</option>
            <option value="finalOnly">Только финал</option>
            <option value="custom">Кастом</option>
          </select>
        </div>

        <!-- Быстрое бонусное время -->
        <div class="flex-1 min-w-[240px]">
          <label class="form-label">Бонусное время (ч, м, с)</label>
          <div class="flex items-center gap-2">
            <input
              type="number"
              min="0"
              v-model.number="quickTime.hours"
              placeholder="ч"
              class="form-input h-10 w-16 text-center"
            />
            <input
              type="number"
              min="0"
              v-model.number="quickTime.minutes"
              placeholder="м"
              class="form-input h-10 w-16 text-center"
            />
            <input
              type="number"
              min="0"
              v-model.number="quickTime.seconds"
              placeholder="с"
              class="form-input h-10 w-16 text-center"
            />
            <label class="flex items-center gap-1 ml-2">
              <input
                type="checkbox"
                v-model="quickTime.negative"
                class="cursor-pointer"
              />
              <span class="text-gray-500">–</span>
            </label>
          </div>
        </div>

        <!-- Шаблон закрытого сектора -->
        <div class="flex-1 min-w-[240px]">
          <label class="form-label">Название закрытого сектора</label>
          <input
            v-model="localClosedPattern"
            placeholder="Текст, & или URL картинки"
            class="form-input h-10 w-full"
          />
        </div>

        <!-- Быстрая кнопка заполнения открытых -->
        <button
          @click="fillOpenSectors"
          type="button"
          class="form-button h-10 px-4 flex-1 min-w-[240px]"
        >
          Заполнить открытые сектора
        </button>
      </div>

      <!-- Таблица ответов -->
      <Answers />

      <!-- Навигация и экспорт/импорт -->
      <div class="flex flex-wrap justify-between gap-2 mt-8">
        <div class="flex flex-wrap gap-2">
          <button
            @click="$router.push('/settings')"
            class="form-button bg-gray-400 hover:bg-gray-500 h-10 px-4"
          >
            Назад
          </button>
        </div>
        <div class="flex flex-wrap gap-2 px-4">
          <button
            @click="exportData"
            type="button"
            class="form-button h-10 px-4"
          >
            Экспорт
          </button>
          <label class="form-button h-10 px-4 cursor-pointer">
            Импорт
            <input
              type="file"
              @change="importData"
              accept=".json"
              class="hidden"
            />
          </label>
          <button @click="showPreview = true" class="form-button h-10 px-4">
            Предпросмотр
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            @click="onSendTask"
            type="button"
            class="form-button h-10 px-4"
          >
            Залить задание
          </button>
          <button
            @click="onSendSector"
            type="button"
            class="form-button h-10 px-4"
          >
            Залить секторы
          </button>
          <button
            @click="onSendBonus"
            type="button"
            class="form-button h-10 px-4"
          >
            Залить бонусы
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно Предпросмотра -->
    <transition name="fade">
      <div
        v-if="showPreview"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div
          class="bg-[#1d1d1d] text-white rounded-md p-6 w-[90%] max-w-3xl space-y-4 relative"
        >
          <button
            @click="showPreview = false"
            class="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
          <h2 class="text-xl font-semibold">Предпросмотр</h2>
          <div class="flex gap-2 mb-4">
            <button
              :class="previewMode === 'closed' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-black'"
              class="px-4 py-2 rounded-md cursor-pointer"
              @click="previewMode = 'closed'"
            >
              Закрытая
            </button>
            <button
              :class="previewMode === 'open' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-black'"
              class="px-4 py-2 rounded-md cursor-pointer"
              @click="previewMode = 'open'"
            >
              Открытая
            </button>
          </div>
          <div class="overflow-auto max-h-[60vh]">
            <div v-html="olympTableHtml"></div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUploadStore } from '../../../store'
import { useAuthStore } from '../../../store/auth'
import Answers from './Answers.vue'

// Функции отправки из единого uploader.ts
import {
  sendTask,
  sendSector,
  sendBonuses,
} from '../../../services/uploader'

// --- Вспомогательная проверка «это ли ссылка на изображение?» ---
function formatClosedText(text: string): string {
  const trimmed = text.trim()
  // Если начинается с http:// или https://
  if (/^https?:\/\//i.test(trimmed)) {
    // Оборачиваем в <a><img>…
    return `<a href="${trimmed}" target="_blank"><img src="${trimmed}" style="max-width: 150px; max-height: 150px;"></a>`
  }
  return text
}

// Типы
type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'
type Cell = { id?: string; rs?: number }

const store = useUploadStore()
const authStore = useAuthStore()

const error = ref('')
const showPreview = ref(false)
const previewMode = ref<'closed' | 'open'>('closed')

// Заголовок
const levelTypeLabel = computed(() =>
  store.uploadType === 'olymp' ? 'Олимпийка (15 секторов)' : store.uploadType
)

// Режим закрытия секторов
const sectorMode = computed<SectorMode>({
  get: () => store.config.sectorMode as SectorMode,
  set: (v) => {
    ;(store.config as any).sectorMode = v
  },
})

// Быстрое заполнение бонусного времени
const quickTime = reactive({
  hours: 0,
  minutes: 0,
  seconds: 0,
  negative: false,
})
watch(
  () => ({ ...quickTime }),
  (qt) => store.answers.forEach((r) => (r.bonusTime = { ...qt })), 
  { deep: true }
)

// Шаблон закрытого сектора
const localClosedPattern = ref('')
watch(localClosedPattern, (val) =>
  store.answers.forEach((r) => {
    r.closedText = val.replace(/&/g, String(r.number))
  })
)
onMounted(() => {
  localClosedPattern.value = ''
})

// Применение режима закрытия секторов
function applySectorMode() {
  switch (sectorMode.value) {
    case 'all':
      store.answers.forEach((r) => (r.inSector = true))
      break
    case 'initialAndFinal':
      store.answers.forEach((r) => {
        r.inSector = r.number <= 8 || r.number === 15
      })
      break
    case 'finalOnly':
      store.answers.forEach((r) => {
        r.inSector = r.number === 15
      })
      break
    case 'custom':
      break
  }
}

// Заполнить открытые сектора из первого варианта
function fillOpenSectors() {
  store.answers.forEach((r) => {
    r.displayText = r.variants[0] || ''
  })
}

// Экспорт состояния в JSON
function exportData() {
  const blob = new Blob([JSON.stringify(store.$state, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'encounter-olymp.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Импорт состояния из JSON
function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result as string)
      if (Array.isArray(obj.answers) && obj.config) {
        store.$patch(obj)
      } else {
        alert('Неверный формат JSON')
      }
    } catch {
      alert('Ошибка при разборе JSON')
    }
  }
  reader.readAsText(file)
}

// Генерация HTML таблицы Олимпийки с учётом возможного <img>
const olympTableHtml = computed(() => {
  const style = `
    <style>
      .olymp {max-width:800px;width:100%;margin: 10px 0;}
      .olymp td {
        border:1px solid #414141;
        padding:10px;
        width:120px!important;
        text-align:center;
        vertical-align:middle;
      }
      .up {color:#0F0;font-weight:bold;}
      .cols-wrapper {display: none;}
      h3 {display: none !important;}
      .timer, .bonus_count, .color_bonus, .color_correct {display: block !important;}
    </style>`
  const layout: Cell[][] = [
    [{ id: '01_01' }, { id: '01_09', rs: 2 }, { id: '01_13', rs: 4 }, { id: '01_15', rs: 8 }],
    [{ id: '01_02' }, {}],
    [{ id: '01_03' }, { id: '01_10', rs: 2 }],
    [{ id: '01_04' }],
    [{ id: '01_05' }, { id: '01_11', rs: 2 }, { id: '01_14', rs: 4 }],
    [{ id: '01_06' }],
    [{ id: '01_07' }, { id: '01_12', rs: 2 }],
    [{ id: '01_08' }],
  ]

  let html = style + '<table class="olymp">'
  layout.forEach((row) => {
    html += '<tr>'
    row.forEach((cell) => {
      if (!cell.id) return
      const num = parseInt(cell.id.slice(-2), 10)
      // Выбираем между closed и open
      let rawText =
        previewMode.value === 'closed'
          ? store.answers[num - 1].closedText
          : store.answers[num - 1].displayText || store.answers[num - 1].closedText

      // Если это ссылка, формируем <a><img>
      const content = formatClosedText(rawText)

      // Если в режиме «open» и есть displayText, оборачиваем в <p class="up">
      let cellHtml = content
      if (
        previewMode.value === 'open' &&
        store.answers[num - 1].displayText &&
        !/^https?:\/\//i.test(rawText.trim())
      ) {
        // Только для «текстовых» открытых значений оборачиваем в <p class="up">
        cellHtml = `<p class="up">${content}</p>`
      }

      const rsAttr = cell.rs ? `rowspan="${cell.rs}"` : ''
      html += `<td id="${cell.id}" ${rsAttr}>${cellHtml}</td>`
    })
    html += '</tr>'
  })
  html += '</table>'
  return html
})

// --- ФУНКЦИИ ОТПРАВКИ ---

// 1) отправка «Задания» (теперь всегда закрытая таблица)
async function onSendTask() {
  try {
    // Сохраняем текущий режим предпросмотра
    const prevMode = previewMode.value
    // Принудительно переключаем на закрытый режим
    previewMode.value = 'closed'
    // Формируем HTML только с закрытым содержимым
    const htmlClosed = olympTableHtml.value
    // Восстанавливаем прежний режим (чтобы UI не сбрасывался)
    previewMode.value = prevMode

    await sendTask(
      store.domain,
      store.gameId,
      store.levelId,
      htmlClosed
    )
    alert('✅ Задание отправлено')
  } catch (e: any) {
    alert('❌ Ошибка отправки задания: ' + e.message)
  }
}

// 2) отправка «Секторов»
async function onSendSector() {
  try {
    for (const row of store.answers) {
      if (!row.inSector) continue
      await sendSector(
        store.domain,
        store.gameId,
        store.levelId,
        row.variants,
        // передаём raw closedText, обработка произойдёт внутри sendSector
        row.closedText
      )
    }
    alert('✅ Все отмеченные сектора отправлены')
  } catch (e: any) {
    alert('❌ Ошибка отправки секторов: ' + e.message)
  }
}

// 3) отправка «Бонусов»
async function onSendBonus() {
  try {
    const bonusesToSend = store.answers.filter((r) => r.inBonus)
    if (bonusesToSend.length === 0) {
      alert('ℹ️ Нет отмеченных бонусов для отправки')
      return
    }
    for (const bonusRow of bonusesToSend) {
      await sendBonuses(
        store.domain,
        store.gameId,
        store.levelId,
        [bonusRow]
      )
    }
    alert('✅ Все отмеченные бонусы отправлены')
  } catch (e: any) {
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
