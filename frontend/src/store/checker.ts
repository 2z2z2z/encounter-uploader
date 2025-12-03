/**
 * Store для функционала "Проверятор"
 *
 * Управляет режимом приложения (uploader/checker) и данными проверки сценария.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isValidScenarioUrl, extractDomainFromUrl, extractGameIdFromUrl } from '@/utils/scenario-url'

/** Статус проверки поля */
export type CheckStatus = 'ok' | 'warning' | 'error'

/** Результаты проверки уровня */
export interface LevelCheckResult {
  name: CheckStatus
  codesLocation: CheckStatus
  codesType: CheckStatus
  codesParts: CheckStatus
  codesFormat: CheckStatus
  hints: CheckStatus
  sectors: CheckStatus
  autoTransition: CheckStatus
  penalty: CheckStatus
  bonuses: CheckStatus
}

/** Уровень из распарсенного сценария */
export interface ScenarioLevel {
  number: number
  name: string | null
  codesLocation: string | null
  codesType: string | null
  codesParts: string | null
  codesFormat: string | null
  hintsCount: number
  sectorsCount: number
  sectorsWithAnswers: number
  autoTransition: string | null
  /** Штраф за автопереход */
  penalty: string | null
  /** Количество бонусов на уровне */
  bonusCount: number
  /** Количество бонусов с ответами */
  bonusesWithAnswers: number
  /** Суммарное бонусное время уровня */
  bonusTime: string | null
  /** Результаты проверки */
  checks: LevelCheckResult
}

/** Статистика сценария */
export interface ScenarioStats {
  totalLevels: number
  totalSectors: number
  totalHints: number
}

/** Режим приложения */
export type AppMode = 'uploader' | 'checker'

/** Тип игры для проверятора */
export type GameType = 'points' | 'encounter'

/** Labels для отображения типов игры */
export const GAME_TYPE_LABELS: Record<GameType, string> = {
  points: 'Точки',
  encounter: 'Схватка'
}

/**
 * Store для проверятора
 */
export const useCheckerStore = defineStore(
  'checker',
  () => {
    // ===== Режим приложения =====
    const mode = ref<AppMode>('uploader')

    // ===== Данные проверятора =====
    const scenarioUrl = ref<string>('')
    const gameType = ref<GameType | null>(null)
    const gameName = ref<string>('')
    const isLoading = ref<boolean>(false)
    const loadingProgress = ref<number>(0)
    const error = ref<string | null>(null)
    const levels = ref<ScenarioLevel[]>([])
    /** Дата и время последней проверки */
    const checkDateTime = ref<Date | null>(null)

    // ===== Геттеры =====

    /** Статистика сценария */
    const stats = computed<ScenarioStats>(() => ({
      totalLevels: levels.value.length,
      totalSectors: levels.value.reduce((sum, level) => sum + level.sectorsCount, 0),
      totalHints: levels.value.reduce((sum, level) => sum + level.hintsCount, 0)
    }))

    /** Проверка валидности URL сценария */
    const isValidUrl = computed<boolean>(() => isValidScenarioUrl(scenarioUrl.value))

    /** Домен из URL сценария */
    const scenarioDomain = computed<string | null>(() => extractDomainFromUrl(scenarioUrl.value))

    /** ID игры из URL сценария */
    const scenarioGameId = computed<string | null>(() => extractGameIdFromUrl(scenarioUrl.value))

    // ===== Действия =====

    /**
     * Устанавливает режим приложения
     */
    function setMode(newMode: AppMode): void {
      mode.value = newMode
    }

    /**
     * Устанавливает URL сценария
     */
    function setScenarioUrl(url: string): void {
      scenarioUrl.value = url
    }

    /**
     * Устанавливает тип игры
     */
    function setGameType(type: GameType | null): void {
      gameType.value = type
    }

    /**
     * Начинает загрузку
     */
    function startLoading(): void {
      isLoading.value = true
      loadingProgress.value = 0
      error.value = null
    }

    /**
     * Обновляет прогресс загрузки
     */
    function setProgress(progress: number): void {
      loadingProgress.value = Math.min(100, Math.max(0, progress))
    }

    /**
     * Завершает загрузку с ошибкой
     */
    function setError(errorMessage: string): void {
      error.value = errorMessage
      isLoading.value = false
      loadingProgress.value = 0
    }

    /**
     * Устанавливает название игры
     */
    function setGameName(name: string): void {
      gameName.value = name
    }

    /**
     * Устанавливает распарсенные уровни
     */
    function setLevels(parsedLevels: ScenarioLevel[]): void {
      levels.value = parsedLevels
      isLoading.value = false
      loadingProgress.value = 100
    }

    /**
     * Устанавливает дату и время проверки
     */
    function setCheckDateTime(date: Date): void {
      checkDateTime.value = date
    }

    /**
     * Очищает данные проверки
     */
    function clearCheck(): void {
      levels.value = []
      gameName.value = ''
      gameType.value = null
      error.value = null
      loadingProgress.value = 0
      isLoading.value = false
      checkDateTime.value = null
    }

    /**
     * Сбрасывает store к начальному состоянию
     */
    function reset(): void {
      mode.value = 'uploader'
      scenarioUrl.value = ''
      clearCheck()
    }

    return {
      // Состояние
      mode,
      scenarioUrl,
      gameType,
      gameName,
      isLoading,
      loadingProgress,
      error,
      levels,
      checkDateTime,

      // Геттеры
      stats,
      isValidScenarioUrl: isValidUrl,
      scenarioDomain,
      scenarioGameId,

      // Действия
      setMode,
      setScenarioUrl,
      setGameType,
      setGameName,
      startLoading,
      setProgress,
      setError,
      setLevels,
      setCheckDateTime,
      clearCheck,
      reset
    }
  },
  {
    persist: {
      pick: ['mode', 'scenarioUrl', 'gameType']
    }
  }
)
