<template>
  <div class="flex-1 min-w-[160px]">
    <Button
      label="Уровни бонусов"
      icon="pi pi-list"
      class="max-xs:w-full"
      @click="openLevelsModal"
      :loading="bonusLevelsStore.isLoading && isModalOpen"
    />

    <LevelsModal
      :model-value="isModalOpen"
      :current-level="store.levelId"
      :initial-selection="modalSelection"
      @update:model-value="isModalOpen = $event"
      @apply="applyLevels"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import Button from 'primevue/button'
import LevelsModal from '../../../common/modals/LevelsModal.vue'
import { useLevelV2Store } from '../../store'
import { useBonusLevelsStore } from '../../store/bonusLevels'
import {
  buildInitialSelection,
  applyLevelsToAnswers,
  type LevelsSelection
} from '../../composables/useBonusLevelsSelection'

const store = useLevelV2Store()
const bonusLevelsStore = useBonusLevelsStore()

const isModalOpen = ref(false)
const modalSelection = reactive<LevelsSelection>({
  allLevels: true,
  targetLevels: []
})


const openLevelsModal = (): void => {
  const selection = buildInitialSelection(store.activeTab?.answers, store.levelId)
  modalSelection.allLevels = selection.allLevels
  modalSelection.targetLevels = [...(selection.targetLevels || [])]
  isModalOpen.value = true
  void bonusLevelsStore.loadLevels({
    domain: store.domain,
    gameId: store.gameId,
    levelId: store.levelId
  }).catch(() => undefined)
}

const applyLevels = (selection: LevelsSelection): void => {
  const answers = store.activeTab?.answers
  if (!answers || answers.length === 0) {
    isModalOpen.value = false
    return
  }

  const hasChanges = applyLevelsToAnswers(selection, answers)

  if (hasChanges) {
    store.markDirty()
  }

  isModalOpen.value = false
}
</script>

