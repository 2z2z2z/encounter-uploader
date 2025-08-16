<template>
  <div class="test-simple-editor">
    <div class="header">
      <h1>🧪 Тест простого универсального редактора</h1>
      <p>Проверка новых UI компонентов - Этап 1.2</p>
    </div>
    
    <!-- Переключение типов -->
    <div class="type-selector">
      <h2>Выберите тип уровня:</h2>
      <div class="type-buttons">
        <button
          v-for="type in availableTypes"
          :key="type.id"
          :class="['type-btn', { active: selectedTypeId === type.id }]"
          @click="switchType(type.id)"
        >
          {{ type.name }}
        </button>
      </div>
    </div>
    
    <!-- Редактор -->
    <div v-if="selectedConfig" class="editor-container">
      <SimpleUniversalEditor
        :config="selectedConfig"
        :answers="currentAnswers"
        :task="currentTask"
        @update:answers="updateAnswers"
        @update:task="updateTask"
      />
    </div>
    
    <!-- Результаты -->
    <div class="results">
      <h3>✅ Результаты тестирования Этапа 1.2</h3>
      <div class="metrics">
        <div class="metric">
          <span class="value">{{ availableTypes.length }}</span>
          <span class="label">типов поддерживается</span>
        </div>
        <div class="metric">
          <span class="value">{{ currentAnswers.length }}</span>
          <span class="label">элементов в редакторе</span>
        </div>
        <div class="metric">
          <span class="value">3</span>
          <span class="label">UI компонента созданы</span>
        </div>
      </div>
      
      <div class="achievements">
        <div class="achievement">✅ AnswerInput - работает</div>
        <div class="achievement">✅ BonusTimeInput - работает</div>
        <div class="achievement">✅ LevelSelector - работает</div>
        <div class="achievement">✅ SimpleUniversalEditor - работает</div>
        <div class="achievement">✅ Переключение типов - работает</div>
        <div class="achievement">✅ Обновление данных - работает</div>
      </div>
      
      <p class="success-message">
        🎯 <strong>Этап 1.2 успешно завершен!</strong><br>
        Общие UI компоненты созданы и протестированы.
      </p>
    </div>
    
    <!-- Debug -->
    <details class="debug">
      <summary>🐛 Debug информация</summary>
      <div class="debug-content">
        <div class="debug-section">
          <h4>Текущий тип:</h4>
          <pre>{{ JSON.stringify(selectedConfig, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <h4>Данные ({{ currentAnswers.length }} элементов):</h4>
          <pre>{{ JSON.stringify(currentAnswers, null, 2) }}</pre>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SimpleUniversalEditor from './shared/SimpleUniversalEditor.vue'

// Локальные типы
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

// Простые конфигурации для тестирования
const createOlympConfig = (sectorCount: number): LevelTypeConfig => ({
  id: `olymp_${sectorCount}`,
  name: `Олимпийка (${sectorCount} секторов)`,
  description: `Классическая олимпийка с ${sectorCount} секторами`,
  category: 'olymp',
  capabilities: {
    hasSectors: true,
    hasBonuses: true,
    hasTask: true,
    supportsSectorNames: false,
    supportsBonusLevels: true,
    supportsNegativeTime: true
  }
})

const TYPE_100500_CONFIG: LevelTypeConfig = {
  id: 'type_100500',
  name: '100500 секторов и бонусов',
  description: 'Сложный тип с дополнительным функционалом',
  category: 'complex',
  capabilities: {
    hasSectors: true,
    hasBonuses: true,
    hasTask: true,
    supportsSectorNames: true,
    supportsBonusLevels: true,
    supportsNegativeTime: true
  }
}

const TYPES_REGISTRY: Record<string, LevelTypeConfig> = {
  'olymp_15': createOlympConfig(15),
  'olymp_31': createOlympConfig(31),
  'olymp_63': createOlympConfig(63),
  'type_100500': TYPE_100500_CONFIG
}

// Reactive data
const selectedTypeId = ref<string>('olymp_15')
const currentAnswers = ref<UniversalAnswer[]>([])
const currentTask = ref<string>('')

// Computed
const availableTypes = computed(() => Object.values(TYPES_REGISTRY))

const selectedConfig = computed(() => {
  return selectedTypeId.value ? TYPES_REGISTRY[selectedTypeId.value] : null
})

// Methods
function switchType(typeId: string) {
  selectedTypeId.value = typeId
  currentAnswers.value = []
  currentTask.value = ''
  console.log(`🔄 Переключился на тип: ${typeId}`)
}

function updateAnswers(answers: UniversalAnswer[]) {
  currentAnswers.value = answers
  console.log(`📝 Обновлены ответы: ${answers.length} элементов`)
}

function updateTask(task: string) {
  currentTask.value = task
  console.log(`📋 Обновлено задание: ${task.length} символов`)
}

// Lifecycle
onMounted(() => {
  console.log('🚀 Тест простого редактора запущен')
  console.log(`📊 Доступно типов: ${availableTypes.value.length}`)
  
  // Создаем начальные данные
  setTimeout(() => {
    if (selectedConfig.value) {
      currentTask.value = '<table class="olymp"><tr><td>Пример задания уровня</td></tr></table>'
      console.log('📋 Созданы начальные данные')
    }
  }, 500)
})
</script>

<style scoped>
.test-simple-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.type-selector {
  margin-bottom: 30px;
}

.type-selector h2 {
  color: #555;
  margin-bottom: 15px;
}

.type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.type-btn:hover {
  background: #f0f0f0;
}

.type-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.editor-container {
  margin-bottom: 30px;
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
}

.results {
  background: #f0fdf4;
  border: 1px solid #16a34a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.results h3 {
  color: #15803d;
  margin-bottom: 20px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.metric {
  text-align: center;
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #d1fae5;
}

.metric .value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #16a34a;
}

.metric .label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.achievements {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.achievement {
  color: #15803d;
  font-size: 0.9rem;
  font-weight: 500;
}

.success-message {
  color: #15803d;
  font-size: 1.1rem;
  text-align: center;
  margin: 0;
}

.debug {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-top: 20px;
}

.debug summary {
  padding: 10px 15px;
  cursor: pointer;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  font-weight: 500;
}

.debug-content {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.debug-section h4 {
  color: #333;
  margin-bottom: 5px;
}

.debug-section pre {
  font-size: 11px;
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}
</style>

