<template>
  <div class="level-selector">
    <!-- Заголовок -->
    <div v-if="label" class="selector-header">
      <label class="selector-label">{{ label }}</label>
      <p v-if="description" class="selector-description">{{ description }}</p>
    </div>
    
    <!-- Выбор режима: все уровни или конкретные -->
    <div class="mode-selection">
      <label class="mode-option">
        <input
          v-model="localAllLevels"
          type="radio"
          :value="true"
          @change="updateConfig"
          :disabled="readonly"
        />
        <span>На всех уровнях</span>
      </label>
      
      <label class="mode-option">
        <input
          v-model="localAllLevels"
          type="radio"
          :value="false"
          @change="updateConfig"
          :disabled="readonly"
        />
        <span>На указанных уровнях</span>
      </label>
    </div>
    
    <!-- Выбор конкретных уровней -->
    <div v-if="!localAllLevels" class="levels-selection">
      <div v-if="availableLevels.length === 0" class="no-levels-message">
        ⚠️ Нет доступных уровней для выбора
      </div>
      
      <div v-else class="levels-grid">
        <label
          v-for="level in availableLevels"
          :key="level.value"
          class="level-checkbox"
          :class="{ 'selected': isLevelSelected(level.value) }"
        >
          <input
            type="checkbox"
            :value="level.value"
            :checked="isLevelSelected(level.value)"
            @change="toggleLevel(level.value, $event)"
            :disabled="readonly"
          />
          <span class="level-label">{{ level.label }}</span>
        </label>
      </div>
      
      <!-- Быстрые действия -->
      <div v-if="!readonly && availableLevels.length > 1" class="quick-actions">
        <button
          type="button"
          class="quick-action-btn"
          @click="selectAllLevels"
          :disabled="localSelectedLevels.length === availableLevels.length"
        >
          ✓ Выбрать все
        </button>
        
        <button
          type="button"
          class="quick-action-btn"
          @click="clearAllLevels"
          :disabled="localSelectedLevels.length === 0"
        >
          ✗ Снять все
        </button>
      </div>
    </div>
    
    <!-- Предупреждения -->
    <div v-if="!localAllLevels && localSelectedLevels.length === 0" class="warning-message">
      ⚠️ Не выбран ни один уровень. Бонус не будет доступен!
    </div>
    
    <!-- Превью выбранной конфигурации -->
    <div v-if="showPreview" class="selection-preview">
      <span class="preview-label">Доступность:</span>
      <span v-if="localAllLevels" class="preview-text all-levels">
        На всех уровнях
      </span>
      <span v-else class="preview-text specific-levels">
        {{ selectedLevelsText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface BonusLevelConfig {
  allLevels: boolean
  specificLevels?: number[]
  levelCheckboxNames?: string[]
}

interface LevelOption {
  value: number
  label: string
  checkboxName: string
}

// ============================================================================
// PROPS & EMITS
// ============================================================================

interface Props {
  config: BonusLevelConfig
  availableLevels?: LevelOption[]
  label?: string
  description?: string
  showPreview?: boolean
  readonly?: boolean
}

interface Emits {
  (e: 'update:config', config: BonusLevelConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  availableLevels: () => [],
  showPreview: true,
  readonly: false
})

const emit = defineEmits<Emits>()

// ============================================================================
// REACTIVE DATA
// ============================================================================

const localAllLevels = ref(props.config.allLevels)
const localSelectedLevels = ref<number[]>(props.config.specificLevels || [])

// ============================================================================
// COMPUTED
// ============================================================================

const selectedLevelsText = computed(() => {
  if (localSelectedLevels.value.length === 0) {
    return 'Ни одного уровня не выбрано'
  }
  
  if (localSelectedLevels.value.length === props.availableLevels.length) {
    return 'На всех доступных уровнях'
  }
  
  const sorted = [...localSelectedLevels.value].sort((a, b) => a - b)
  if (sorted.length <= 3) {
    return `Уровни: ${sorted.join(', ')}`
  }
  
  return `${sorted.length} уровней (${sorted[0]}-${sorted[sorted.length - 1]})`
})

const levelCheckboxNames = computed(() => {
  if (localAllLevels.value) {
    return []
  }
  
  return localSelectedLevels.value.map(levelNum => {
    const level = props.availableLevels.find(l => l.value === levelNum)
    return level?.checkboxName || `level_${levelNum}`
  })
})

// ============================================================================
// WATCHERS
// ============================================================================

// Синхронизация с props
watch(() => props.config, (newConfig) => {
  localAllLevels.value = newConfig.allLevels
  localSelectedLevels.value = newConfig.specificLevels || []
}, { deep: true })

// Очистка выбранных уровней при переключении на "все уровни"
watch(localAllLevels, (newAllLevels) => {
  if (newAllLevels) {
    localSelectedLevels.value = []
  }
  updateConfig()
})

// ============================================================================
// METHODS
// ============================================================================

function updateConfig() {
  const newConfig: BonusLevelConfig = {
    allLevels: localAllLevels.value,
    specificLevels: localAllLevels.value ? [] : [...localSelectedLevels.value],
    levelCheckboxNames: levelCheckboxNames.value
  }
  
  emit('update:config', newConfig)
}

function isLevelSelected(levelValue: number): boolean {
  return localSelectedLevels.value.includes(levelValue)
}

function toggleLevel(levelValue: number, event: Event) {
  const target = event.target as HTMLInputElement
  const isChecked = target.checked
  
  if (isChecked) {
    if (!localSelectedLevels.value.includes(levelValue)) {
      localSelectedLevels.value.push(levelValue)
    }
  } else {
    const index = localSelectedLevels.value.indexOf(levelValue)
    if (index > -1) {
      localSelectedLevels.value.splice(index, 1)
    }
  }
  
  updateConfig()
}

function selectAllLevels() {
  localSelectedLevels.value = props.availableLevels.map(l => l.value)
  updateConfig()
}

function clearAllLevels() {
  localSelectedLevels.value = []
  updateConfig()
}

// ============================================================================
// DEFAULT LEVELS GENERATOR
// ============================================================================

/**
 * Генерирует стандартный список уровней для олимпийки
 */
function generateDefaultLevels(maxLevel: number = 10): LevelOption[] {
  return Array.from({ length: maxLevel }, (_, i) => ({
    value: i + 1,
    label: `Уровень ${i + 1}`,
    checkboxName: `level_${i + 1}`
  }))
}

// Экспорт для использования в других компонентах
defineExpose({
  generateDefaultLevels
})
</script>

<style scoped>
.level-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selector-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.selector-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.selector-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.mode-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.mode-option input[type="radio"] {
  color: #2563eb;
}

.mode-option input[type="radio"]:focus {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.levels-selection {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.no-levels-message {
  font-size: 0.875rem;
  color: #d97706;
  background-color: #fef3c7;
  padding: 0.75rem;
  border-radius: 0.25rem;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

.level-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.level-checkbox:hover {
  background-color: #f9fafb;
}

.level-checkbox.selected {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.level-checkbox input[type="checkbox"] {
  color: #2563eb;
}

.level-checkbox input[type="checkbox"]:focus {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.level-label {
  font-size: 0.875rem;
  color: #374151;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.quick-action-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.quick-action-btn:hover {
  background-color: #e5e7eb;
}

.quick-action-btn:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.warning-message {
  font-size: 0.875rem;
  color: #dc2626;
  background-color: #fef2f2;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.selection-preview {
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

.preview-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.preview-text.all-levels {
  color: #16a34a;
}

.preview-text.specific-levels {
  color: #2563eb;
}
</style>