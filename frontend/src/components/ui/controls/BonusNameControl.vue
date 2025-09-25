<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="bonusName"
        v-model="localBonusName"
        placeholder="Название бонусов"
        fluid
      />
      <label for="bonusName">Название бонусов</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { useLevelStore } from '@/store/levels'
import type { Answer } from '@/entities/level/types'

// Store для работы с данными
const store = useLevelStore()

// Локальное значение для ввода названия бонусов
const localBonusName = ref<string>('')

/**
 * Автоматическое применение названия бонусов ко всем ответам в активном табе
 */
watch(localBonusName, (name) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем название ко всем ответам
  answers.forEach((answer: Answer) => {
    answer.bonusName = name || ''
  })
})

/**
 * Инициализация компонента
 */
onMounted(() => {
  localBonusName.value = ''
})
</script>