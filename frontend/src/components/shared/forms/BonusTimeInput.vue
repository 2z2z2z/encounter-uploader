<template>
  <div class="bonus-time-input">
    <!-- Заголовок и описание -->
    <div v-if="label || description" class="time-header">
      <label v-if="label" class="time-label">{{ label }}</label>
      <p v-if="description" class="time-description">{{ description }}</p>
    </div>
    
    <!-- Поля времени -->
    <div class="time-fields">
      <div class="time-field">
        <label class="field-label">Часы</label>
        <input
          v-model.number="localTime.hours"
          type="number"
          min="0"
          max="23"
          class="time-input"
          @input="updateTime"
          :readonly="readonly"
        />
      </div>
      
      <div class="time-separator">:</div>
      
      <div class="time-field">
        <label class="field-label">Минуты</label>
        <input
          v-model.number="localTime.minutes"
          type="number"
          min="0"
          max="59"
          class="time-input"
          @input="updateTime"
          :readonly="readonly"
        />
      </div>
      
      <div class="time-separator">:</div>
      
      <div class="time-field">
        <label class="field-label">Секунды</label>
        <input
          v-model.number="localTime.seconds"
          type="number"
          min="0"
          max="59"
          class="time-input"
          @input="updateTime"
          :readonly="readonly"
        />
      </div>
    </div>
    
    <!-- Чекбокс для отрицательного времени -->
    <div v-if="supportsNegative" class="negative-time-section">
      <label class="negative-time-checkbox">
        <input
          v-model="localTime.negative"
          type="checkbox"
          @change="updateTime"
          :disabled="readonly"
        />
        <span class="negative-time-label">Отрицательное время (штраф)</span>
      </label>
      <p v-if="localTime.negative" class="negative-time-warning">
        ⚠️ Бонус будет отнимать время вместо добавления
      </p>
    </div>
    
    <!-- Предпросмотр времени -->
    <div v-if="showPreview" class="time-preview">
      <span class="preview-label">Время:</span>
      <span class="preview-time" :class="{ 'negative': localTime.negative }">
        {{ localTime.negative ? '-' : '+' }}{{ formattedTime }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface BonusTime {
  hours: number
  minutes: number
  seconds: number
  negative?: boolean
}

// ============================================================================
// PROPS & EMITS
// ============================================================================

interface Props {
  time: BonusTime
  label?: string
  description?: string
  supportsNegative?: boolean
  showPreview?: boolean
  readonly?: boolean
}

interface Emits {
  (e: 'update:time', time: BonusTime): void
}

const props = withDefaults(defineProps<Props>(), {
  supportsNegative: true,
  showPreview: true,
  readonly: false
})

const emit = defineEmits<Emits>()

// ============================================================================
// REACTIVE DATA
// ============================================================================

const localTime = ref<BonusTime>({
  hours: props.time.hours || 0,
  minutes: props.time.minutes || 0,
  seconds: props.time.seconds || 0,
  negative: props.time.negative || false
})

// ============================================================================
// COMPUTED
// ============================================================================

const formattedTime = computed(() => {
  const h = String(localTime.value.hours).padStart(2, '0')
  const m = String(localTime.value.minutes).padStart(2, '0')
  const s = String(localTime.value.seconds).padStart(2, '0')
  return `${h}:${m}:${s}`
})

const isValidTime = computed(() => {
  const { hours, minutes, seconds } = localTime.value
  return hours >= 0 && hours <= 23 &&
         minutes >= 0 && minutes <= 59 &&
         seconds >= 0 && seconds <= 59
})

// ============================================================================
// WATCHERS
// ============================================================================

// Синхронизация с props
watch(() => props.time, (newTime) => {
  localTime.value = {
    hours: newTime.hours || 0,
    minutes: newTime.minutes || 0,
    seconds: newTime.seconds || 0,
    negative: newTime.negative || false
  }
}, { deep: true })

// Валидация при изменении
watch(localTime, () => {
  // Автоматическая коррекция значений
  if (localTime.value.hours < 0) localTime.value.hours = 0
  if (localTime.value.hours > 23) localTime.value.hours = 23
  if (localTime.value.minutes < 0) localTime.value.minutes = 0
  if (localTime.value.minutes > 59) localTime.value.minutes = 59
  if (localTime.value.seconds < 0) localTime.value.seconds = 0
  if (localTime.value.seconds > 59) localTime.value.seconds = 59
}, { deep: true })

// ============================================================================
// METHODS
// ============================================================================

function updateTime() {
  if (isValidTime.value) {
    emit('update:time', { ...localTime.value })
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Конвертирует время в секунды (для сравнений и вычислений)
 */
function timeToSeconds(time: BonusTime): number {
  const totalSeconds = time.hours * 3600 + time.minutes * 60 + time.seconds
  return time.negative ? -totalSeconds : totalSeconds
}

/**
 * Проверяет, является ли время нулевым
 */
function isZeroTime(time: BonusTime): boolean {
  return time.hours === 0 && time.minutes === 0 && time.seconds === 0
}

// Экспорт утилит для использования в родительских компонентах
defineExpose({
  timeToSeconds,
  isZeroTime,
  isValidTime
})
</script>

<style scoped>
.bonus-time-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.time-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.time-fields {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.time-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.time-input {
  width: 4rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  text-align: center;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.time-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.time-input[readonly] {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.time-separator {
  font-size: 1.125rem;
  font-weight: bold;
  color: #9ca3af;
  padding-bottom: 0.25rem;
}

.negative-time-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.negative-time-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.negative-time-checkbox input {
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  color: #dc2626;
}

.negative-time-checkbox input:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.negative-time-label {
  font-size: 0.875rem;
  color: #374151;
}

.negative-time-warning {
  font-size: 0.75rem;
  color: #dc2626;
  background-color: #fef2f2;
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0;
}

.time-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.25rem;
}

.preview-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.preview-time {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  font-weight: bold;
  color: #10b981;
}

.preview-time.negative {
  color: #dc2626;
}

/* Стили для недопустимых значений */
.time-input:invalid {
  border-color: #f87171;
  background-color: #fef2f2;
}
</style>

