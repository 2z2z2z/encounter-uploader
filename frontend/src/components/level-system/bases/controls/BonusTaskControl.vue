<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <Textarea
        id="bonusTask"
        v-model="localBonusTask"
        placeholder="Бонусное задание"
        auto-resize
        rows="1"
        fluid
        class="textarea-collapsible-lg"
      />
      <label for="bonusTask">Бонусное задание</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Textarea from 'primevue/textarea'
import FloatLabel from 'primevue/floatlabel'
import { useLevelStore } from '../../store'

// Store для работы с данными
const store = useLevelStore()

// Локальное значение для ввода бонусного задания
const localBonusTask = ref<string>('')

/**
 * Автоматическое применение бонусного задания ко всем ответам в активном табе
 */
watch(localBonusTask, (task) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем задание ко всем ответам
  answers.forEach((answer) => {
    answer.bonusTask = task || ''
  })
})

/**
 * Инициализация компонента
 */
onMounted(() => {
  localBonusTask.value = ''
})
</script>