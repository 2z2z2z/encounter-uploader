<template>
  <div class="min-h-screen bg-blue-50 py-8">
    <div class="container mx-auto bg-white p-12 rounded-md shadow-sm">
      <!-- Заголовок -->
      <h1 class="text-2xl font-semibold text-center">
        {{ typeConfig.label }}
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
            @change="onSectorModeChange"
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
          @click="onFillOpenSectors"
          type="button"
          class="form-button h-10 px-4 flex-1 min-w-[240px]"
        >
          Заполнить открытые сектора
        </button>
      </div>

      <!-- Таблица ответов -->
      <AnswersTable :answers="store.answers" @update="onAnswersUpdate" />

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
            @click="onClear"
            type="button"
            class="form-button h-10 px-4"
          >
            Очистить
          </button>
          <button
            @click="showExport = true"
            type="button"
            class="form-button h-10 px-4"
          >
            Экспорт
          </button>
          <label class="form-button h-10 px-4 cursor-pointer">
            Импорт
            <input
              type="file"
              @change="onImportFile"
              accept=".json,.csv"
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
            :disabled="isUploading"
          >
            Залить задание
          </button>
          <button
            @click="onSendSector"
            type="button"
            class="form-button h-10 px-4"
            :disabled="isUploading"
          >
            Залить секторы
          </button>
          <button
            @click="onSendBonus"
            type="button"
            class="form-button h-10 px-4"
            :disabled="isUploading"
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
    
    <!-- Модальное окно выбора формата Экспорта -->
    <transition name="fade">
      <div
        v-if="showExport"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-md p-6 space-y-4">
          <h2 class="text-xl font-semibold">Выберите формат экспорта</h2>
          <div class="flex gap-4">
            <button
              @click="onExportData('json')"
              class="form-button px-6 py-2"
            >
              JSON
            </button>
            <button
              @click="onExportData('csv')"
              class="form-button px-6 py-2"
            >
              CSV
            </button>
            <button
              @click="showExport = false"
              class="form-button bg-gray-400 hover:bg-gray-500 px-6 py-2"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Компонент прогресса -->
    <UploadProgress />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useUploadStore } from '../../../store'
import { useAuthStore } from '../../../store/auth'
import { useProgressStore } from '../../../store/progress'
import AnswersTable from './AnswersTable.vue'
import UploadProgress from '../../UploadProgress.vue'

import { useOlympLogic } from './composables/useOlympLogic'
import { useExportImport } from './composables/useExportImport'
import { useUpload } from './composables/useUpload'
import type { OlympTypeConfig, SectorMode, BonusTime } from './types'

// Props
const props = defineProps<{
  typeConfig: OlympTypeConfig
}>()

// Stores
const store = useUploadStore()
const authStore = useAuthStore()
const progressStore = useProgressStore()
const router = useRouter()

// Composables
const { 
  initialSectors,
  createAnswers,
  applySectorMode, 
  fillOpenSectors,
  applyQuickTime,
  applyClosedPattern,
  clearFormData,
  validateData
} = useOlympLogic(props.typeConfig.sectors)

const { 
  downloadData,
  handleFileImport 
} = useExportImport()

const { 
  isUploading,
  uploadError,
  generateTaskHtml,
  uploadTask,
  uploadSectors,
  uploadBonuses 
} = useUpload(props.typeConfig.sectors)

// Local state
const error = ref('')
const showPreview = ref(false)
const showExport = ref(false)
const previewMode = ref<'closed' | 'open'>('closed')
const localClosedPattern = ref('')
const sectorMode = ref<SectorMode>('all')
const quickTime = ref<BonusTime>({
  hours: 0,
  minutes: 0,
  seconds: 0,
  negative: false
})

// Computed
const olympTableHtml = computed(() => {
  return generateTaskHtml(store.answers, store.levelId, previewMode.value)
})

// Watchers
watch(quickTime, (newTime) => {
  applyQuickTime(toRefs(store).answers, newTime)
}, { deep: true })

watch(localClosedPattern, (pattern) => {
  store.closedPattern = pattern
  applyClosedPattern(toRefs(store).answers, pattern)
})

// Lifecycle
onMounted(() => {
  // Инициализация данных при монтировании
  if (!store.answers || store.answers.length !== props.typeConfig.sectors) {
    store.answers = createAnswers(props.typeConfig.sectors)
  }
  
  // Загружаем конфигурацию
  sectorMode.value = store.config.sectorMode
  quickTime.value = { ...store.config.bonusTime }
  localClosedPattern.value = store.closedPattern
})

// Methods
function onSectorModeChange() {
  store.config.sectorMode = sectorMode.value
  applySectorMode(sectorMode.value, toRefs(store).answers)
}

function onFillOpenSectors() {
  fillOpenSectors(toRefs(store).answers)
}

function onClear() {
  if (confirm('Вы уверены, что хотите очистить все данные?')) {
    clearFormData(toRefs(store).answers)
    localClosedPattern.value = ''
    sectorMode.value = 'all'
    quickTime.value = { hours: 0, minutes: 0, seconds: 0, negative: false }
  }
}

function onAnswersUpdate() {
  // Если изменили чекбокс сектора вручную - переключаем на кастом
  if (sectorMode.value !== 'custom') {
    const expected = createAnswers(props.typeConfig.sectors)
    applySectorMode(sectorMode.value, toRefs({ answers: ref(expected) }))
    
    const hasManualChanges = store.answers.some((a, i) => 
      a.inSector !== expected[i].inSector
    )
    
    if (hasManualChanges) {
      sectorMode.value = 'custom'
      store.config.sectorMode = 'custom'
    }
  }
}

async function onImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const result = await handleFileImport(
    file,
    toRefs(store).answers,
    toRefs(store).config,
    toRefs(store).closedPattern
  )
  
  if (!result.success) {
    error.value = result.error || 'Ошибка импорта'
  } else {
    // Обновляем локальные значения
    sectorMode.value = store.config.sectorMode
    quickTime.value = { ...store.config.bonusTime }
    localClosedPattern.value = store.closedPattern
    error.value = ''
  }
  
  // Очищаем input
  ;(event.target as HTMLInputElement).value = ''
}

function onExportData(format: 'json' | 'csv') {
  downloadData(
    format,
    store.config,
    store.closedPattern,
    store.answers,
    `${props.typeConfig.type}-${store.levelId}`
  )
  showExport.value = false
}

async function onSendTask() {
  error.value = ''
  
  const validation = validateData(store.answers)
  if (!validation.valid) {
    error.value = validation.errors.join('; ')
    return
  }
  
  const result = await uploadTask(
    store.domain,
    store.gameId,
    store.levelId,
    store.answers
  )
  
  if (!result.success) {
    error.value = result.error || 'Ошибка отправки задания'
  }
}

async function onSendSector() {
  error.value = ''
  
  const validation = validateData(store.answers)
  if (!validation.valid) {
    error.value = validation.errors.join('; ')
    return
  }
  
  const result = await uploadSectors(
    store.domain,
    store.gameId,
    store.levelId,
    store.answers
  )
  
  if (!result.success) {
    error.value = result.error || 'Ошибка отправки секторов'
  }
}

async function onSendBonus() {
  error.value = ''
  
  const validation = validateData(store.answers)
  if (!validation.valid) {
    error.value = validation.errors.join('; ')
    return
  }
  
  const result = await uploadBonuses(
    store.domain,
    store.gameId,
    store.levelId,
    store.answers
  )
  
  if (!result.success) {
    error.value = result.error || 'Ошибка отправки бонусов'
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>