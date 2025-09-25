<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="sectorName"
        v-model="localSectorName"
        placeholder="Название секторов"
        fluid
      />
      <label for="sectorName">Название секторов</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { useLevelStore } from '../../store'
import type { Answer } from '../../types/fields'

// Store для работы с данными
const store = useLevelStore()

// Локальное значение для ввода названия секторов
const localSectorName = ref<string>('')

/**
 * Автоматическое применение названия секторов ко всем ответам в активном табе
 */
watch(localSectorName, (name) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем название ко всем ответам
  answers.forEach((answer: Answer) => {
    answer.sectorName = name || ''
  })
})

/**
 * Инициализация компонента
 */
onMounted(() => {
  localSectorName.value = ''
})
</script>