<template>
  <div class="universal-type-100500">
    <!-- Заголовок -->
    <div class="header">
      <h1>100500 секторов и бонусов</h1>
      <p class="author-info">
        автор: <strong>{{ authStore.username }}</strong>,
        домен: <strong>{{ store.domain }}</strong>,
        игра: <strong>{{ store.gameId }}</strong>,
        уровень: <strong>{{ store.levelId }}</strong>
      </p>
    </div>

    <!-- Табы/Блоки -->
    <div class="tabs-section">
      <div class="tabs-header">
        <button
          v-for="(tab, idx) in tabs"
          :key="idx"
          @click="activeTabIndex = idx"
          :class="['tab-btn', { active: activeTabIndex === idx }]"
        >
          Блок {{ idx + 1 }}
        </button>
        <button @click="addTab" class="tab-btn add-tab">+</button>
        <button
          v-if="tabs.length > 1"
          @click="removeCurrentTab"
          class="tab-btn remove-tab"
        >
          -
        </button>
      </div>
    </div>

    <!-- Контент активного таба -->
    <div v-if="currentTab" class="tab-content">
      <!-- Глобальные контролы -->
      <div class="global-controls">
        <!-- Шаблоны названий -->
        <div class="control-group">
          <label>Название секторов</label>
          <input
            v-model="currentTab.sectorPattern"
            placeholder="Текст или &"
            class="control-input"
          />
        </div>

        <div class="control-group">
          <label>Название бонусов</label>
          <input
            v-model="currentTab.bonusPattern"
            placeholder="Текст или &"
            class="control-input"
          />
        </div>

        <!-- Быстрое бонусное время -->
        <div class="control-group">
          <label>Бонусное время (ч, м, с)</label>
          <div class="time-inputs">
            <BonusTimeInput
              :time="currentTab.quickTime"
              :show-preview="false"
              :supports-negative="true"
              @update:time="updateQuickTime"
            />
            <button @click="applyQuickTime" class="apply-btn">
              Применить ко всем
            </button>
          </div>
        </div>
      </div>

      <!-- Дополнительные контролы -->
      <div class="additional-controls">
        <!-- Шаблоны для бонусов -->
        <div class="control-group">
          <label>Бонусные задания</label>
          <input
            v-model="currentTab.bonusTaskPattern"
            placeholder="Текст или код"
            class="control-input"
          />
        </div>

        <div class="control-group">
          <label>Подсказки (по факту выполнения)</label>
          <input
            v-model="currentTab.bonusHintPattern"
            placeholder="Текст или код"
            class="control-input"
          />
        </div>

        <!-- Управление уровнями -->
        <div class="control-group">
          <button @click="showBonusLevels = true" class="control-btn">
            Уровни бонусов
          </button>
          <button @click="showCodeGenerator = true" class="control-btn">
            Добавить коды
          </button>
        </div>
      </div>

      <!-- Основная таблица -->
      <div class="main-table">
        <div class="table-header">
          <span>#</span>
          <span>Ответ</span>
          <span>Сектор</span>
          <span>Бонус</span>
          <span>Уровни бонуса</span>
          <span>Бонусное время</span>
          <span>Задержка</span>
          <span>Ограничение</span>
          <span>Название сектора</span>
          <span>Название бонуса</span>
          <span>Бонусное задание</span>
          <span>Подсказка</span>
          <span>Действия</span>
        </div>

        <div
          v-for="(row, index) in currentTab.rows"
          :key="row.number"
          class="table-row"
        >
          <!-- Номер -->
          <div class="row-number">{{ row.number }}</div>

          <!-- Варианты ответов -->
          <div class="row-variants">
            <AnswerInput
              :variants="row.variants"
              placeholder="код"
              :min-variants="1"
              :max-variants="10"
              @update:variants="updateRowVariants(row.number, $event)"
            />
          </div>

          <!-- Чекбоксы -->
          <div class="row-checkbox">
            <input
              type="checkbox"
              v-model="row.inSector"
              @change="updateRow(row.number)"
            />
          </div>

          <div class="row-checkbox">
            <input
              type="checkbox"
              v-model="row.inBonus"
              @change="updateRow(row.number)"
            />
          </div>

          <!-- Уровни бонуса -->
          <div class="row-levels">
            <div v-if="row.allLevels" class="all-levels">Все</div>
            <div v-else class="specific-levels">
              {{ row.targetLevels?.length || 0 }}
            </div>
          </div>

          <!-- Время бонуса -->
          <div class="row-time">
            <BonusTimeInput
              :time="row.bonusTime"
              :show-preview="false"
              :supports-negative="true"
              @update:time="updateRowTime(row.number, $event)"
            />
          </div>

          <!-- Задержка -->
          <div class="row-delay">
            <BonusTimeInput
              :time="row.delay"
              :show-preview="false"
              :supports-negative="false"
              @update:time="updateRowDelay(row.number, $event)"
            />
          </div>

          <!-- Ограничение -->
          <div class="row-limit">
            <BonusTimeInput
              :time="row.relativeLimit"
              :show-preview="false"
              :supports-negative="false"
              @update:time="updateRowLimit(row.number, $event)"
            />
          </div>

          <!-- Название сектора -->
          <div class="row-input">
            <input
              v-model="row.sectorName"
              placeholder="Название сектора"
              class="text-input"
              @input="updateRow(row.number)"
            />
          </div>

          <!-- Название бонуса -->
          <div class="row-input">
            <input
              v-model="row.bonusName"
              placeholder="Название бонуса"
              class="text-input"
              @input="updateRow(row.number)"
            />
          </div>

          <!-- Бонусное задание -->
          <div class="row-input">
            <input
              v-model="row.bonusTask"
              placeholder="HTML/текст бонусного задания"
              class="text-input"
              @input="updateRow(row.number)"
            />
          </div>

          <!-- Подсказка -->
          <div class="row-input">
            <input
              v-model="row.bonusHint"
              placeholder="HTML/текст подсказки"
              class="text-input"
              @input="updateRow(row.number)"
            />
          </div>

          <!-- Действия -->
          <div class="row-actions">
            <button @click="duplicateRow(row.number)" class="action-btn" title="Дублировать">
              📄
            </button>
            <button @click="removeRow(row.number)" class="action-btn" title="Удалить">
              ✕
            </button>
          </div>
        </div>

        <!-- Добавить строку -->
        <div class="add-row">
          <button @click="addRow" class="add-row-btn">
            + Добавить строку
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
        <button @click="clearCurrentTab" class="clear-btn">Очистить</button>
        <button @click="exportData" class="export-btn">Экспорт</button>
        <label class="import-label">
          <input type="file" @change="importData" accept=".json,.csv" style="display: none" />
          <span class="import-btn">Импорт</span>
        </label>
      </div>

      <div class="right-controls">
        <div class="upload-group">
          <label class="merge-checkbox">
            <input type="checkbox" v-model="combineSectors" />
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

    <!-- Модальные окна -->
    <!-- Генератор кодов -->
    <transition name="fade">
      <div v-if="showCodeGenerator" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Генератор кодов</h3>
            <button @click="showCodeGenerator = false" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="generator-controls">
              <div class="control-group">
                <label>Количество строк:</label>
                <input v-model.number="genCount" type="number" min="1" class="control-input" />
              </div>
              <div class="control-group">
                <label>Количество цифр:</label>
                <input v-model.number="genDigits" type="number" min="1" max="10" class="control-input" />
              </div>
            </div>
            <div class="generator-preview">
              <textarea
                v-model="codesText"
                placeholder="Коды (по одному на строку)"
                rows="10"
                class="codes-textarea"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="generateCodes" class="generate-btn">Генерировать</button>
            <button @click="codesText = ''" class="clear-btn">Очистить</button>
            <button @click="applyCodes" class="apply-btn">Готово</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Управление уровнями бонусов -->
    <transition name="fade">
      <div v-if="showBonusLevels" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Уровни бонусов</h3>
            <button @click="showBonusLevels = false" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <LevelSelector
              :config="bonusLevelsConfig"
              :available-levels="availableLevels"
              label="Настройка доступности бонусов"
              @update:config="updateBonusLevelsConfig"
            />
          </div>
          <div class="modal-footer">
            <button @click="applyBonusLevels" class="apply-btn">Применить ко всем</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUploadStore } from '../../store/index'
import { useAuthStore } from '../../store/auth'
import { useProgressStore } from '../../store/progress'
import { sendSector, sendBonuses } from '../../services/uploader'
import AnswerInput from './forms/AnswerInput.vue'
import BonusTimeInput from './forms/BonusTimeInput.vue'
import LevelSelector from './forms/LevelSelector.vue'

// ============================================================================
// TYPES
// ============================================================================

interface BonusTime {
  hours: number
  minutes: number
  seconds: number
  negative?: boolean
}

interface Row {
  number: number
  variants: string[]
  bonusTime: BonusTime
  delay: BonusTime
  relativeLimit: BonusTime
  sectorName: string
  bonusName: string
  bonusTask?: string
  bonusHint?: string
  inSector: boolean
  inBonus: boolean
  targetLevels?: string[]
  allLevels?: boolean
}

interface TabData {
  sectorPattern: string
  bonusPattern: string
  bonusTaskPattern?: string
  bonusHintPattern?: string
  quickTime: BonusTime
  rows: Row[]
}

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

const tabs = ref<TabData[]>([])
const activeTabIndex = ref(0)
const uploading = ref(false)
const combineSectors = ref(false)

// Модальные окна
const showCodeGenerator = ref(false)
const showBonusLevels = ref(false)

// Генератор кодов
const codesText = ref('')
const genCount = ref(1)
const genDigits = ref(4)

// Конфигурация уровней бонусов
const bonusLevelsConfig = ref({
  allLevels: false,
  specificLevels: [1],
  levelCheckboxNames: ['level_1']
})

// ============================================================================
// COMPUTED
// ============================================================================

const currentTab = computed(() => tabs.value[activeTabIndex.value])

const hasValidSectors = computed(() => {
  if (!currentTab.value) return false
  return currentTab.value.rows.some(row => 
    row.inSector && row.variants.some(v => v.trim())
  )
})

const hasValidBonuses = computed(() => {
  if (!currentTab.value) return false
  return currentTab.value.rows.some(row => 
    row.inBonus && row.variants.some(v => v.trim())
  )
})

const availableLevels = computed(() => {
  return Array.from({ length: 50 }, (_, i) => ({
    value: i + 1,
    label: `Уровень ${i + 1}`,
    checkboxName: `level_${i + 1}`
  }))
})

const codesCount = computed(() =>
  codesText.value
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l).length
)

// ============================================================================
// METHODS - TAB MANAGEMENT
// ============================================================================

function createTab(): TabData {
  return {
    sectorPattern: '',
    bonusPattern: '',
    bonusTaskPattern: '',
    bonusHintPattern: '',
    quickTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
    rows: [createRow(1)]
  }
}

function createRow(number: number): Row {
  return {
    number,
    variants: [''],
    bonusTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
    delay: { hours: 0, minutes: 0, seconds: 0 },
    relativeLimit: { hours: 0, minutes: 0, seconds: 0 },
    sectorName: '',
    bonusName: '',
    bonusTask: '',
    bonusHint: '',
    inSector: true,
    inBonus: true,
    targetLevels: [],
    allLevels: false
  }
}

function addTab() {
  tabs.value.push(createTab())
  activeTabIndex.value = tabs.value.length - 1
}

function removeCurrentTab() {
  if (tabs.value.length <= 1) return
  
  tabs.value.splice(activeTabIndex.value, 1)
  if (activeTabIndex.value >= tabs.value.length) {
    activeTabIndex.value = tabs.value.length - 1
  }
}

function addRow() {
  if (!currentTab.value) return
  
  const newNumber = Math.max(...currentTab.value.rows.map(r => r.number), 0) + 1
  currentTab.value.rows.push(createRow(newNumber))
}

function removeRow(number: number) {
  if (!currentTab.value) return
  
  const index = currentTab.value.rows.findIndex(r => r.number === number)
  if (index !== -1) {
    currentTab.value.rows.splice(index, 1)
  }
}

function duplicateRow(number: number) {
  if (!currentTab.value) return
  
  const originalRow = currentTab.value.rows.find(r => r.number === number)
  if (!originalRow) return
  
  const newNumber = Math.max(...currentTab.value.rows.map(r => r.number), 0) + 1
  const duplicatedRow = {
    ...JSON.parse(JSON.stringify(originalRow)),
    number: newNumber
  }
  
  currentTab.value.rows.push(duplicatedRow)
}

// ============================================================================
// METHODS - ROW UPDATES
// ============================================================================

function updateRowVariants(number: number, variants: string[]) {
  if (!currentTab.value) return
  
  const row = currentTab.value.rows.find(r => r.number === number)
  if (row) {
    row.variants = variants
  }
}

function updateRowTime(number: number, time: BonusTime) {
  if (!currentTab.value) return
  
  const row = currentTab.value.rows.find(r => r.number === number)
  if (row) {
    row.bonusTime = time
  }
}

function updateRowDelay(number: number, delay: BonusTime) {
  if (!currentTab.value) return
  
  const row = currentTab.value.rows.find(r => r.number === number)
  if (row) {
    row.delay = delay
  }
}

function updateRowLimit(number: number, limit: BonusTime) {
  if (!currentTab.value) return
  
  const row = currentTab.value.rows.find(r => r.number === number)
  if (row) {
    row.relativeLimit = limit
  }
}

function updateRow(number: number) {
  // Триггер для реактивности
}

// ============================================================================
// METHODS - QUICK ACTIONS
// ============================================================================

function updateQuickTime(time: BonusTime) {
  if (!currentTab.value) return
  currentTab.value.quickTime = time
}

function applyQuickTime() {
  if (!currentTab.value) return
  
  currentTab.value.rows.forEach(row => {
    row.bonusTime = { ...currentTab.value!.quickTime }
  })
}

function generateCodes() {
  const codes = []
  for (let i = 0; i < genCount.value; i++) {
    let code = ''
    for (let j = 0; j < genDigits.value; j++) {
      code += Math.floor(Math.random() * 10)
    }
    codes.push(code)
  }
  codesText.value = codes.join('\n')
}

function applyCodes() {
  if (!currentTab.value) return
  
  const codes = codesText.value
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l)
  
  codes.forEach((code, index) => {
    if (index < currentTab.value!.rows.length) {
      currentTab.value!.rows[index].variants = [code]
    } else {
      const newRow = createRow(currentTab.value!.rows.length + 1)
      newRow.variants = [code]
      currentTab.value!.rows.push(newRow)
    }
  })
  
  showCodeGenerator.value = false
  codesText.value = ''
}

function updateBonusLevelsConfig(config: any) {
  bonusLevelsConfig.value = config
}

function applyBonusLevels() {
  if (!currentTab.value) return
  
  currentTab.value.rows.forEach(row => {
    row.allLevels = bonusLevelsConfig.value.allLevels
    row.targetLevels = bonusLevelsConfig.value.levelCheckboxNames || []
  })
  
  showBonusLevels.value = false
}

// ============================================================================
// METHODS - DATA MANAGEMENT
// ============================================================================

function clearCurrentTab() {
  if (!currentTab.value) return
  
  if (confirm('Очистить данные текущего блока?')) {
    currentTab.value.rows = [createRow(1)]
  }
}

function exportData() {
  const data = {
    type: 'type100500',
    tabs: tabs.value,
    activeTab: activeTabIndex.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `type100500_level_${store.levelId}.json`
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
      const obj = JSON.parse(text)
      
      if (obj.tabs && Array.isArray(obj.tabs)) {
        tabs.value = obj.tabs.map((tab: any) => ({
          ...createTab(),
          ...tab,
          rows: (tab.rows || []).map((row: any, idx: number) => ({
            ...createRow(idx + 1),
            ...row
          }))
        }))
        
        if (typeof obj.activeTab === 'number') {
          activeTabIndex.value = Math.min(obj.activeTab, tabs.value.length - 1)
        }
      } else {
        alert('Неверный формат файла')
      }
    } catch (err) {
      alert('Ошибка при импорте: ' + (err as any)?.message)
    }
  }
  reader.readAsText(file)
}

function goBack() {
  router.push('/settings')
}

// ============================================================================
// METHODS - UPLOAD
// ============================================================================

async function uploadSectors() {
  if (!hasValidSectors.value || !currentTab.value) return
  
  uploading.value = true
  
  try {
    const sectors = currentTab.value.rows.filter(row => 
      row.inSector && row.variants.some(v => v.trim())
    )
    
    for (const row of sectors) {
      await sendSector(
        store.domain,
        store.gameId,
        store.levelId,
        row.variants.filter(v => v.trim()),
        row.sectorName
      )
    }
    
    alert(`Успешно загружено ${sectors.length} секторов`)
    
  } catch (err) {
    alert('Ошибка загрузки секторов: ' + (err as any)?.message)
  } finally {
    uploading.value = false
  }
}

async function uploadBonuses() {
  if (!hasValidBonuses.value || !currentTab.value) return
  
  uploading.value = true
  
  try {
    const bonuses = currentTab.value.rows.filter(row => 
      row.inBonus && row.variants.some(v => v.trim())
    )
    
    const bonusData = bonuses.map(row => ({
      name: row.bonusName || `Бонус ${row.number}`,
      variants: row.variants.filter(v => v.trim()),
      time: row.bonusTime,
      allLevels: row.allLevels || false,
      levelCheckboxNames: row.targetLevels || [`level_${store.levelId}`]
    }))
    
    await sendBonuses(store.domain, store.gameId, store.levelId, bonusData)
    
    alert(`Успешно загружено ${bonuses.length} бонусов`)
    
  } catch (err) {
    alert('Ошибка загрузки бонусов: ' + (err as any)?.message)
  } finally {
    uploading.value = false
  }
}

// ============================================================================
// WATCHERS
// ============================================================================

// Автоматическое обновление названий секторов по шаблону
watch(
  [() => currentTab.value?.sectorPattern, () => activeTabIndex.value],
  ([pattern, tabIdx], [oldPattern, oldTabIdx]) => {
    if (tabIdx !== oldTabIdx) return
    if (pattern === oldPattern) return
    if (!currentTab.value || pattern === undefined) return
    
    currentTab.value.rows.forEach((row, idx) => {
      row.sectorName = pattern.replace(/&/g, String(idx + 1))
    })
  }
)

// Автоматическое обновление названий бонусов по шаблону
watch(
  [() => currentTab.value?.bonusPattern, () => activeTabIndex.value],
  ([pattern, tabIdx], [oldPattern, oldTabIdx]) => {
    if (tabIdx !== oldTabIdx) return
    if (pattern === oldPattern) return
    if (!currentTab.value || pattern === undefined) return
    
    currentTab.value.rows.forEach((row, idx) => {
      row.bonusName = pattern.replace(/&/g, String(idx + 1))
    })
  }
)

// Сохранение в localStorage
watch(
  tabs,
  (val) => {
    const data = { tabs: val, activeTab: activeTabIndex.value }
    localStorage.setItem('type100500-universal', JSON.stringify(data))
  },
  { deep: true }
)

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  // Загрузка данных из localStorage
  const saved = localStorage.getItem('type100500-universal')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.tabs && Array.isArray(data.tabs)) {
        tabs.value = data.tabs.map((tab: any) => ({
          ...createTab(),
          ...tab,
          rows: (tab.rows || []).map((row: any, idx: number) => ({
            ...createRow(idx + 1),
            ...row
          }))
        }))
        
        if (typeof data.activeTab === 'number') {
          activeTabIndex.value = Math.min(data.activeTab, tabs.value.length - 1)
        }
      }
    } catch {
      tabs.value = [createTab()]
    }
  } else {
    tabs.value = [createTab()]
  }
  
  console.log('🚀 UniversalType100500 инициализирован')
})
</script>

<style scoped>
.universal-type-100500 {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 10px 0;
  color: #2563eb;
  font-size: 1.8rem;
}

.author-info {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.tabs-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.tabs-header {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn:not(.add-tab):not(.remove-tab) {
  background: #e5e7eb;
  color: #374151;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
}

.tab-btn.add-tab {
  background: #10b981;
  color: white;
}

.tab-btn.remove-tab {
  background: #ef4444;
  color: white;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.global-controls,
.additional-controls {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.control-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.control-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.time-inputs {
  display: flex;
  align-items: end;
  gap: 10px;
}

.apply-btn,
.control-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
}

.apply-btn:hover,
.control-btn:hover {
  background-color: #059669;
}

.main-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 120px 60px 60px 80px 120px 120px 120px 120px 120px 150px 120px 80px;
  gap: 10px;
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 0.8rem;
  color: #374151;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 120px 60px 60px 80px 120px 120px 120px 120px 120px 150px 120px 80px;
  gap: 10px;
  padding: 15px 20px;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
}

.table-row:hover {
  background-color: #f9fafb;
}

.row-number {
  text-align: center;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
}

.row-checkbox {
  text-align: center;
}

.row-checkbox input {
  transform: scale(1.2);
}

.row-levels,
.all-levels,
.specific-levels {
  text-align: center;
  font-size: 0.8rem;
  color: #6b7280;
}

.all-levels {
  color: #16a34a;
  font-weight: 500;
}

.text-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8rem;
}

.text-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.row-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.add-row {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.add-row-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.add-row-btn:hover {
  background: #2563eb;
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
  margin-top: 20px;
}

.left-controls,
.center-controls,
.right-controls {
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

/* Модальные окна */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
}

.modal-header h3 {
  margin: 0;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 0 20px 20px 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.generator-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.codes-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: monospace;
  resize: vertical;
}

.generate-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.generate-btn:hover {
  background: #7c3aed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

