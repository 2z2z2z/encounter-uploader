<template>
  <div class="flex-1 min-w-[180px] flex flex-col gap-1">
    <span id="correctionTypeLabel" class="text-sm text-surface-500">Тип для всех строк</span>
    <SelectButton
      :model-value="correctionType"
      :options="CORRECTION_TYPE_OPTIONS"
      option-label="label"
      option-value="value"
      aria-labelledby="correctionTypeLabel"
      :pt="getCorrectionTypePt(correctionType)"
      @update:model-value="applyType"
    />
  </div>
</template>

<script setup lang="ts">
import SelectButton from 'primevue/selectbutton'
import { useBulkRowEdit } from '@/composables/levels/useBulkRowEdit'
import { CORRECTION_TYPE_OPTIONS } from '@/entities/level/constants'
import { getCorrectionTypePt } from '@/utils/corrections'
import type { CorrectionType } from '@/entities/level/types'

const { value: correctionType, apply: applyType } = useBulkRowEdit<CorrectionType | null>(
  () => null,
  (row, value) => { row.correctionType = value }
)
</script>
