<template>
  <div class="table-layout">
    <!-- Global Controls -->
    <div class="global-controls" v-if="shouldShowControls">
      <!-- Sector Mode -->
      <div class="control-group" v-if="config.capabilities.hasSectors">
        <label>Закрытие уровня</label>
        <select v-model="sectorMode" @change="applySectorMode" class="control-select">
          <option value="all">Все сектора</option>
          <option value="initialAndFinal">Начальные + финал</option>
          <option value="finalOnly">Только финал</option>
          <option value="custom">Кастом</option>
        </select>
      </div>

      <!-- Quick Bonus Time -->
      <div class="control-group" v-if="config.capabilities.hasBonuses">
        <label>Бонусное время (ч, м, с)</label>
        <div class="time-inputs">
          <BonusTimeInput
            :time="quickTime"
            :show-preview="false"
            :supports-negative="config.capabilities.supportsNegativeTime"
            @update:time="quickTime = $event"
          />
          <button @click="applyQuickTime" class="apply-btn">Применить ко всем</button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="control-group" v-if="config.capabilities.supportsBulkOperations">
        <label>Быстрые действия</label>
        <div class="quick-actions">
          <button @click="fillRandomCodes" class="action-btn">Коды</button>
          <button @click="addAnswer" class="action-btn">+ Строка</button>
          <button @click="removeLastAnswer" class="action-btn">- Строка</button>
        </div>
      </div>
    </div>

    <!-- Olymp Table Preview -->
    <div class="preview-section" v-if="isOlympType">
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
      
      <div class="table-preview" v-if="olympTableHtml" v-html="olympTableHtml"></div>
    </div>

    <!-- Main Answers Table -->
    <div class="answers-table">
      <div class="table-header">
        <span class="col-number">#</span>
        <span class="col-variants">Варианты ответов</span>
        <span class="col-sector" v-if="config.capabilities.hasSectors">Сектор</span>
        <span class="col-bonus" v-if="config.capabilities.hasBonuses">Бонус</span>
        <span class="col-time" v-if="config.capabilities.hasBonuses">Время</span>
        <span class="col-sector-name" v-if="config.capabilities.supportsSectorNames">Название сектора</span>
        <span class="col-bonus-name" v-if="config.capabilities.supportsBonusTask">Название бонуса</span>
        <span class="col-closed" v-if="isOlympType">Закрытый</span>
        <span class="col-open" v-if="isOlympType">Открытый</span>
        <span class="col-actions">Действия</span>
      </div>

      <div
        v-for="(answer, index) in answers"
        :key="answer.id"
        class="answer-row"
      >
        <!-- Number -->
        <div class="answer-number">{{ answer.id }}</div>

        <!-- Variants -->
        <div class="answer-variants">
          <AnswerInput
            :variants="answer.variants"
            placeholder="Код"
            :min-variants="1"
            :max-variants="config.capabilities.supportsMultipleVariants ? 10 : 1"
            @update:variants="updateAnswerVariants(answer.id, $event)"
          />
        </div>

        <!-- Sector Checkbox -->
        <div class="answer-checkbox" v-if="config.capabilities.hasSectors">
          <input
            type="checkbox"
            :checked="answer.type === 'sector' || answer.inSector"
            @change="updateAnswerType(answer.id, 'inSector', $event.target.checked)"
          />
        </div>

        <!-- Bonus Checkbox -->
        <div class="answer-checkbox" v-if="config.capabilities.hasBonuses">
          <input
            type="checkbox"
            :checked="answer.type === 'bonus' || answer.inBonus"
            @change="updateAnswerType(answer.id, 'inBonus', $event.target.checked)"
          />
        </div>

        <!-- Bonus Time -->
        <div class="answer-time" v-if="config.capabilities.hasBonuses">
          <BonusTimeInput
            :time="answer.bonusTime || { hours: 0, minutes: 0, seconds: 0 }"
            :show-preview="false"
            :supports-negative="config.capabilities.supportsNegativeTime"
            @update:time="updateAnswerField(answer.id, 'bonusTime', $event)"
          />
        </div>

        <!-- Sector Name -->
        <div class="answer-text" v-if="config.capabilities.supportsSectorNames">
          <input
            type="text"
            :value="answer.sectorName || ''"
            placeholder="Название сектора"
            class="text-input"
            @input="updateAnswerField(answer.id, 'sectorName', $event.target.value)"
          />
        </div>

        <!-- Bonus Name -->
        <div class="answer-text" v-if="config.capabilities.supportsBonusTask">
          <input
            type="text"
            :value="answer.bonusName || ''"
            placeholder="Название бонуса"
            class="text-input"
            @input="updateAnswerField(answer.id, 'bonusName', $event.target.value)"
          />
        </div>

        <!-- Olymp Closed Text -->
        <div class="answer-text" v-if="isOlympType">
          <input
            type="text"
            :value="answer.sectorName || ''"
            placeholder="Закрытый"
            class="text-input"
            @input="updateAnswerField(answer.id, 'sectorName', $event.target.value)"
          />
        </div>

        <!-- Olymp Open Text -->
        <div class="answer-text" v-if="isOlympType">
          <input
            type="text"
            :value="answer.bonusName || ''"
            placeholder="Открытый"
            class="text-input"
            @input="updateAnswerField(answer.id, 'bonusName', $event.target.value)"
          />
        </div>

        <!-- Actions -->
        <div class="answer-actions">
          <button @click="duplicateAnswer(answer.id)" class="action-btn small" title="Дублировать">
            📄
          </button>
          <button @click="removeAnswer(answer.id)" class="action-btn small danger" title="Удалить">
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { generateOlympLayout, type Cell } from '../../../utils/olymp'
import AnswerInput from '../forms/AnswerInput.vue'
import BonusTimeInput from '../forms/BonusTimeInput.vue'
import type { LevelTypeConfig, UniversalAnswer, BonusTime } from '../../../types/level-system'

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

const sectorMode = ref<'all' | 'initialAndFinal' | 'finalOnly' | 'custom'>('all')
const previewMode = ref<'closed' | 'open'>('closed')
const quickTime = ref<BonusTime>({ hours: 0, minutes: 0, seconds: 0 })

// ============================================================================
// COMPUTED
// ============================================================================

const shouldShowControls = computed(() => {
  return props.config.capabilities.hasSectors || 
         props.config.capabilities.hasBonuses || 
         props.config.capabilities.supportsBulkOperations
})

const isOlympType = computed(() => {
  return props.config.category === 'olymp'
})

const olympTableHtml = computed(() => {
  if (!isOlympType.value || !props.config.defaultSectorCount) return ''
  
  try {
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
    
    const layout: Cell[][] = generateOlympLayout(props.config.defaultSectorCount, 1)
    
    let html = style + '<table class="olymp">'
    layout.forEach((row) => {
      html += '<tr>'
      row.forEach((cell) => {
        if (!cell.id) return
        const num = parseInt(cell.id.split('_')[1], 10)
        const answer = props.answers.find(a => Number(a.id) === num)
        
        let rawText = ''
        if (answer) {
          rawText = previewMode.value === 'closed' 
            ? answer.sectorName || '' 
            : answer.bonusName || answer.sectorName || ''
        }
        
        // Format links as images
        const content = /^https?:\/\//i.test(rawText.trim()) 
          ? `<a href="${rawText}" target="_blank"><img src="${rawText}" style="max-width:100px;max-height:100px;" /></a>`
          : rawText
        
        let cellHtml = content
        if (previewMode.value === 'open' && answer?.bonusName && !/^https?:\/\//i.test(rawText.trim())) {
          cellHtml = `<p class="up">${content}</p>`
        }
        
        const rsAttr = cell.rs ? `rowspan="${cell.rs}"` : ''
        html += `<td id="${cell.id}" ${rsAttr}>${cellHtml}</td>`
      })
      html += '</tr>'
    })
    html += '</table>'
    return html
  } catch (error) {
    console.error('Error generating olymp table:', error)
    return ''
  }
})

// ============================================================================
// METHODS
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

function updateAnswerType(id: string | number, field: 'inSector' | 'inBonus', value: boolean) {
  const updatedAnswers = props.answers.map(answer => {
    if (answer.id === id) {
      const updated = { ...answer, [field]: value }
      // Update type based on checkboxes
      if (updated.inSector && !updated.inBonus) {
        updated.type = 'sector'
      } else if (!updated.inSector && updated.inBonus) {
        updated.type = 'bonus'
      } else if (updated.inSector && updated.inBonus) {
        updated.type = 'sector' // Default to sector if both
      }
      return updated
    }
    return answer
  })
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

function removeLastAnswer() {
  if (props.answers.length > 1) {
    const lastAnswer = props.answers[props.answers.length - 1]
    removeAnswer(lastAnswer.id)
  }
}

function applySectorMode() {
  const updatedAnswers = [...props.answers]
  
  switch (sectorMode.value) {
    case 'all':
      updatedAnswers.forEach(answer => {
        answer.inSector = true
      })
      break
    case 'finalOnly':
      updatedAnswers.forEach((answer, index) => {
        answer.inSector = index === updatedAnswers.length - 1
      })
      break
    case 'initialAndFinal':
      const half = Math.floor(updatedAnswers.length / 2)
      updatedAnswers.forEach((answer, index) => {
        answer.inSector = index < half || index === updatedAnswers.length - 1
      })
      break
    case 'custom':
      // User manages manually
      break
  }
  
  emit('update:answers', updatedAnswers)
}

function applyQuickTime() {
  const updatedAnswers = props.answers.map(answer => ({
    ...answer,
    bonusTime: { ...quickTime.value }
  }))
  emit('update:answers', updatedAnswers)
}

function fillRandomCodes() {
  const updatedAnswers = props.answers.map(answer => ({
    ...answer,
    variants: answer.variants.length === 0 || answer.variants[0] === '' 
      ? [Math.floor(1000 + Math.random() * 9000).toString()]
      : answer.variants
  }))
  emit('update:answers', updatedAnswers)
}

function copyTableHtml() {
  if (olympTableHtml.value) {
    navigator.clipboard.writeText(olympTableHtml.value).then(() => {
      alert('HTML скопирован в буфер обмена')
    }).catch(() => {
      alert('Не удалось скопировать HTML')
    })
  }
}
</script>

<style scoped>
.table-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.global-controls {
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

.control-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.time-inputs {
  display: flex;
  align-items: end;
  gap: 10px;
}

.apply-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
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

.action-btn.small {
  padding: 4px 8px;
  font-size: 0.8rem;
}

.action-btn.danger {
  background-color: #dc2626;
}

.action-btn.danger:hover {
  background-color: #b91c1c;
}

.preview-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr repeat(auto-fit, 80px);
  gap: 10px;
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 0.9rem;
  color: #374151;
  min-width: 800px;
}

.answer-row {
  display: grid;
  grid-template-columns: 60px 1fr repeat(auto-fit, 80px);
  gap: 10px;
  padding: 15px 20px;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
  min-width: 800px;
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

.answer-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

@media (max-width: 1200px) {
  .global-controls {
    grid-template-columns: 1fr;
  }
}
</style>

