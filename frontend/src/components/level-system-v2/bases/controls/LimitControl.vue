<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <div class="flex items-center gap-2 flex-nowrap">
        <InputNumber
          id="limitHours"
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
          id="limitMinutes"
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
          id="limitSeconds"
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
      <label for="limitHours">Ограничение (ч, м, с)</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import FloatLabel from 'primevue/floatlabel'
import { useLevelV2Store } from '../../store'

// Store для работы с данными
const store = useLevelV2Store()

// Реактивный объект для быстрого ввода ограничения
const quickTime = reactive({
  hours: 0,
  minutes: 0,
  seconds: 0
})

/**
 * Автоматическое применение изменений ограничения ко всем ответам в активном табе
 */
watch(() => ({ ...quickTime }), (timeValue) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем новое время ко всем ответам в активном табе
  answers.forEach((answer) => {
    answer.limit = { ...timeValue }
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