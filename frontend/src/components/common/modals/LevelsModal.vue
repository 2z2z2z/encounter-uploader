<template>
  <BaseModal
    v-model="visible"
    header="Выбор уровней для бонусов"
    width="50vw"
  >
    <div class="levels-container">
      <div class="mb-4">
        <RadioButton 
          v-model="selectionMode" 
          input-id="all" 
          value="all"
        />
        <label for="all" class="ml-2 cursor-pointer">
          На всех уровнях
        </label>
      </div>
      
      <div class="mb-4">
        <RadioButton 
          v-model="selectionMode" 
          input-id="selected" 
          value="selected"
        />
        <label for="selected" class="ml-2 cursor-pointer">
          На выбранных уровнях
        </label>
      </div>
      
      <div v-if="selectionMode === 'selected'" class="levels-grid">
        <Message v-if="loading" severity="info">
          Загрузка списка уровней...
        </Message>
        
        <Message v-else-if="error" severity="error">
          {{ error }}
        </Message>
        
        <div v-else class="grid grid-cols-4 gap-2">
          <div v-for="level in availableLevels" :key="level.value" class="flex items-center">
            <Checkbox
              v-model="selectedLevels"
              :input-id="`level-${level.value}`"
              :value="level.value"
              :disabled="level.value === currentLevel"
            />
            <label 
              :for="`level-${level.value}`" 
              class="ml-2 cursor-pointer"
              :class="{ 'font-bold': level.value === currentLevel }"
            >
              {{ level.label }}
              <span v-if="level.value === currentLevel" class="text-sm text-gray-500">
                (текущий)
              </span>
            </label>
          </div>
        </div>
        
        <div class="mt-4 flex gap-2">
          <BaseButton variant="secondary" size="small" @click="selectAll">
            Выбрать все
          </BaseButton>
          <BaseButton variant="secondary" size="small" @click="deselectAll">
            Снять все
          </BaseButton>
        </div>
      </div>
    </div>
    
    <template #footer>
      <BaseButton 
        variant="primary" 
        @click="handleApply"
      >
        Применить
      </BaseButton>
      <BaseButton variant="secondary" @click="handleCancel" class="ml-2">
        Отмена
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface LevelOption {
  label: string
  value: string
}

interface Props {
  modelValue: boolean
  currentLevel: string
  initialSelection?: {
    allLevels: boolean
    targetLevels?: string[]
  }
}

const props = withDefaults(defineProps<Props>(), {
  initialSelection: () => ({
    allLevels: true,
    targetLevels: []
  })
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [selection: { allLevels: boolean; targetLevels?: string[] }]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const selectionMode = ref<'all' | 'selected'>('all')
const selectedLevels = ref<string[]>([])
const availableLevels = ref<LevelOption[]>([])
const loading = ref(false)
const error = ref('')

onMounted(() => {
  loadAvailableLevels()
  
  // Установка начальных значений
  if (props.initialSelection) {
    selectionMode.value = props.initialSelection.allLevels ? 'all' : 'selected'
    if (props.initialSelection.targetLevels) {
      selectedLevels.value = [...props.initialSelection.targetLevels]
    }
  }
})

watch(() => props.initialSelection, (newVal) => {
  if (newVal) {
    selectionMode.value = newVal.allLevels ? 'all' : 'selected'
    if (newVal.targetLevels) {
      selectedLevels.value = [...newVal.targetLevels]
    }
  }
}, { deep: true })

async function loadAvailableLevels() {
  loading.value = true
  error.value = ''
  
  try {
    // Здесь будет вызов API для получения списка уровней
    // Пока используем заглушку
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Генерируем тестовые уровни
    availableLevels.value = Array.from({ length: 20 }, (_, i) => ({
      label: `Уровень ${i + 1}`,
      value: String(i + 1)
    }))
    
    // Автоматически выбираем текущий уровень
    if (!selectedLevels.value.includes(props.currentLevel)) {
      selectedLevels.value.push(props.currentLevel)
    }
  } catch (err) {
    error.value = 'Не удалось загрузить список уровней'
  } finally {
    loading.value = false
  }
}

function selectAll() {
  selectedLevels.value = availableLevels.value.map(l => l.value)
}

function deselectAll() {
  selectedLevels.value = [props.currentLevel] // Оставляем только текущий
}

function handleApply() {
  const selection = {
    allLevels: selectionMode.value === 'all',
    targetLevels: selectionMode.value === 'selected' ? selectedLevels.value : undefined
  }
  
  emit('apply', selection)
  visible.value = false
}

function handleCancel() {
  visible.value = false
}
</script>

<style scoped>
.levels-container {
  padding: 1rem;
  min-height: 300px;
}

.levels-grid {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.25rem;
}
</style>
