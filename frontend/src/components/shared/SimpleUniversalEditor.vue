<template>
  <div class="simple-universal-editor">
    <!-- Заголовок -->
    <div class="editor-header">
      <h2>{{ config.name }}</h2>
      <p v-if="config.description">{{ config.description }}</p>
      <div class="meta">
        <span class="category">{{ config.category }}</span>
        <span class="count">{{ answers.length }} элементов</span>
      </div>
    </div>
    
    <!-- Задание уровня -->
    <div v-if="config.capabilities.hasTask" class="task-section">
      <label>Задание уровня:</label>
      <textarea
        v-model="localTask"
        placeholder="HTML содержимое задания..."
        rows="3"
        @input="updateTask"
      />
    </div>
    
    <!-- Список ответов -->
    <div class="answers-section">
      <div v-if="answers.length === 0" class="no-data">
        <p>Нет данных</p>
        <button @click="addAnswer" class="add-btn">+ Добавить элемент</button>
      </div>
      
      <div v-else class="answers-list">
        <div v-for="(answer, index) in answers" :key="answer.id" class="answer-item">
          <div class="answer-header">
            <span class="index">{{ index + 1 }}</span>
            <select :value="answer.type" @change="updateAnswerType(answer.id, $event)">
              <option value="sector">Сектор</option>
              <option v-if="config.capabilities.hasBonuses" value="bonus">Бонус</option>
            </select>
            <button @click="deleteAnswer(answer.id)" :disabled="answers.length <= 1">
              🗑️
            </button>
          </div>
          
          <div class="answer-content">
            <AnswerInput
              :variants="answer.variants"
              :sector-name="answer.sectorName"
              :supports-sector-name="config.capabilities.supportsSectorNames"
              @update:variants="updateAnswerVariants(answer.id, $event)"
              @update:sector-name="updateAnswerSectorName(answer.id, $event)"
            />
            
            <!-- Поля бонуса -->
            <div v-if="answer.type === 'bonus'" class="bonus-fields">
              <input
                v-if="answer.bonusName !== undefined"
                v-model="answer.bonusName"
                placeholder="Название бонуса"
                @input="updateAnswer(answer.id)"
              />
              
              <div v-if="answer.bonusTime">
                <BonusTimeInput
                  :time="answer.bonusTime"
                  :supports-negative="config.capabilities.supportsNegativeTime"
                  @update:time="updateBonusTime(answer.id, $event)"
                />
              </div>
              
              <div v-if="config.capabilities.supportsBonusLevels && answer.bonusLevels">
                <LevelSelector
                  :config="answer.bonusLevels"
                  :available-levels="availableLevels"
                  @update:config="updateBonusLevels(answer.id, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button @click="addAnswer" class="add-btn">+ Добавить</button>
      </div>
    </div>
    
    <!-- Статистика -->
    <div class="stats">
      <span>Секторов: {{ getSectorCount() }}</span>
      <span>Бонусов: {{ getBonusCount() }}</span>
      <span>Вариантов: {{ getTotalVariants() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AnswerInput from './forms/AnswerInput.vue'
import BonusTimeInput from './forms/BonusTimeInput.vue'
import LevelSelector from './forms/LevelSelector.vue'

// Локальные интерфейсы
interface UniversalAnswer {
  id: string | number
  variants: string[]
  sectorName?: string
  bonusName?: string
  bonusTime?: { hours: number; minutes: number; seconds: number; negative?: boolean }
  bonusLevels?: {
    allLevels: boolean
    specificLevels?: number[]
    levelCheckboxNames?: string[]
  }
  type: 'sector' | 'bonus'
}

interface LevelTypeConfig {
  id: string
  name: string
  description?: string
  category: 'olymp' | 'complex' | 'custom'
  capabilities: {
    hasSectors: boolean
    hasBonuses: boolean
    hasTask: boolean
    supportsSectorNames: boolean
    supportsBonusLevels: boolean
    supportsNegativeTime: boolean
    [key: string]: any
  }
}

interface Props {
  config: LevelTypeConfig
  answers: UniversalAnswer[]
  task?: string
}

interface Emits {
  (e: 'update:answers', answers: UniversalAnswer[]): void
  (e: 'update:task', task: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localTask = ref(props.task || '')

const availableLevels = computed(() => {
  return Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    label: `Уровень ${i + 1}`,
    checkboxName: `level_${i + 1}`
  }))
})

// Methods
function addAnswer() {
  const newAnswer: UniversalAnswer = {
    id: Date.now().toString(),
    variants: [''],
    type: 'sector'
  }
  
  if (props.config.capabilities.hasBonuses) {
    newAnswer.bonusTime = { hours: 0, minutes: 0, seconds: 0 }
    newAnswer.bonusLevels = {
      allLevels: false,
      specificLevels: [1],
      levelCheckboxNames: ['level_1']
    }
  }
  
  emit('update:answers', [...props.answers, newAnswer])
}

function deleteAnswer(answerId: string | number) {
  const filtered = props.answers.filter(a => a.id !== answerId)
  emit('update:answers', filtered)
}

function updateAnswerVariants(answerId: string | number, variants: string[]) {
  const answers = props.answers.map(a => 
    a.id === answerId ? { ...a, variants } : a
  )
  emit('update:answers', answers)
}

function updateAnswerSectorName(answerId: string | number, sectorName: string) {
  const answers = props.answers.map(a => 
    a.id === answerId ? { ...a, sectorName } : a
  )
  emit('update:answers', answers)
}

function updateAnswerType(answerId: string | number, event: Event) {
  const target = event.target as HTMLSelectElement
  const newType = target.value as 'sector' | 'bonus'
  
  const answers = props.answers.map(a => {
    if (a.id === answerId) {
      const updated = { ...a, type: newType }
      
      if (newType === 'bonus') {
        if (!updated.bonusName) updated.bonusName = ''
        if (!updated.bonusTime) updated.bonusTime = { hours: 0, minutes: 0, seconds: 0 }
        if (!updated.bonusLevels) updated.bonusLevels = {
          allLevels: false,
          specificLevels: [1],
          levelCheckboxNames: ['level_1']
        }
      } else {
        delete updated.bonusName
        delete updated.bonusTime
        delete updated.bonusLevels
      }
      
      return updated
    }
    return a
  })
  
  emit('update:answers', answers)
}

function updateAnswer(answerId: string | number) {
  emit('update:answers', [...props.answers])
}

function updateBonusTime(answerId: string | number, time: any) {
  const answers = props.answers.map(a => 
    a.id === answerId ? { ...a, bonusTime: time } : a
  )
  emit('update:answers', answers)
}

function updateBonusLevels(answerId: string | number, config: any) {
  const answers = props.answers.map(a => 
    a.id === answerId ? { ...a, bonusLevels: config } : a
  )
  emit('update:answers', answers)
}

function updateTask() {
  emit('update:task', localTask.value)
}

function getSectorCount() {
  return props.answers.filter(a => a.type === 'sector').length
}

function getBonusCount() {
  return props.answers.filter(a => a.type === 'bonus').length
}

function getTotalVariants() {
  return props.answers.reduce((total, answer) => total + answer.variants.length, 0)
}

watch(() => props.task, (newTask) => {
  localTask.value = newTask || ''
})

// Создаем первый элемент если нет данных
if (props.answers.length === 0) {
  addAnswer()
}
</script>

<style scoped>
.simple-universal-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1000px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, sans-serif;
}

.editor-header {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.editor-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.editor-header p {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.category {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
}

.count {
  color: #666;
}

.task-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-section label {
  font-weight: 500;
  color: #374151;
}

.task-section textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
}

.task-section textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.answers-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.no-data {
  text-align: center;
  padding: 2rem;
}

.no-data p {
  color: #666;
  margin-bottom: 1rem;
}

.add-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #059669;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.answer-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.index {
  background: #f3f4f6;
  color: #666;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 500;
}

.answer-header select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
}

.answer-header button {
  margin-left: auto;
  background: none;
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.answer-header button:hover {
  background: #fef2f2;
}

.answer-header button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.answer-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bonus-fields {
  background: #eff6ff;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bonus-fields input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.actions {
  margin-top: 1rem;
  text-align: center;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #666;
}

.stats span {
  font-weight: 500;
}
</style>

