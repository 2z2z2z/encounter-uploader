import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { fetchCorrectionForm, fetchCorrectionsList } from '@/services/transport'
import { parseCorrectionForm, parseCorrectionsList } from '@/services/corrections-parser'
import { getErrorMessage } from '@/services/api-types'
import { useAuthStore } from '@/store/auth'
import { ALL_LEVELS_OPTION } from '@/entities/level/constants'
import { createGameKey, findParticipant, isRowSent } from '@/utils/corrections'
import type { Answer, ExistingCorrection, GameLevelOption, GameParticipant } from '@/entities/level/types'

interface GameParams {
  domain?: string
  gameId?: string | number
}

/**
 * Данные игры для корректировок результатов: участники, уровни и внесённые корректировки
 */
export const useCorrectionsStore = defineStore('level-v2/corrections', () => {
  // Списки только заменяются целиком - глубокая реактивность им не нужна
  const participants = shallowRef<GameParticipant[]>([])
  const levels = shallowRef<GameLevelOption[]>([])
  const existing = shallowRef<ExistingCorrection[]>([])
  const isLoading = ref(false)
  const isListLoading = ref(false)
  const isUploading = ref(false)
  const error = ref('')
  const listError = ref('')
  const loadedKey = ref('')

  /** Варианты выбора уровня: все уровни и номера уровней игры */
  const levelOptions = computed<Array<{ label: string, value: string }>>(() => [
    ALL_LEVELS_OPTION,
    ...levels.value.map(({ number }) => ({ label: number, value: number }))
  ])

  /**
   * Проверяет параметры игры и обновляет авторизацию перед запросом к EN
   */
  async function prepareRequest(
    { domain, gameId }: GameParams,
    shouldAuthenticate = true
  ): Promise<{ domain: string, gameId: string | number }> {
    if (!domain || !gameId) {
      throw new Error('Не заданы домен и ID игры')
    }
    if (!shouldAuthenticate) {
      return { domain, gameId }
    }
    const authStore = useAuthStore()
    await authStore.authenticate(domain)
    if (!authStore.loggedIn) {
      throw new Error(`Ошибка авторизации: ${authStore.error}`)
    }
    return { domain, gameId }
  }

  /**
   * Загружает участников и уровни игры из формы добавления корректировки
   */
  async function loadGameData(params: GameParams, force = false): Promise<void> {
    const key = createGameKey(params.domain || '', params.gameId ?? '')
    if (!force && loadedKey.value === key && participants.value.length > 0) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      const { domain, gameId } = await prepareRequest(params)
      const data = parseCorrectionForm(await fetchCorrectionForm(domain, gameId))
      participants.value = data.participants
      levels.value = data.levels
      loadedKey.value = key
    } catch (err: unknown) {
      participants.value = []
      levels.value = []
      loadedKey.value = ''
      error.value = getErrorMessage(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загружает корректировки, уже внесённые в игру.
   * shouldAuthenticate = false, если авторизация только что обновлена другим запросом
   */
  async function loadExisting(params: GameParams, shouldAuthenticate = true): Promise<ExistingCorrection[]> {
    isListLoading.value = true
    listError.value = ''

    try {
      const { domain, gameId } = await prepareRequest(params, shouldAuthenticate)
      existing.value = parseCorrectionsList(await fetchCorrectionsList(domain, gameId))
      return existing.value
    } catch (err: unknown) {
      listError.value = getErrorMessage(err)
      throw err
    } finally {
      isListLoading.value = false
    }
  }

  /**
   * Приводит участников строк к списку игры: ID по имени (после импорта CSV или смены игры)
   * и актуальное имя по ID (команду могли переименовать)
   */
  function syncRows(rows: Answer[]): void {
    rows.filter(row => row.participant && !isRowSent(row)).forEach(row => {
      const found = findParticipant(row.participant, participants.value)
      if (found && (found.id !== row.participant?.id || found.name !== row.participant?.name)) {
        row.participant = { ...found }
      }
    })
  }

  return {
    participants,
    levels,
    levelOptions,
    existing,
    isLoading,
    isListLoading,
    isUploading,
    error,
    listError,
    loadGameData,
    loadExisting,
    syncRows
  }
})
