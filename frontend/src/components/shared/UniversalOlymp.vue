<template>
  <div class="universal-olymp">
    <!-- Заголовок с информацией -->
    <div class="olymp-header">
      <h1>{{ olympTypeLabel }}</h1>
      <p class="author-info">
        автор: <strong>{{ authStore.username }}</strong>,
        домен: <strong>{{ store.domain }}</strong>,
        игра: <strong>{{ store.gameId }}</strong>,
        уровень: <strong>{{ store.levelId }}</strong>
      </p>
    </div>

    <!-- Ошибки -->
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Глобальные контролы -->
    <div class="global-controls">
      <!-- Режим закрытия уровня -->
      <div class="control-group">
        <label>Закрытие уровня</label>
        <select v-model="sectorMode" @change="applySectorMode" class="control-select">
          <option value="all">Все сектора</option>
          <option value="initialAndFinal">Начальные + финал</option>
          <option value="finalOnly">Только финал</option>
          <option value="custom">Кастом</option>
        </select>
      </div>

      <!-- Быстрое бонусное время -->
      <div class="control-group">
        <label>Бонусное время (ч, м, с)</label>
        <div class="time-inputs">
          <input
            type="number"
            min="0"
            v-model.number="quickTime.hours"
            placeholder="ч"
            class="time-input"
          />
          <input
            type="number"
            min="0"
            v-model.number="quickTime.minutes"
            placeholder="м"
            class="time-input"
          />
          <input
            type="number"
            min="0"
            v-model.number="quickTime.seconds"
            placeholder="с"
            class="time-input"
          />
          <label class="negative-checkbox">
            <input type="checkbox" v-model="quickTime.negative" />
            <span>–</span>
          </label>
          <button @click="applyQuickTime" class="apply-btn">Применить ко всем</button>
        </div>
      </div>

      <!-- Быстрые действия -->
      <div class="control-group">
        <label>Быстрые действия</label>
        <div class="quick-actions">
          <button @click="fillRandomCodes" class="action-btn">Коды</button>
          <button @click="addRow" class="action-btn">+ Строка</button>
          <button @click="removeLastRow" class="action-btn">- Строка</button>
          <button @click="clearAll" class="action-btn danger">Очистить</button>
        </div>
      </div>
    </div>

    <!-- Превью таблицы -->
    <div class="preview-section">
      <div class="preview-controls">
        <label>Превью:</label>
        <div class="preview-modes">
          <label class="mode-option">
            <input type="radio" v-model="previewMode" value="closed" />
            <span>Закрытые</span>
          </label>
          <label class="mode-option">
            <input type="radio" v-model="previewMode" value="open" />
            <span>Открытые</span>
          </label>
        </div>
        <button @click="copyTableHtml" class="copy-btn">Скопировать HTML</button>
      </div>
      
      <div class="table-preview" v-html="olympTableHtml"></div>
    </div>

    <!-- Основная таблица ответов -->
    <div class="answers-table">
      <div class="table-header">
        <span class="col-number">#</span>
        <span class="col-variants">Варианты ответов</span>
        <span class="col-sector">Сектор</span>
        <span class="col-bonus">Бонус</span>
        <span class="col-time">Время</span>
        <span class="col-closed">Закрытый</span>
        <span class="col-open">Открытый</span>
        <span class="col-actions">Действия</span>
      </div>

      <div
        v-for="(answer, index) in store.answers"
        :key="answer.number"
        class="answer-row"
      >
        <!-- Номер -->
        <div class="answer-number">{{ answer.number }}</div>

        <!-- Варианты ответов -->
        <div class="answer-variants">
          <AnswerInput
            :variants="answer.variants"
            placeholder="Код"
            :min-variants="1"
            @update:variants="updateAnswerVariants(answer.number, $event)"
          />
        </div>

        <!-- Чекбокс сектора -->
        <div class="answer-checkbox">
          <input
            type="checkbox"
            v-model="answer.inSector"
            @change="updateAnswer(answer.number)"
          />
        </div>

        <!-- Чекбокс бонуса -->
        <div class="answer-checkbox">
          <input
            type="checkbox"
            v-model="answer.inBonus"
            @change="updateAnswer(answer.number)"
          />
        </div>

        <!-- Время бонуса -->
        <div class="answer-time">
          <BonusTimeInput
            :time="answer.bonusTime"
            :show-preview="false"
            :supports-negative="true"
            @update:time="updateBonusTime(answer.number, $event)"
          />
        </div>

        <!-- Закрытый текст -->
        <div class="answer-text">
          <input
            type="text"
            v-model="answer.closedText"
            placeholder="Закрытый"
            class="text-input"
            @input="updateAnswer(answer.number)"
          />
        </div>

        <!-- Открытый текст -->
        <div class="answer-text">
          <input
            type="text"
            v-model="answer.displayText"
            placeholder="Открытый"
            class="text-input"
            @input="updateAnswer(answer.number)"
          />
        </div>

        <!-- Действия -->
        <div class="answer-actions">
          <button @click="duplicateAnswer(answer.number)" class="action-btn small" title="Дублировать">
            📄
          </button>
        </div>
      </div>
    </div>

    <!-- Нижние контролы -->
    <div class="bottom-controls">
      <div class="left-controls">
        <button @click="goBack" class="back-btn">Назад</button>
      </div>

      <div class="center-controls">
        <button @click="clearAll" class="clear-btn">Очистить</button>
        <button @click="exportData" class="export-btn">Экспорт</button>
        <label class="import-label">
          <input type="file" @change="importData" accept=".json,.csv" style="display: none" />
          <span class="import-btn">Импорт</span>
        </label>
      </div>

      <div class="right-controls">
        <div class="upload-group">
          <label class="merge-checkbox">
            <input type="checkbox" v-model="shouldMergeSectors" />
            <span>Объединить секторы (БМП)</span>
          </label>
          <button
            @click="uploadSectors"
            :disabled="uploading || !hasValidSectors"
            class="upload-btn sectors"
          >
            {{ uploading ? 'Загрузка...' : 'Залить секторы' }}
          </button>
          <button
            @click="uploadBonuses"
            :disabled="uploading || !hasValidBonuses"
            class="upload-btn bonuses"
          >
            {{ uploading ? 'Загрузка...' : 'Залить бонусы' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Секторов:</span>
        <span class="stat-value">{{ stats.sectors }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Бонусов:</span>
        <span class="stat-value">{{ stats.bonuses }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Всего:</span>
        <span class="stat-value">{{ sectorCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUploadStore } from '../../store/index'
import { useAuthStore } from '../../store/auth'
import { useProgressStore } from '../../store/progress'
import { sendTask, sendSector, sendBonuses } from '../../services/uploader'
import { generateOlympLayout, type Cell } from '../../utils/olymp'
import { parseCsv } from '../../utils/csv'
import AnswerInput from './forms/AnswerInput.vue'
import BonusTimeInput from './forms/BonusTimeInput.vue'

// ============================================================================
// PROPS
// ============================================================================

interface Props {
  sectorCount: 15 | 31 | 63 | 127  // Поддерживаемые типы олимпиек
}

const props = defineProps<Props>()

// ============================================================================
// COMPOSABLES
// ============================================================================

const router = useRouter()
const store = useUploadStore()
const authStore = useAuthStore()
const progress = useProgressStore()

// ============================================================================
// REACTIVE DATA
// ============================================================================

const error = ref<string>('')
const uploading = ref<boolean>(false)
const sectorMode = ref<string>('all')
const previewMode = ref<'closed' | 'open'>('closed')
const shouldMergeSectors = ref<boolean>(false)

const quickTime = ref({
  hours: 0,
  minutes: 0,
  seconds: 0,
  negative: false
})

// ============================================================================
// COMPUTED
// ============================================================================

const olympTypeLabel = computed(() => {
  return `Олимпийка (${props.sectorCount} секторов)`
})

const hasValidSectors = computed(() => {
  return store.answers.some(a => a.inSector && a.variants.some(v => v.trim()))
})

const hasValidBonuses = computed(() => {
  return store.answers.some(a => a.inBonus && a.variants.some(v => v.trim()))
})

const stats = computed(() => {
  const sectors = store.answers.filter(a => a.inSector).length
  const bonuses = store.answers.filter(a => a.inBonus).length
  return { sectors, bonuses }
})

// HTML генерация олимпийской таблицы
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
  
  const layout: Cell[][] = generateOlympLayout(props.sectorCount, store.levelId)

  let html = style + '<table class="olymp">'
  layout.forEach((row) => {
    html += '<tr>'
    row.forEach((cell) => {
      if (!cell.id) return
      const num = parseInt(cell.id.split('_')[1], 10)
      const answer = store.answers[num - 1]
      if (!answer) return
      
      // Выбираем между closed и open
      let rawText = previewMode.value === 'closed' 
        ? answer.closedText 
        : answer.displayText || answer.closedText

      // Если это ссылка, формируем <a><img>
      const content = formatClosedText(rawText)

      // Если в режиме «open» и есть displayText, оборачиваем в <p class="up">
      let cellHtml = content
      if (
        previewMode.value === 'open' &&
        answer.displayText &&
        !/^https?:\/\//i.test(rawText.trim())
      ) {
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

// ============================================================================
// METHODS
// ============================================================================

function initializeAnswers() {
  // Инициализируем ответы для данного количества секторов
  if (store.answers.length !== props.sectorCount) {
    const answers = Array.from({ length: props.sectorCount }, (_, index) => ({
      number: index + 1,
      variants: [''],
      inSector: true,
      inBonus: true,
      bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
      closedText: '',
      displayText: ''
    }))
    store.$patch({ answers })
  }
}

function updateAnswerVariants(answerNumber: number, variants: string[]) {
  const answerIndex = store.answers.findIndex(a => a.number === answerNumber)
  if (answerIndex !== -1) {
    store.answers[answerIndex].variants = variants
  }
}

function updateBonusTime(answerNumber: number, time: any) {
  const answerIndex = store.answers.findIndex(a => a.number === answerNumber)
  if (answerIndex !== -1) {
    store.answers[answerIndex].bonusTime = time
  }
}

function updateAnswer(answerNumber: number) {
  // Триггер для реактивности
  store.$patch({})
}

function applyQuickTime() {
  store.answers.forEach(answer => {
    if (answer.inBonus) {
      answer.bonusTime = { ...quickTime.value }
    }
  })
}

function applySectorMode() {
  switch (sectorMode.value) {
    case 'all':
      store.answers.forEach(a => { a.inSector = true })
      break
    case 'finalOnly':
      store.answers.forEach((a, i) => { 
        a.inSector = i === store.answers.length - 1 
      })
      break
    case 'initialAndFinal':
      const half = Math.floor(props.sectorCount / 2)
      store.answers.forEach((a, i) => { 
        a.inSector = i < half || i === store.answers.length - 1 
      })
      break
    case 'custom':
      // Пользователь сам настраивает
      break
  }
}

function fillRandomCodes() {
  store.answers.forEach(answer => {
    if (answer.variants.length === 0 || answer.variants[0] === '') {
      answer.variants = [Math.floor(1000 + Math.random() * 9000).toString()]
    }
  })
}

function addRow() {
  const newNumber = store.answers.length + 1
  store.answers.push({
    number: newNumber,
    variants: [''],
    inSector: true,
    inBonus: true,
    bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
    closedText: '',
    displayText: ''
  })
}

function removeLastRow() {
  if (store.answers.length > 1) {
    store.answers.pop()
  }
}

function clearAll() {
  if (confirm('Очистить все данные?')) {
    initializeAnswers()
  }
}

function duplicateAnswer(answerNumber: number) {
  const original = store.answers.find(a => a.number === answerNumber)
  if (original) {
    const newNumber = store.answers.length + 1
    store.answers.push({
      ...JSON.parse(JSON.stringify(original)),
      number: newNumber
    })
  }
}

function formatClosedText(text: string): string {
  if (!text) return ''
  if (/^https?:\/\//i.test(text.trim())) {
    return `<a href="${text}" target="_blank"><img src="${text}" alt="Изображение" style="max-width:100px;max-height:100px;" /></a>`
  }
  return text
}

function copyTableHtml() {
  navigator.clipboard.writeText(olympTableHtml.value).then(() => {
    alert('HTML скопирован в буфер обмена')
  })
}

function goBack() {
  router.push('/settings')
}

function exportData() {
  const data = {
    config: {
      sectorCount: props.sectorCount,
      type: 'olymp'
    },
    answers: store.answers,
    levelId: store.levelId
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `olymp_${props.sectorCount}_level_${store.levelId}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const text = String(reader.result || '')
      const trimmed = text.trim()
      
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        // JSON импорт
        const obj = JSON.parse(text)
        if (Array.isArray(obj.answers) && obj.config) {
          const { levelId, ...rest } = obj
          store.$patch(rest)
        } else {
          alert('Неверный формат JSON')
        }
      } else {
        // CSV импорт
        const rows = parseCsv(text)
        if (!rows.length) {
          alert('CSV пустой')
          return
        }
        const answers = rows.map((r) => ({
          number: Number(r.number) || 0,
          variants: (r.variants || '').split('|').map((s: string) => s.trim()).filter(Boolean),
          inSector: r.inSector === '1' || /true/i.test(r.inSector || ''),
          inBonus: r.inBonus === '1' || /true/i.test(r.inBonus || ''),
          bonusTime: {
            hours: Number(r.bonusHours) || 0,
            minutes: Number(r.bonusMinutes) || 0,
            seconds: Number(r.bonusSeconds) || 0,
            negative: r.bonusNegative === '1' || /true|-/i.test(r.bonusNegative || ''),
          },
          closedText: r.closedText || '',
          displayText: r.displayText || '',
        }))
        
        // Сортируем по номеру и заполняем пропуски
        answers.sort((a, b) => a.number - b.number)
        const normalized = answers.map((a, idx) => ({ ...a, number: idx + 1 }))
        store.$patch({ answers: normalized })
      }
    } catch (err) {
      alert('Ошибка при импорте: ' + (err as any)?.message)
    }
  }
  reader.readAsText(file)
}

async function uploadSectors() {
  if (!hasValidSectors.value) return
  
  uploading.value = true
  error.value = ''
  
  try {
    // Формируем данные для секторов
    const sectorAnswers = store.answers.filter(a => a.inSector && a.variants.some(v => v.trim()))
    
    for (const answer of sectorAnswers) {
      await sendSector(
        store.domain,
        store.gameId,
        store.levelId,
        answer.variants.filter(v => v.trim()),
        ''  // Олимпийки не используют названия секторов
      )
    }
    
    // Отправляем задание (HTML таблицу)
    await sendTask(store.domain, store.gameId, store.levelId, olympTableHtml.value)
    
    alert(`Успешно загружено ${sectorAnswers.length} секторов`)
    
  } catch (err) {
    error.value = 'Ошибка загрузки секторов: ' + (err as any)?.message
  } finally {
    uploading.value = false
  }
}

async function uploadBonuses() {
  if (!hasValidBonuses.value) return
  
  uploading.value = true
  error.value = ''
  
  try {
    const bonusAnswers = store.answers.filter(a => a.inBonus && a.variants.some(v => v.trim()))
    
    const bonuses = bonusAnswers.map(answer => ({
      name: `Бонус ${answer.number}`,
      variants: answer.variants.filter(v => v.trim()),
      time: answer.bonusTime,
      allLevels: false,
      levelCheckboxNames: [`level_${store.levelId}`]
    }))
    
    await sendBonuses(store.domain, store.gameId, store.levelId, bonuses)
    
    alert(`Успешно загружено ${bonuses.length} бонусов`)
    
  } catch (err) {
    error.value = 'Ошибка загрузки бонусов: ' + (err as any)?.message
  } finally {
    uploading.value = false
  }
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  initializeAnswers()
  console.log(`🏛️ Универсальная олимпийка инициализирована: ${props.sectorCount} секторов`)
})
</script>

<style scoped>
.universal-olymp {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.olymp-header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.olymp-header h1 {
  margin: 0 0 10px 0;
  color: #2563eb;
  font-size: 1.8rem;
}

.author-info {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.error-message {
  background-color: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #fca5a5;
}

.global-controls {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.control-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  width: 50px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.negative-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-weight: bold;
}

.apply-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.apply-btn:hover {
  background-color: #059669;
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  background-color: #6366f1;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #4f46e5;
}

.action-btn.danger {
  background-color: #dc2626;
}

.action-btn.danger:hover {
  background-color: #b91c1c;
}

.action-btn.small {
  padding: 4px 8px;
  font-size: 0.8rem;
}

.preview-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.preview-controls label {
  font-weight: 500;
  color: #374151;
}

.preview-modes {
  display: flex;
  gap: 15px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 0.9rem;
}

.copy-btn {
  background-color: #0891b2;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.copy-btn:hover {
  background-color: #0e7490;
}

.table-preview {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 20px;
  background: #fafafa;
  overflow-x: auto;
}

.answers-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 180px 120px 120px 80px;
  gap: 10px;
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 0.9rem;
  color: #374151;
}

.answer-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 180px 120px 120px 80px;
  gap: 10px;
  padding: 15px 20px;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
}

.answer-row:hover {
  background-color: #f9fafb;
}

.answer-number {
  text-align: center;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
}

.answer-checkbox {
  text-align: center;
}

.answer-checkbox input {
  transform: scale(1.2);
}

.text-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
}

.text-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.bottom-controls {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.left-controls, .center-controls, .right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.center-controls {
  justify-self: center;
}

.back-btn {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.back-btn:hover {
  background-color: #4b5563;
}

.clear-btn {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.clear-btn:hover {
  background-color: #d97706;
}

.export-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.export-btn:hover {
  background-color: #059669;
}

.import-label {
  cursor: pointer;
}

.import-btn {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-block;
}

.import-btn:hover {
  background-color: #2563eb;
}

.upload-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.merge-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
}

.upload-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.upload-btn.sectors {
  background-color: #2563eb;
  color: white;
}

.upload-btn.sectors:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.upload-btn.bonuses {
  background-color: #dc2626;
  color: white;
}

.upload-btn.bonuses:hover:not(:disabled) {
  background-color: #b91c1c;
}

.upload-btn:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2563eb;
  margin-top: 4px;
}
</style>
