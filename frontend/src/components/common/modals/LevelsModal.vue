<template>
  <BaseModal
    v-model="visible"
    header="Выбор уровней для бонуса"
    width="50vw"
  >
    <div class="levels-container">
      <div class="mb-4">
        <RadioButton 
          v-model="selectionMode" 
          input-id="levels-all"
          value="all"
        />
        <label for="levels-all" class="ml-2 cursor-pointer">
          На все уровни
        </label>
      </div>
      
      <div class="mb-4">
        <RadioButton 
          v-model="selectionMode" 
          input-id="levels-selected"
          value="selected"
        />
        <label for="levels-selected" class="ml-2 cursor-pointer">
          На выбранные уровни
        </label>
      </div>
      
      <div v-if="selectionMode === 'selected'" class="levels-grid">
        <Message v-if="loading" severity="info" :closable="false">
          Загружаем список уровней...
        </Message>
        
        <Message v-else-if="errorMessage" severity="error" :closable="false">
          {{ errorMessage }}
        </Message>
        
        <Message
          v-else-if="!availableLevels.length"
          severity="warn"
          :closable="false"
        >
          Список уровней пуст.
        </Message>
        
        <div v-else class="grid grid-cols-4 gap-2">
          <div v-for="level in availableLevels" :key="level.value" class="flex items-center">
            <Checkbox
              v-model="selectedLevels"
              :input-id="`level-${level.value}`"
              :value="level.value"
              :disabled="level.value === baseLevel"
            />
            <label 
              :for="`level-${level.value}`" 
              class="ml-2 cursor-pointer"
              :class="{ 'font-bold': level.value === baseLevel }"
            >
              {{ level.label }}
              <span v-if="level.value === baseLevel" class="text-sm text-gray-500">
                (текущий)
              </span>
            </label>
          </div>
        </div>
        
        <div class="mt-4 flex gap-2">
          <BaseButton variant="secondary" size="small" @click="selectAll" :disabled="!availableLevels.length">
            Выбрать все
          </BaseButton>
          <BaseButton variant="secondary" size="small" @click="deselectAll" :disabled="!availableLevels.length">
            Очистить
          </BaseButton>
          <BaseButton variant="secondary" size="small" @click="refreshLevels">
            Обновить
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
import { computed, ref, watch } from 'vue'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useLevelV2Store } from '@/components/level-system-v2/store'
import { useBonusLevelsStore } from '@/components/level-system-v2/store/bonusLevels'

interface LevelOption {
  label: string
  value: string
}

interface LevelsSelection {
  allLevels: boolean
  targetLevels?: string[]
}

interface Props {
  modelValue: boolean
  currentLevel: string
  initialSelection?: LevelsSelection
}

const props = withDefaults(defineProps<Props>(), {
  initialSelection: () => ({
    allLevels: true,
    targetLevels: []
  })
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [selection: LevelsSelection]
}>()

const levelStore = useLevelV2Store()
const bonusLevelsStore = useBonusLevelsStore()

const baseLevel = computed(() => String(props.currentLevel || '').trim())

const availableLevels = computed<LevelOption[]>(() => {
  return bonusLevelsStore.options.map(option => ({
    label: option.label,
    value: option.label
  }))
})

const loading = computed(() => bonusLevelsStore.isLoading)
const manualError = ref('')
const errorMessage = computed(() => manualError.value || bonusLevelsStore.error)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const selectionMode = ref<'all' | 'selected'>('all')
const selectedLevels = ref<string[]>([])

function setSelectedLevels(values: string[]): void {
  const base = baseLevel.value
  const unique = new Set<string>(
    values.map(v => String(v || '').trim()).filter(Boolean)
  )

  if (base) {
    unique.add(base)
  }

  selectedLevels.value = Array.from(unique)
}

function syncSelectionFromProps(): void {
  const initial = props.initialSelection

  if (!initial || initial.allLevels) {
    selectionMode.value = 'all'
    setSelectedLevels([])
  } else {
    selectionMode.value = 'selected'
    setSelectedLevels(initial.targetLevels || [])
  }
}

async function loadAvailableLevels(force = false): Promise<void> {
  manualError.value = ''
  if (!levelStore.domain || !levelStore.gameId || !levelStore.levelId) {
    manualError.value = 'Укажите домен, игру и уровень, чтобы получить список уровней.'
    bonusLevelsStore.reset()
    return
  }

  try {
    await bonusLevelsStore.loadLevels({
      domain: levelStore.domain,
      gameId: levelStore.gameId,
      levelId: levelStore.levelId
    }, force)
  } catch {
    // Ошибка уже сохранена в сторе, дополнительная обработка не требуется
  }
}

function refreshLevels(): void {
  void loadAvailableLevels(true)
}

function selectAll(): void {
  setSelectedLevels(availableLevels.value.map(level => level.value))
}

function deselectAll(): void {
  setSelectedLevels([])
}

function handleApply(): void {
  const isAllLevels = selectionMode.value === 'all'
  const targetLevels = isAllLevels
    ? undefined
    : selectedLevels.value.filter(level => level !== baseLevel.value)

  emit('apply', { allLevels: isAllLevels, targetLevels })
  visible.value = false
}

function handleCancel(): void {
  visible.value = false
}

// Синхронизация состояния только при открытии модального окна
watch(() => visible.value, (isVisible) => {
  if (isVisible) {
    syncSelectionFromProps()
    void loadAvailableLevels()
  }
})
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
