<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="closedPattern"
        v-model="localClosedPattern"
        placeholder="Текст, & или URL картинки"
        fluid
      />
      <label for="closedPattern">Название закрытого сектора</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { useLevelStore } from '../../store'

// Store для работы с данными
const store = useLevelStore()

// Локальное значение для ввода паттерна закрытого сектора
const localClosedPattern = ref<string>('')

/**
 * Автоматическое применение паттерна закрытого сектора ко всем ответам в активном табе
 * Символ '&' заменяется на номер соответствующего ответа
 */
watch(localClosedPattern, (pattern) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем паттерн ко всем ответам, заменяя '&' на номер ответа
  answers.forEach((answer) => {
    answer.closedText = (pattern || '').replace(/&/g, String(answer.number))
  })
})

/**
 * Инициализация компонента
 */
onMounted(() => {
  localClosedPattern.value = ''
})
</script>