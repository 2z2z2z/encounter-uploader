<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <Textarea
        id="hint"
        v-model="localHint"
        placeholder="Подсказка"
        auto-resize
        rows="1"
        fluid
        class="textarea-collapsible-lg"
      />
      <label for="hint">Подсказка</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'
import { useLevelStore } from '../../store'
import type { Answer } from '../../types/fields'

// Store для работы с данными
const store = useLevelStore()

// Локальное значение для ввода подсказки
const localHint = ref<string>('')

/**
 * Автоматическое применение подсказки ко всем ответам в активном табе
 */
watch(localHint, (hint) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем подсказку ко всем ответам
  answers.forEach((answer: Answer) => {
    answer.hint = hint || ''
  })
})

/**
 * Инициализация компонента
 */
onMounted(() => {
  localHint.value = ''
})
</script>