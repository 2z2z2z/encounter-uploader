<template>
  <div class="flex-1 min-w-[160px]">
    <Button
      label="Уровни бонусов"
      icon="pi pi-list"
      @click="openLevelsModal"
      :loading="isModalOpen"
      outlined
      size="small"
    />

    <!-- LevelsModal integration -->
    <LevelsModal
      :model-value="isModalOpen"
      :current-level="store.levelId"
      @update:model-value="isModalOpen = $event"
      @apply="applyLevels"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import LevelsModal from '../../../common/modals/LevelsModal.vue'
import { useLevelV2Store } from '../../store'

// Store для работы с данными
const store = useLevelV2Store()

// Состояние модала
const isModalOpen = ref(false)

/**
 * Открытие модала выбора уровней
 */
const openLevelsModal = (): void => {
  isModalOpen.value = true
}

/**
 * Применение выбранных уровней ко всем ответам в активном табе
 */
const applyLevels = (selection: { allLevels: boolean; targetLevels?: string[] }): void => {
  const answers = store.activeTab?.answers
  if (!answers) return

  const selectedLevels = selection.allLevels 
    ? ['all'] 
    : selection.targetLevels || []

  // Применяем выбранные уровни ко всем ответам в активном табе
  answers.forEach((answer) => {
    answer.bonusLevels = selectedLevels.slice()
  })

  isModalOpen.value = false
}
</script>