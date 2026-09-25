<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="correctionComment"
        :model-value="comment"
        placeholder="Причина бонуса или штрафа"
        :maxlength="MAX_CORRECTION_COMMENT_LENGTH"
        fluid
        @update:model-value="onInput"
      />
      <label for="correctionComment">Комментарий для всех строк</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { useDebounceFn } from '@vueuse/core'
import { useBulkRowEdit } from '@/composables/levels/useBulkRowEdit'
import { MAX_CORRECTION_COMMENT_LENGTH } from '@/entities/level/constants'

/** Пауза перед записью: каждое применение переписывает комментарий во всех строках */
const APPLY_DELAY_MS = 300

const { value: comment, apply } = useBulkRowEdit<string>(
  () => '',
  (row, value) => { row.comment = value }
)
const applyDebounced = useDebounceFn(apply, APPLY_DELAY_MS)

/**
 * Показывает ввод сразу, а в строки записывает после паузы в наборе
 */
const onInput = (value: string | undefined): void => {
  comment.value = value || ''
  void applyDebounced(comment.value)
}
</script>
