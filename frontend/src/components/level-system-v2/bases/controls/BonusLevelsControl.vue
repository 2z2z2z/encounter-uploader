<template>
  <div class="flex-1 min-w-[160px]">
    <Button
      label="Уровни бонусов"
      icon="pi pi-list"
      @click="openLevelsModal"
      :loading="bonusLevelsStore.isLoading && isModalOpen"
      outlined
      size="small"
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

interface LevelsSelection {
  allLevels: boolean
  targetLevels: string[]
}

const store = useLevelV2Store()
const bonusLevelsStore = useBonusLevelsStore()

const isModalOpen = ref(false)
const modalSelection = reactive<LevelsSelection>({
  allLevels: true,
  targetLevels: []
})

function buildInitialSelection(): LevelsSelection {
  const answers = store.activeTab?.answers
  if (!answers || answers.length === 0) {
    return { allLevels: true, targetLevels: [] }
  }

  const first = answers[0]
  const currentLevels = Array.isArray(first.bonusLevels) ? [...first.bonusLevels] : []
  const allLevels = currentLevels.length === 0

  return {
    allLevels,
    targetLevels: allLevels ? [] : currentLevels
  }
}

const openLevelsModal = (): void => {
  const selection = buildInitialSelection()
  modalSelection.allLevels = selection.allLevels
  modalSelection.targetLevels = [...selection.targetLevels]
  isModalOpen.value = true
  void bonusLevelsStore.loadLevels({
    domain: store.domain,
    gameId: store.gameId,
    levelId: store.levelId
  }).catch(() => undefined)
}

const applyLevels = (selection: { allLevels: boolean; targetLevels?: string[] }): void => {
  const answers = store.activeTab?.answers
  if (!answers || answers.length === 0) {
    isModalOpen.value = false
    return
  }

  const normalized = selection.allLevels ? [] : Array.from(new Set(selection.targetLevels || [])).map(String)
  let hasChanges = false

  answers.forEach((answer) => {
    const previous = Array.isArray(answer.bonusLevels) ? answer.bonusLevels : []

    if (selection.allLevels) {
      if (previous.length > 0) {
        answer.bonusLevels = []
        hasChanges = true
      }
      return
    }

    const next = normalized.slice()
    const sameLength = previous.length === next.length
    const sameValues = sameLength && previous.every((value, index) => value === next[index])

    if (!sameValues) {
      answer.bonusLevels = next
      hasChanges = true
    }
  })

  if (hasChanges) {
    store.markDirty()
  }

  isModalOpen.value = false
}
</script>

