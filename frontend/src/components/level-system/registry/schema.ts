// Типы для единого реестра полей/контролов и конфигов типов уровней

export type FieldId =
  | 'variants'
  | 'inSector'
  | 'inBonus'
  | 'bonusTime'
  | 'closedText'
  | 'displayText'
  | 'sectorName'
  | 'bonusName'
  | 'bonusTask'
  | 'bonusHint'
  | 'delay'
  | 'relativeLimit'
  | 'targetLevels'
  | 'allLevels'
  | 'htmlTask'

export type FieldType =
  | 'string'
  | 'string[]'
  | 'boolean'
  | 'time'        // { hours, minutes, seconds, negative? }
  | 'timeRange'   // { hours, minutes, seconds }
  | 'levels'      // { targetLevels?: string[], allLevels?: boolean }
  | 'html'        // произвольный HTML-текст (например, htmlTask)

export interface FieldDefinition {
  id: FieldId
  label: string
  type: FieldType
  scope: 'row' | 'global'
  description?: string
}

export type ControlId =
  | 'sectorMode'
  | 'closedPattern'
  | 'fillOpenSectors'
  | 'quickBonusTime'
  | 'sectorPattern'
  | 'bonusPattern'
  | 'bonusTaskPattern'
  | 'bonusHintPattern'
  | 'quickDelay'
  | 'quickRelativeLimit'
  | 'levelsModal'
  | 'combineSectors'

export interface ControlDefinition {
  id: ControlId
  label: string
  scope: 'row' | 'global'
  // Перечень полей, на которые влияет контроль (массовое применение/привязка)
  targets?: FieldId[]
  description?: string
}

export interface TypeButtonsConfig {
  enableTask: boolean
  enablePreview: boolean
  enableSectors: boolean
  enableBonuses: boolean
  combineSectorsAvailable?: boolean
}

export interface TypeConfig {
  id: string
  name: string
  category: 'olymp' | 'custom'
  totalSectors?: number
  fields: FieldId[]
  controls: ControlId[]
  buttons: TypeButtonsConfig
}


