<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="bonusTask"
        v-model="localBonusTask"
        placeholder="Бонусное задание"
        fluid
      />
      <label for="bonusTask">Бонусное задание</label>
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