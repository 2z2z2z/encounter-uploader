<template>
  <div class="answer-input-group">
    <!-- Варианты ответов -->
    <div class="variants-section">
      <div
        v-for="(variant, index) in localVariants"
        :key="index"
        class="variant-row"
      >
        <input
          v-model="localVariants[index]"
          type="text"
          :placeholder="placeholder || `Вариант ${index + 1}`"
          class="variant-input"
          @input="updateVariants"
        />
        <button
          v-if="canRemove"
          type="button"
          class="remove-variant-btn"
          @click="removeVariant(index)"
          :disabled="localVariants.length <= minVariants"
        >
          ×
        </button>
      </div>
      
      <!-- Кнопка добавления варианта -->
      <button
        v-if="canAdd"
        type="button"
        class="add-variant-btn"
        @click="addVariant"
        :disabled="maxVariants && localVariants.length >= maxVariants"
      >
        + Добавить вариант
      </button>
    </div>
    
    <!-- Название сектора (опционально) -->
    <div v-if="supportsSectorName" class="sector-name-section">
      <label class="sector-name-label">Название сектора:</label>
      <input
        v-model="localSectorName"
        type="text"
        placeholder="Необязательно"
        class="sector-name-input"
        @input="updateSectorName"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

// ============================================================================
// PROPS & EMITS
// ============================================================================

interface Props {
  variants: string[]
  sectorName?: string
  placeholder?: string
  minVariants?: number
  maxVariants?: number | null
  supportsSectorName?: boolean
  readonly?: boolean
}

interface Emits {
  (e: 'update:variants', variants: string[]): void
  (e: 'update:sectorName', sectorName: string): void
}

const props = withDefaults(defineProps<Props>(), {
  minVariants: 1,
  maxVariants: null,
  supportsSectorName: false,
  readonly: false,
  sectorName: ''
})

const emit = defineEmits<Emits>()

// ============================================================================
// REACTIVE DATA
// ============================================================================

const localVariants = ref([...props.variants])
const localSectorName = ref(props.sectorName || '')

// ============================================================================
// COMPUTED
// ============================================================================

const canAdd = computed(() => 
  !props.readonly && 
  (!props.maxVariants || localVariants.value.length < props.maxVariants)
)

const canRemove = computed(() => 
  !props.readonly && localVariants.value.length > 1
)

// ============================================================================
// WATCHERS
// ============================================================================

// Синхронизация с props
watch(() => props.variants, (newVariants) => {
  localVariants.value = [...newVariants]
}, { deep: true })

watch(() => props.sectorName, (newSectorName) => {
  localSectorName.value = newSectorName || ''
})

// ============================================================================
// METHODS
// ============================================================================

function updateVariants() {
  emit('update:variants', [...localVariants.value])
}

function updateSectorName() {
  emit('update:sectorName', localSectorName.value)
}

function addVariant() {
  if (canAdd.value) {
    localVariants.value.push('')
    updateVariants()
  }
}

function removeVariant(index: number) {
  if (canRemove.value && localVariants.value.length > props.minVariants) {
    localVariants.value.splice(index, 1)
    updateVariants()
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Если нет вариантов, добавляем хотя бы один
if (localVariants.value.length === 0) {
  localVariants.value.push('')
  updateVariants()
}
</script>

<style scoped>
.answer-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.variants-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variant-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.variant-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.variant-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.variant-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.remove-variant-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.125rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.remove-variant-btn:hover {
  background-color: #dc2626;
}

.remove-variant-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.add-variant-btn {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.add-variant-btn:hover {
  background-color: #059669;
}

.add-variant-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.sector-name-section {
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.sector-name-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.sector-name-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.sector-name-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>