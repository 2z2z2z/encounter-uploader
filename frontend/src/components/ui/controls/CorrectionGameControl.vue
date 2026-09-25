<template>
  <div class="flex-1 min-w-[240px] flex items-center gap-2">
    <Button
      icon="pi pi-refresh"
      severity="secondary"
      variant="outlined"
      :loading="correctionsStore.isLoading"
      aria-label="Обновить участников и уровни игры"
      v-tooltip.top="'Обновить участников и уровни из EN'"
      @click="loadGameData(true)"
    />
    <div class="text-sm leading-tight min-w-0">
      <div class="text-surface-500">Участники и уровни игры</div>
      <div v-if="correctionsStore.isLoading" class="text-surface-700">Загрузка...</div>
      <div
        v-else-if="correctionsStore.error"
        class="text-red-600 text-wrap"
      >
        {{ correctionsStore.error }}
      </div>
      <div v-else class="text-surface-900">
        участников: {{ correctionsStore.participants.length }}, уровней: {{ correctionsStore.levels.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Загружает участников и уровни игры для таблицы корректировок
 * и следит, чтобы таблица не смешивала строки разных игр
 */
import { nextTick, onMounted } from 'vue'
import Button from 'primevue/button'
import Tooltip from 'primevue/tooltip'
import { useConfirm } from 'primevue/useconfirm'
import { useLevelStore } from '@/store/levels'
import { useCorrectionsStore } from '@/store/corrections'
import { GAME_KEY_CONFIG_FIELD } from '@/entities/level/constants'
import { createGameKey } from '@/utils/corrections'

const vTooltip = Tooltip
const store = useLevelStore()
const correctionsStore = useCorrectionsStore()
const confirm = useConfirm()

/**
 * Загружает списки игры и подставляет ID участников в строки, добавленные по имени
 */
const loadGameData = async (force = false): Promise<void> => {
  try {
    await correctionsStore.loadGameData({ domain: store.domain, gameId: store.gameId }, force)
    correctionsStore.syncRows(store.allAnswers)
  } catch (err: unknown) {
    console.error('[CorrectionGameControl] Failed to load game data:', err)
  }
}

/**
 * Предлагает очистить таблицу, если она заполнялась для другой игры.
 * Таблица привязывается к текущей игре только после ответа, иначе вопрос повторится
 */
const checkGameBinding = (): void => {
  const gameKey = createGameKey(store.domain, store.gameId)
  const boundGame = store.config[GAME_KEY_CONFIG_FIELD]
  const bindToGame = (): void => store.updateConfig({ [GAME_KEY_CONFIG_FIELD]: gameKey })

  if (typeof boundGame !== 'string' || boundGame === gameKey || store.allAnswers.length === 0) {
    bindToGame()
    return
  }

  const [domain, gameId] = boundGame.split('|')
  confirm.require({
    header: 'Таблица от другой игры',
    message: `В таблице корректировки для игры ${gameId} (${domain}). Очистить таблицу для игры ${store.gameId}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Очистить',
    rejectLabel: 'Оставить',
    rejectClass: 'p-button-outlined',
    accept: () => {
      store.clearAllTabs()
      bindToGame()
    },
    reject: bindToGame,
    onHide: bindToGame
  })
}

onMounted(async () => {
  // Строки из localStorage загружает страница в своём onMounted, он выполняется после дочерних
  await nextTick()
  checkGameBinding()
  await loadGameData()
})
</script>
