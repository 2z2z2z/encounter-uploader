<template>
  <div class="flex-1 flex gap-3 max-xs:flex-wrap">
    <FloatLabel variant="off">
      <div class="flex items-center gap-2 flex-nowrap">
        <InputNumber
          id="bonusHours"
          v-model="quickTime.hours"
          :min="0"
          :step="1"
          show-buttons
          suffix=" ч"
          :min-fraction-digits="0"
          :max-fraction-digits="0"
          class="z-w-5"
        />
        <InputNumber
          id="bonusMinutes"
          v-model="quickTime.minutes"
          :min="0"
          show-buttons
          suffix=" м"
          :step="1"
          :min-fraction-digits="0"
          :max-fraction-digits="0"
          class="z-w-5"
        />
        <InputNumber
          id="bonusSeconds"
          v-model="quickTime.seconds"
          :min="0"
          show-buttons
          suffix=" с"
          :step="1"
          :min-fraction-digits="0"
          :max-fraction-digits="0"
          class="z-w-5"
        />
      </div>
      <label for="bonusHours">Бонусное время (ч, м, с)</label>
    </FloatLabel>
    <div class="flex items-center gap-2" v-tooltip.top="'Отрицательное'">
      <Checkbox
        id="bonusNegative"
        v-model="quickTime.negative"
        :binary="true"
        class="cursor-pointer"
        input-id="bonusNegativeCheckbox"
        size="large"
        aria-label="Отрицательное"
      />
      <label
        for="bonusNegative"
        class="text-sm text-surface-600 cursor-pointer"
        aria-hidden="true"
      >
        отр.
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import FloatLabel from 'primevue/floatlabel'
import Tooltip from 'primevue/tooltip'
import { useLevelStore } from '@/store/levels'
import type { TimeValue, Answer } from '@/entities/level/types'

// Store для работы с данными
const store = useLevelStore()
const vTooltip = Tooltip


// Реактивный объект для быстрого ввода бонусного времени
const quickTime = reactive<TimeValue>({
  hours: 0,
  minutes: 0,
  seconds: 0,
  negative: false
})

/**
 * Автоматическое применение изменений бонусного времени ко всем ответам в активном табе
 */
watch(() => ({ ...quickTime }), (timeValue) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем новое время ко всем ответам в активном табе
  answers.forEach((answer: Answer) => {
    answer.bonusTime = { ...timeValue }
  })
}, { deep: true })
</script>

<style>
/* 
 * Стили для z-w-5 класса (ширина поля)
 * Используется обычный CSS вместо @apply для совместимости с TW v4
 */
.z-w-5 {
  width: 5rem;
}
</style>