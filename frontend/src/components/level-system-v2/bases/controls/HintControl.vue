<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="hint"
        v-model="localHint"
        placeholder="Подсказка"
        fluid
      />
      <label for="hint">Подсказка</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { useLevelV2Store } from '../../store'

// Store для работы с данными
const store = useLevelV2Store()

// Локальное значение для ввода подсказки
const localHint = ref<string>('')

/**
 * Автоматическое применение подсказки ко всем ответам в активном табе
 */
watch(localHint, (hint) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем подсказку ко всем ответам
  answers.forEach((answer) => {
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