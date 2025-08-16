/**
 * Система типов уровней - реализация согласно плану рефакторинга
 * Фаза 1.5: Универсальный интерфейс LevelType
 */

// Альтернативная валидация вместо Zod
import { z, UniversalAnswerSchema, type ValidationResult } from '../../../../utils/validation'

// ============================================================================
// БАЗОВЫЕ ТИПЫ (из плана)
// ============================================================================

export interface LevelCapability {
  type: 'task' | 'sectors' | 'bonuses' | 'levels' | 'delay' | 'limit' | 'custom'
  required: boolean
  config?: any
}

export interface LevelConfig {
  [key: string]: any
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

export interface UploadResult {
  success: boolean
  data?: any
  error?: string
  metrics?: {
    duration: number
    elementsCount: number
    dataSize: number
  }
}

// ============================================================================
// УНИВЕРСАЛЬНАЯ СХЕМА ДАННЫХ (из плана 1.5)
// ============================================================================

// TODO: Реализовать схему валидации без Zod или установить Zod
export interface UniversalAnswer {
  id: string | number;
  variants: string[];
  inSector?: boolean;
  inBonus?: boolean;
  sectorName?: string;
  bonusName?: string;
  bonusTime?: {
    hours: number;
    minutes: number;
    seconds: number;
    negative?: boolean;
  };
  delay?: {
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  relativeLimit?: {
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  targetLevels?: string[];
  allLevels?: boolean;
  customFields?: Record<string, any>;
  
  // Поля, не участвующие в отправке, а только для UI
  closedText?: string;
  displayText?: string;
  bonusTask?: string;
  bonusHint?: string;
}

// ============================================================================
// ОПРЕДЕЛЕНИЕ ТИПА УРОВНЯ (из плана 1.5)
// ============================================================================

export interface LevelTypeDefinition {
  name: string
  label: string
  category: 'olymp' | 'bulk' | 'custom'
  capabilities: LevelCapability[]
  defaultConfig: LevelConfig
  validator: (data: any) => ValidationResult
  uploader: (data: any) => Promise<UploadResult>
  schema: any // Декларативная схема данных для этого типа (TODO: типизировать после установки Zod)
  
  // Компоненты для рендеринга (добавлено для системы)
  tableComponent?: string
  controlsComponent?: string
}

// ============================================================================
// ИНТЕРФЕЙСЫ ДЛЯ МИКСИНОВ (новое)
// ============================================================================

export interface MixinDefinition {
  name: string
  capabilities: LevelCapability[]
  components: Record<string, () => Promise<any>>
  methods: Record<string, Function>
  computedProperties?: Record<string, () => any>
}

export interface TemplateConfig {
  name: string
  label: string
  category: 'olymp' | 'bulk' | 'custom'
  useMixins: string[]
  props?: Record<string, any>
  extraCapabilities?: LevelCapability[]
  customFields?: Record<string, CustomFieldDefinition>
}

export interface CustomFieldDefinition {
  type: 'text' | 'number' | 'boolean' | 'textarea' | 'select'
  label?: string
  default?: any
  options?: string[] // для select
  validation?: z.ZodType
}

// ============================================================================
// СОСТОЯНИЕ УРОВНЯ
// ============================================================================

export interface LevelState {
  type: string
  config: LevelConfig
  data: UniversalAnswer[]
  task?: string
  metadata?: Record<string, any>
  lastModified: Date
  version: string
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ТИПОВ
// ============================================================================

// Все типы экспортируются автоматически через TypeScript
