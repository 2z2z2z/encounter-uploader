<template>
  <div class="flex-1 min-w-[160px]">
    <FloatLabel variant="off">
      <Select
        id="sectorMode"
        v-model="sectorMode"
        :options="sectorModeOptions"
        option-label="label"
        option-value="value"
        placeholder="Выберите режим"
        @change="applySectorMode"
        fluid
      />
      <label for="sectorMode">Закрытие уровня</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'
import FloatLabel from 'primevue/floatlabel'
import { useLevelStore } from '@/store/levels'
import type { SectorMode } from '@/entities/level/types'
import type { Answer } from '@/entities/level/types'

// Store для работы с данными
const store = useLevelStore()

// Опции для выбора режима секторов
const sectorModeOptions = [
  { label: 'Все сектора', value: 'all' },
  { label: 'Начальные + финал', value: 'initialAndFinal' },
  { label: 'Только финал', value: 'finalOnly' },
  { label: 'Кастом', value: 'custom' }
]

// Реактивное свойство для режима секторов
const sectorMode = computed<SectorMode>({
  get: () => store.config.sectorMode,
  set: (value) => {
    store.config.sectorMode = value
  }
})

/**
 * Применяет режим секторов ко всем ответам в активном табе
 */
const applySectorMode = (): void => {
  const answers = store.activeTab?.answers
  if (!answers) return

  const totalSectors = answers.length
  const half = Math.floor((totalSectors + 1) / 2)
  const mode = sectorMode.value
  
  switch (mode) {
    case 'all':
      answers.forEach((answer: Answer) => {
        answer.sector = true
      })
      break
    case 'initialAndFinal':
      answers.forEach((answer: Answer) => {
        answer.sector = answer.number <= half || answer.number === totalSectors
      })
      break
    case 'finalOnly':
      answers.forEach((answer: Answer) => {
        answer.sector = answer.number === totalSectors
      })
      break
    case 'custom':
      // Оставляем как есть - пользователь настроил вручную
      break
  }
}
</script>