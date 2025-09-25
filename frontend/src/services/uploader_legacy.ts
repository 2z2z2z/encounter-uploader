/**
 * LEGACY: Устаревший файл uploader.ts
 *
 * Этот файл содержит старые версии функций для обратной совместимости.
 * ВСЕ ФУНКЦИИ ПЕРЕНЕСЕНЫ В:
 * - services/transport.ts - для HTTP запросов
 * - services/levelPayloads/ - для создания пейлоадов
 *
 * Этот файл может быть удален после полной миграции.
 */

// Типы импортированы для обратной совместимости

/**
 * @deprecated Перенесено в services/transport.ts
 * Описание одного сектора/бонуса.
 */
export interface Answer {
  number: number
  variants: string[]
  inSector: boolean
  inBonus: boolean
  /** Если true — бонус доступен на всех уровнях (rbAllLevels=0), иначе — на указанных (rbAllLevels=1). */
  allLevels?: boolean
  bonusTime: {
    hours: number
    minutes: number
    seconds: number
    negative: boolean
  }
  /** Задержка появления бонуса (chkDelay + txtDelay*) */
  delay?: {
    hours: number
    minutes: number
    seconds: number
  }
  /** Ограничение (относительное время) работы бонуса (chkRelativeLimit + txtValid*) */
  relativeLimit?: {
    hours: number
    minutes: number
    seconds: number
  }
  closedText: string
  displayText: string
  sectorName?: string
  bonusName?: string
  noHint?: boolean
  /** Текст/HTML бонусного задания → textarea name=txtTask */
  bonusTask?: string
  /** Текст/HTML подсказки → textarea name=txtHelp */
  bonusHint?: string
  /**
   * Дополнительные уровни (метки), для которых нужно отметить чекбоксы при создании бонуса.
   * Это значения-ярлыки, отображаемые на форме EN (например, "12", "13").
   * Уровень из настроек (параметр level) будет добавлен автоматически и может не указываться здесь.
   */
  targetLevels?: string[]
}

/**
 * @deprecated Используйте import { sendTask } from '@/services/transport'
 */
export function buildTaskPayload(): never {
  throw new Error('buildTaskPayload is deprecated. Use services/transport.ts instead')
}

/**
 * @deprecated Используйте import { sendSector } from '@/services/transport'
 */
export function buildSectorPayload(): never {
  throw new Error('buildSectorPayload is deprecated. Use services/transport.ts instead')
}

/**
 * @deprecated Используйте import { sendBonus } from '@/services/transport'
 */
export function buildBonusPayload(): never {
  throw new Error('buildBonusPayload is deprecated. Use services/transport.ts instead')
}

/**
 * @deprecated Используйте import { sendTask } from '@/services/transport'
 */
export async function sendTask(): Promise<never> {
  throw new Error('sendTask is deprecated. Use services/transport.ts instead')
}

/**
 * @deprecated Используйте import { sendSector } from '@/services/transport'
 */
export async function sendSector(): Promise<never> {
  throw new Error('sendSector is deprecated. Use services/transport.ts instead')
}

/**
 * @deprecated Используйте import { sendBonus } from '@/services/transport'
 */
export async function sendBonuses(): Promise<never> {
  throw new Error('sendBonuses is deprecated. Use services/transport.ts instead')
}

/**
 * @deprecated Используйте import { fetchBonusLevels } from '@/services/transport'
 */
export async function fetchBonusLevels(): Promise<never> {
  throw new Error('fetchBonusLevels is deprecated. Use services/transport.ts instead')
}