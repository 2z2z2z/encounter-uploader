/**
 * Общие типы для всех Olymp компонентов
 */

export interface BonusTime {
  hours: number
  minutes: number
  seconds: number
  negative: boolean
}

export interface DelayTime {
  hours: number
  minutes: number
  seconds: number
}

export interface Answer {
  number: number
  variants: string[]
  inSector: boolean
  inBonus: boolean
  bonusTime: BonusTime
  delay?: DelayTime
  relativeLimit?: DelayTime
  closedText: string
  displayText: string
  sectorName?: string
  bonusName?: string
  bonusTask?: string
  bonusHint?: string
  noHint?: boolean
  targetLevels?: string[]
  allLevels?: boolean
}

export type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'

export interface OlympConfig {
  sectorMode: SectorMode
  bonusTime: BonusTime
}

export interface OlympTypeConfig {
  sectors: number
  type: 'olymp' | 'olymp31' | 'olymp63' | 'olymp127'
  label: string
}

export interface ExportData {
  config: OlympConfig
  closedPattern: string
  answers: Answer[]
  version?: number
}

export interface ImportData {
  config?: OlympConfig
  closedPattern?: string
  answers?: Answer[]
  // Legacy support
  answer?: string
}