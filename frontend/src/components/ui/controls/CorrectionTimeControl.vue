<template>
  <div class="flex-1">
    <FloatLabel variant="off">
      <div class="flex items-center gap-2 flex-nowrap">
        <InputNumber
          v-for="unit in DURATION_UNITS"
          :id="`correctionTime-${unit.key}`"
          :key="unit.key"
          :model-value="quickTime[unit.key]"
          :min="0"
          :step="1"
          show-buttons
          :suffix="unit.suffix"
          :min-fraction-digits="0"
          :max-fraction-digits="0"
          class="z-w-5"
          @update:model-value="apply({ ...quickTime, [unit.key]: $event || 0 })"
        />
      </div>
      <label for="correctionTime-days">Время для всех строк (д, ч, м, с)</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import InputNumber from 'primevue/inputnumber'
import FloatLabel from 'primevue/floatlabel'
import { useBulkRowEdit } from '@/composables/levels/useBulkRowEdit'
import { DEFAULT_DURATION, DURATION_UNITS } from '@/entities/level/constants'
import type { DurationValue } from '@/entities/level/types'

const { value: quickTime, apply } = useBulkRowEdit<DurationValue>(
  () => ({ ...DEFAULT_DURATION }),
  (row, value) => { row.correctionTime = { ...value } }
)
</script>
