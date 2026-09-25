<template>
  <div class="flex-1 min-w-[160px] flex flex-col gap-1">
    <label for="correctionLevel" class="text-sm text-surface-500">Уровень для всех строк</label>
    <Select
      input-id="correctionLevel"
      :model-value="level"
      :options="correctionsStore.levelOptions"
      option-label="label"
      option-value="value"
      placeholder="Не менять"
      fluid
      @update:model-value="applyLevel"
    />
  </div>
</template>

<script setup lang="ts">
import Select from 'primevue/select'
import { useCorrectionsStore } from '@/store/corrections'
import { useBulkRowEdit } from '@/composables/levels/useBulkRowEdit'
import { fromLevelSelectValue } from '@/utils/corrections'

const correctionsStore = useCorrectionsStore()

const { value: level, apply: applyLevel } = useBulkRowEdit<string | null>(
  () => null,
  (row, value) => { row.correctionLevel = fromLevelSelectValue(value) }
)
</script>
