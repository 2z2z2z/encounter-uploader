<template>
  <div class="tabs-layout">
    <!-- Tabs Header -->
    <div class="tabs-section">
      <div class="tabs-header">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          @click="activeTabIndex = index"
          :class="['tab-btn', { active: activeTabIndex === index }]"
        >
          {{ tab.name }}
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

    <!-- Current Tab Content -->
    <div v-if="currentTab" class="tab-content">
      <!-- Tab Controls -->
      <div class="tab-controls">
        <!-- Pattern Templates -->
        <div class="control-group" v-if="config.capabilities.hasPatternTemplates">
          <label>Шаблоны названий</label>
          <div class="pattern-inputs">
            <input
              v-model="currentTab.sectorPattern"
              placeholder="Шаблон секторов (используйте & для номера)"
              class="control-input"
            />
            <input
              v-model="currentTab.bonusPattern"
              placeholder="Шаблон бонусов (используйте & для номера)"
              class="control-input"
            />
          </div>
        </div>

        <!-- Quick Time Controls -->
        <div class="control-group" v-if="config.capabilities.hasBonuses">
          <label>Быстрое время</label>
          <div class="time-inputs">
            <BonusTimeInput
              :time="currentTab.quickTime || { hours: 0, minutes: 0, seconds: 0 }"
              :show-preview="false"
              :supports-negative="config.capabilities.supportsNegativeTime"
              @update:time="updateTabQuickTime"
            />
            <button @click="applyQuickTime" class="apply-btn">Применить ко всем</button>
          </div>
        </div>

        <!-- Advanced Controls -->
        <div class="control-group" v-if="shouldShowAdvancedControls">
          <label>Дополнительные возможности</label>
          <div class="advanced-controls">
            <button 
              v-if="config.capabilities.supportsBonusLevels"
              @click="showLevelsModal = true" 
              class="control-btn"
            >
              Уровни бонусов
            </button>
            <button 
              v-if="config.capabilities.supportsCodeGeneration"
              @click="showCodeGenerator = true" 
              class="control-btn"
            >
              Добавить коды
            </button>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <div class="main-table">
        <div class="table-header">
          <span>#</span>
          <span>Ответ</span>
          <span v-if="config.capabilities.hasSectors">Сектор</span>
          <span v-if="config.capabilities.hasBonuses">Бонус</span>
          <span v-if="config.capabilities.supportsBonusLevels">Уровни</span>
          <span v-if="config.capabilities.hasBonuses">Время</span>
          <span v-if="config.capabilities.supportsBonusDelay">Задержка</span>
          <span v-if="config.capabilities.supportsBonusLimits">Ограничение</span>
          <span v-if="config.capabilities.supportsSectorNames">Название сектора</span>
          <span v-if="config.capabilities.supportsBonusTask">Название бонуса</span>
          <span v-if="config.capabilities.supportsBonusTask">Задание</span>
          <span v-if="config.capabilities.supportsBonusHints">Подсказка</span>
          <span>Действия</span>
        </div>

        <div
          v-for="answer in currentTabAnswers"
          :key="answer.id"
          class="table-row"
        >
          <!-- Number -->
          <div class="row-number">{{ answer.id }}</div>

          <!-- Variants -->
          <div class="row-variants">
            <AnswerInput
              :variants="answer.variants"
              placeholder="код"
              :min-variants="1"
              :max-variants="10"
              @update:variants="updateAnswerVariants(answer.id, $event)"
            />
          </div>

          <!-- Sector Checkbox -->
          <div class="row-checkbox" v-if="config.capabilities.hasSectors">
            <input
              type="checkbox"
              :checked="answer.inSector"
              @change="updateAnswerField(answer.id, 'inSector', $event.target.checked)"
            />
          </div>

          <!-- Bonus Checkbox -->
          <div class="row-checkbox" v-if="config.capabilities.hasBonuses">
            <input
              type="checkbox"
              :checked="answer.inBonus"
              @change="updateAnswerField(answer.id, 'inBonus', $event.target.checked)"
            />
          </div>

          <!-- Bonus Levels -->
          <div class="row-levels" v-if="config.capabilities.supportsBonusLevels">
            <div v-if="answer.bonusLevels?.allLevels" class="all-levels">Все</div>
            <div v-else class="specific-levels">
              {{ answer.bonusLevels?.specificLevels?.length || 0 }}
            </div>
          </div>

          <!-- Bonus Time -->
          <div class="row-time" v-if="config.capabilities.hasBonuses">
            <BonusTimeInput
              :time="answer.bonusTime || { hours: 0, minutes: 0, seconds: 0 }"
              :show-preview="false"
              :supports-negative="config.capabilities.supportsNegativeTime"
              @update:time="updateAnswerField(answer.id, 'bonusTime', $event)"
            />
          </div>

          <!-- Delay -->
          <div class="row-delay" v-if="config.capabilities.supportsBonusDelay">
            <BonusTimeInput
              :time="answer.bonusDelay || { hours: 0, minutes: 0, seconds: 0 }"
              :show-preview="false"
              :supports-negative="false"
              @update:time="updateAnswerField(answer.id, 'bonusDelay', $event)"
            />
          </div>

          <!-- Limit -->
          <div class="row-limit" v-if="config.capabilities.supportsBonusLimits">
            <BonusTimeInput
              :time="answer.bonusLimit || { hours: 0, minutes: 0, seconds: 0 }"
              :show-preview="false"
              :supports-negative="false"
              @update:time="updateAnswerField(answer.id, 'bonusLimit', $event)"
            />
          </div>

          <!-- Sector Name -->
          <div class="row-input" v-if="config.capabilities.supportsSectorNames">
            <input
              :value="answer.sectorName || ''"
              placeholder="Название сектора"
              class="text-input"
              @input="updateAnswerField(answer.id, 'sectorName', $event.target.value)"
            />
          </div>

          <!-- Bonus Name -->
          <div class="row-input" v-if="config.capabilities.supportsBonusTask">
            <input
              :value="answer.bonusName || ''"
              placeholder="Название бонуса"
              class="text-input"
              @input="updateAnswerField(answer.id, 'bonusName', $event.target.value)"
            />
          </div>

          <!-- Bonus Task -->
          <div class="row-input" v-if="config.capabilities.supportsBonusTask">
            <input
              :value="answer.bonusTask || ''"
              placeholder="HTML задание"
              class="text-input"
              @input="updateAnswerField(answer.id, 'bonusTask', $event.target.value)"
            />
          </div>

          <!-- Bonus Hint -->
          <div class="row-input" v-if="config.capabilities.supportsBonusHints">
            <input
              :value="answer.bonusHint || ''"
              placeholder="HTML подсказка"
              class="text-input"
              @input="updateAnswerField(answer.id, 'bonusHint', $event.target.value)"
            />
          </div>

          <!-- Actions -->
          <div class="row-actions">
            <button @click="duplicateAnswer(answer.id)" class="action-btn" title="Дублировать">
              📄
            </button>
            <button @click="removeAnswer(answer.id)" class="action-btn" title="Удалить">
              ✕
            </button>
          </div>
        </div>

        <!-- Add Row Button -->
        <div class="add-row">
          <button @click="addAnswer" class="add-row-btn">
            + Добавить строку
          </button>
        </div>
      </div>
    </div>

    <!-- Code Generator Modal -->
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
                <label>Количество:</label>
                <input v-model.number="codeGenCount" type="number" min="1" class="control-input" />
              </div>
              <div class="control-group">
                <label>Цифр:</label>
                <input v-model.number="codeGenDigits" type="number" min="1" max="10" class="control-input" />
              </div>
            </div>
            <div class="generator-preview">
              <textarea
                v-model="generatedCodes"
                placeholder="Сгенерированные коды"
                rows="8"
                class="codes-textarea"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="generateCodes" class="generate-btn">Генерировать</button>
            <button @click="generatedCodes = ''" class="clear-btn">Очистить</button>
            <button @click="applyCodes" class="apply-btn">Применить</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Levels Modal -->
    <transition name="fade">
      <div v-if="showLevelsModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Уровни бонусов</h3>
            <button @click="showLevelsModal = false" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <LevelSelector
              :config="bonusLevelsConfig"
              :available-levels="availableLevels"
              label="Настройка доступности бонусов"
              @update:config="bonusLevelsConfig = $event"
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
import { ref, computed, watch } from 'vue'
import AnswerInput from '../forms/AnswerInput.vue'
import BonusTimeInput from '../forms/BonusTimeInput.vue'
import LevelSelector from '../forms/LevelSelector.vue'
import type { LevelTypeConfig, UniversalAnswer, BonusTime, TabData } from '../../../types/level-system'

// ============================================================================
// PROPS & EMITS
// ============================================================================

interface Props {
  config: LevelTypeConfig
  answers: UniversalAnswer[]
}

interface Emits {
  (e: 'update:answers', value: UniversalAnswer[]): void
  (e: 'add-answer'): void
  (e: 'remove-answer', id: string | number): void
  (e: 'duplicate-answer', id: string | number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ============================================================================
// STATE
// ============================================================================

const tabs = ref<TabData[]>([])
const activeTabIndex = ref(0)

// Modals
const showCodeGenerator = ref(false)
const showLevelsModal = ref(false)

// Code generator
const codeGenCount = ref(5)
const codeGenDigits = ref(4)
const generatedCodes = ref('')

// Bonus levels
const bonusLevelsConfig = ref({
  allLevels: false,
  specificLevels: [1],
  levelCheckboxNames: ['level_1']
})

const availableLevels = computed(() => {
  return Array.from({ length: 50 }, (_, i) => ({
    value: i + 1,
    label: `Уровень ${i + 1}`,
    checkboxName: `level_${i + 1}`
  }))
})

// ============================================================================
// COMPUTED
// ============================================================================

const shouldShowAdvancedControls = computed(() => {
  return props.config.capabilities.supportsBonusLevels || 
         props.config.capabilities.supportsCodeGeneration
})

const currentTab = computed(() => tabs.value[activeTabIndex.value] || null)

const currentTabAnswers = computed(() => {
  if (!currentTab.value) return []
  return props.answers.filter(answer => 
    answer.metadata?.tabId === currentTab.value?.id
  )
})

// ============================================================================
// METHODS - TAB MANAGEMENT
// ============================================================================

function initializeTabs() {
  if (tabs.value.length === 0) {
    tabs.value = [createTab('Блок 1', 'tab_1')]
  }
  
  // Ensure all answers have tab assignments
  const updatedAnswers = props.answers.map(answer => {
    if (!answer.metadata?.tabId) {
      return {
        ...answer,
        metadata: { ...answer.metadata, tabId: tabs.value[0].id }
      }
    }
    return answer
  })
  
  if (updatedAnswers.some((answer, index) => answer !== props.answers[index])) {
    emit('update:answers', updatedAnswers)
  }
}

function createTab(name: string, id: string): TabData {
  return {
    id,
    name,
    sectorPattern: '',
    bonusPattern: '',
    bonusTaskPattern: '',
    bonusHintPattern: '',
    quickTime: { hours: 0, minutes: 0, seconds: 0 },
    answers: []
  }
}

function addTab() {
  const newId = `tab_${tabs.value.length + 1}`
  const newName = `Блок ${tabs.value.length + 1}`
  tabs.value.push(createTab(newName, newId))
  activeTabIndex.value = tabs.value.length - 1
  
  // Add a default answer to the new tab
  emit('add-answer')
}

function removeCurrentTab() {
  if (tabs.value.length <= 1) return
  
  const currentTabId = currentTab.value?.id
  
  // Remove tab
  tabs.value.splice(activeTabIndex.value, 1)
  
  // Update active index
  if (activeTabIndex.value >= tabs.value.length) {
    activeTabIndex.value = tabs.value.length - 1
  }
  
  // Remove answers from deleted tab or move them to first tab
  const updatedAnswers = props.answers.filter(answer => 
    answer.metadata?.tabId !== currentTabId
  )
  
  emit('update:answers', updatedAnswers)
}

// ============================================================================
// METHODS - ANSWER MANAGEMENT
// ============================================================================

function updateAnswerVariants(id: string | number, variants: string[]) {
  const updatedAnswers = props.answers.map(answer =>
    answer.id === id ? { ...answer, variants } : answer
  )
  emit('update:answers', updatedAnswers)
}

function updateAnswerField(id: string | number, field: keyof UniversalAnswer, value: any) {
  const updatedAnswers = props.answers.map(answer =>
    answer.id === id ? { ...answer, [field]: value } : answer
  )
  emit('update:answers', updatedAnswers)
}

function addAnswer() {
  emit('add-answer')
}

function removeAnswer(id: string | number) {
  emit('remove-answer', id)
}

function duplicateAnswer(id: string | number) {
  emit('duplicate-answer', id)
}

// ============================================================================
// METHODS - BULK OPERATIONS
// ============================================================================

function updateTabQuickTime(time: BonusTime) {
  if (!currentTab.value) return
  currentTab.value.quickTime = time
}

function applyQuickTime() {
  if (!currentTab.value?.quickTime) return
  
  const updatedAnswers = props.answers.map(answer => {
    if (answer.metadata?.tabId === currentTab.value?.id) {
      return { ...answer, bonusTime: { ...currentTab.value!.quickTime! } }
    }
    return answer
  })
  
  emit('update:answers', updatedAnswers)
}

function generateCodes() {
  const codes = []
  for (let i = 0; i < codeGenCount.value; i++) {
    let code = ''
    for (let j = 0; j < codeGenDigits.value; j++) {
      code += Math.floor(Math.random() * 10)
    }
    codes.push(code)
  }
  generatedCodes.value = codes.join('\n')
}

function applyCodes() {
  if (!generatedCodes.value.trim() || !currentTab.value) return
  
  const codes = generatedCodes.value
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l)
  
  const currentTabAnswers = props.answers.filter(answer =>
    answer.metadata?.tabId === currentTab.value?.id
  )
  
  const otherAnswers = props.answers.filter(answer =>
    answer.metadata?.tabId !== currentTab.value?.id
  )
  
  const updatedTabAnswers = [...currentTabAnswers]
  
  codes.forEach((code, index) => {
    if (index < updatedTabAnswers.length) {
      updatedTabAnswers[index].variants = [code]
    } else {
      // Create new answer
      const newAnswer: UniversalAnswer = {
        id: `${currentTab.value!.id}_${Date.now()}_${index}`,
        variants: [code],
        inSector: true,
        inBonus: true,
        bonusTime: { hours: 0, minutes: 0, seconds: 0 },
        type: 'sector',
        metadata: { tabId: currentTab.value!.id }
      }
      updatedTabAnswers.push(newAnswer)
    }
  })
  
  emit('update:answers', [...otherAnswers, ...updatedTabAnswers])
  
  showCodeGenerator.value = false
  generatedCodes.value = ''
}

function applyBonusLevels() {
  if (!currentTab.value) return
  
  const updatedAnswers = props.answers.map(answer => {
    if (answer.metadata?.tabId === currentTab.value?.id) {
      return {
        ...answer,
        bonusLevels: {
          allLevels: bonusLevelsConfig.value.allLevels,
          specificLevels: bonusLevelsConfig.value.specificLevels,
          levelCheckboxNames: bonusLevelsConfig.value.levelCheckboxNames
        }
      }
    }
    return answer
  })
  
  emit('update:answers', updatedAnswers)
  showLevelsModal.value = false
}

// ============================================================================
// WATCHERS - PATTERN APPLICATION
// ============================================================================

watch(
  () => currentTab.value?.sectorPattern,
  (pattern) => {
    if (!pattern || !currentTab.value) return
    
    const tabAnswers = currentTabAnswers.value
    const updatedAnswers = props.answers.map(answer => {
      if (answer.metadata?.tabId === currentTab.value?.id) {
        const index = tabAnswers.findIndex(a => a.id === answer.id)
        return {
          ...answer,
          sectorName: pattern.replace(/&/g, String(index + 1))
        }
      }
      return answer
    })
    
    emit('update:answers', updatedAnswers)
  }
)

watch(
  () => currentTab.value?.bonusPattern,
  (pattern) => {
    if (!pattern || !currentTab.value) return
    
    const tabAnswers = currentTabAnswers.value
    const updatedAnswers = props.answers.map(answer => {
      if (answer.metadata?.tabId === currentTab.value?.id) {
        const index = tabAnswers.findIndex(a => a.id === answer.id)
        return {
          ...answer,
          bonusName: pattern.replace(/&/g, String(index + 1))
        }
      }
      return answer
    })
    
    emit('update:answers', updatedAnswers)
  }
)

// ============================================================================
// LIFECYCLE
// ============================================================================

// Initialize tabs when component mounts
initializeTabs()
</script>

<style scoped>
.tabs-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tabs-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.tab-controls {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
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

.pattern-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.advanced-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.main-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 120px repeat(auto-fit, 80px);
  gap: 10px;
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 0.8rem;
  color: #374151;
  min-width: 1200px;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 120px repeat(auto-fit, 80px);
  gap: 10px;
  padding: 15px 20px;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
  min-width: 1200px;
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

.row-levels {
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

/* Modal Styles */
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

.clear-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #d97706;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .tab-controls {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .table-row {
    min-width: 800px;
  }
}
</style>

