<template>
  <Button 
    @click="fillOpenSectors" 
    label="Заполнить открытые сектора"
    icon="pi pi-copy"
    class="max-xs:w-full"
  />
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { useLevelV2Store } from '../../store'

// Store для работы с данными
const store = useLevelV2Store()

/**
 * Заполняет открытые сектора первым вариантом ответа
 * Копирует первый вариант из variants[0] в displayText для всех ответов
 */
const fillOpenSectors = (): void => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Заполняем displayText первым вариантом ответа для всех ответов в активном табе
  answers.forEach((answer) => {
    answer.displayText = answer.variants[0] || ''
  })
}
</script>