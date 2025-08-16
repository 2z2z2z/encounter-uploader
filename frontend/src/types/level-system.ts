/**
 * Универсальная система типов для всех уровней Encounter
 * Поддерживает олимпийки, Type100500 и будущие 20+ типов
 */

// ============================================================================
// БАЗОВЫЕ ТИПЫ ДАННЫХ
// ============================================================================

/**
 * Универсальный ответ - единая структура для всех типов уровней
 */
export interface UniversalAnswer {
  id: string | number              // Уникальный ID ответа в рамках уровня
  variants: string[]               // Варианты ответов ["ОТВЕТ1", "ОТВЕТ2"]
  sectorName?: string              // Название сектора (опционально)
  
  // Логические флаги
  inSector?: boolean               // Используется как сектор
  inBonus?: boolean                // Используется как бонус
  
  // Для бонусов
  bonusName?: string               // Название бонуса
  bonusTask?: string               // HTML задания бонуса
  bonusHint?: string               // HTML подсказки бонуса
  bonusTime?: BonusTime            // Время бонуса
  bonusDelay?: BonusTime           // Задержка (Type100500)
  bonusLimit?: BonusTime           // Ограничение времени (Type100500)
  bonusLevels?: BonusLevelConfig   // На каких уровнях доступен
  
  // Метаданные
  type: 'sector' | 'bonus'         // Тип ответа
  metadata?: Record<string, any>   // Дополнительные данные для специфичных типов
}

/**
 * Конфигурация времени бонуса
 */
export interface BonusTime {
  hours: number
  minutes: number  
  seconds: number
  negative?: boolean               // Отрицательное время (штраф)
}

/**
 * Конфигурация уровней для бонуса
 */
export interface BonusLevelConfig {
  allLevels: boolean              // true = на всех уровнях, false = на указанных
  specificLevels?: number[]       // Номера уровней [1, 2, 3] когда allLevels=false
  levelCheckboxNames?: string[]   // Имена чекбоксов для API ['level_1', 'level_2']
}

// ============================================================================
// КОНФИГУРАЦИЯ ТИПОВ УРОВНЕЙ
// ============================================================================

/**
 * Способности (capabilities) типа уровня
 * Определяют какой функционал поддерживает конкретный тип
 */
export interface LevelCapabilities {
  // Основные возможности
  hasSectors: boolean             // Поддерживает секторы
  hasBonuses: boolean             // Поддерживает бонусы
  hasTask: boolean                // Поддерживает задание уровня
  
  // Функционал секторов
  supportsSectorNames: boolean    // Можно задавать названия секторов
  supportsMultipleVariants: boolean // Несколько вариантов ответов на сектор
  
  // Функционал бонусов
  supportsBonusTask: boolean      // Задания для бонусов (HTML)
  supportsBonusHints: boolean     // Подсказки для бонусов
  supportsBonusDelay: boolean     // Задержка появления бонуса (Type100500)
  supportsBonusLimits: boolean    // Ограничение времени действия (Type100500)
  supportsBonusLevels: boolean    // Выбор уровней доступности
  supportsNegativeTime: boolean   // Отрицательное время (штрафы)
  
  // UI возможности
  supportsTabs: boolean           // Табы/блоки (Type100500)
  supportsCodeGeneration: boolean // Генерация кодов (Type100500)
  supportsImportExport: boolean   // Импорт/экспорт данных
  supportsBulkOperations: boolean // Массовые операции (очистка, добавление строк)
  
  // Будущие возможности
  customFields?: Record<string, any> // Кастомные поля для специфичных типов
}

/**
 * Конфигурация типа уровня
 */
export interface LevelTypeConfig {
  id: string                      // Уникальный ID типа
  name: string                    // Отображаемое название
  description?: string            // Описание типа
  category: 'olymp' | 'complex' | 'custom' // Категория типа
  
  // Характеристики
  defaultSectorCount: number      // Количество секторов по умолчанию
  maxSectorCount?: number         // Максимальное количество (null = без ограничений)
  capabilities: LevelCapabilities // Поддерживаемый функционал
  
  // UI конфигурация
  icon?: string                   // Иконка для UI
  color?: string                  // Цвет темы
  layout: 'table' | 'tabs' | 'custom' // Тип макета
  
  // Валидация и ограничения
  validation?: {
    minVariantsPerSector?: number
    maxVariantsPerSector?: number
    requiredFields?: string[]
    customRules?: ((data: UniversalAnswer[]) => ValidationResult)[]
  }
  
  // Специфичные настройки
  customConfig?: Record<string, any>
}

// ============================================================================
// ПРЕДОПРЕДЕЛЕННЫЕ КОНФИГУРАЦИИ
// ============================================================================

/**
 * Базовая конфигурация для олимпиек
 */
export const createOlympConfig = (sectorCount: number): LevelTypeConfig => ({
  id: `olymp_${sectorCount}`,
  name: `Олимпийка (${sectorCount} секторов)`,
  description: `Классическая олимпийка с ${sectorCount} секторами`,
  category: 'olymp',
  defaultSectorCount: sectorCount,
  maxSectorCount: sectorCount,
  capabilities: {
    hasSectors: true,
    hasBonuses: true,
    hasTask: true,
    supportsSectorNames: false,        // Олимпийки обычно без названий секторов
    supportsMultipleVariants: true,
    supportsBonusTask: false,          // Простые бонусы без заданий
    supportsBonusHints: false,
    supportsBonusDelay: false,
    supportsBonusLimits: false,
    supportsBonusLevels: true,
    supportsNegativeTime: true,
    supportsTabs: false,
    supportsCodeGeneration: false,
    supportsImportExport: true,
    supportsBulkOperations: true
  },
  layout: 'table'
})

/**
 * Конфигурация для Type100500
 */
export const TYPE_100500_CONFIG: LevelTypeConfig = {
  id: 'type_100500',
  name: '100500 секторов и бонусов',
  description: 'Сложный тип с табами, задержками и дополнительным функционалом',
  category: 'complex',
  defaultSectorCount: 0,             // Динамическое количество
  capabilities: {
    hasSectors: true,
    hasBonuses: true,
    hasTask: true,
    supportsSectorNames: true,
    supportsMultipleVariants: true,
    supportsBonusTask: true,           // Полный функционал бонусов
    supportsBonusHints: true,
    supportsBonusDelay: true,          // Задержка появления
    supportsBonusLimits: true,         // Ограничение времени
    supportsBonusLevels: true,
    supportsNegativeTime: true,
    supportsTabs: true,                // Табы/блоки
    supportsCodeGeneration: true,      // Генерация кодов
    supportsImportExport: true,
    supportsBulkOperations: true
  },
  layout: 'tabs',
  customConfig: {
    defaultTabName: 'Блок',
    codeGenerationSettings: {
      minLength: 4,
      maxLength: 4,
      useNumbers: true,
      useLetters: false
    }
  }
}

// ============================================================================
// РЕЕСТР ВСЕХ ТИПОВ
// ============================================================================

/**
 * Реестр всех поддерживаемых типов уровней
 * Здесь регистрируются все типы для легкого добавления новых
 */
export const LEVEL_TYPES_REGISTRY: Record<string, LevelTypeConfig> = {
  // Олимпийки
  'olymp_15': createOlympConfig(15),
  'olymp_31': createOlympConfig(31),
  'olymp_63': createOlympConfig(63),
  'olymp_127': createOlympConfig(127),
  
  // Сложные типы
  'type_100500': TYPE_100500_CONFIG,
  
  // Место для новых типов - добавляется за 1-15 минут!
  // 'custom_quest': createCustomQuestConfig(),
  // 'linear_type': createLinearTypeConfig(),
  // 'tree_structure': createTreeStructureConfig(),
}

/**
 * Получение конфигурации типа по ID
 */
export function getLevelTypeConfig(typeId: string): LevelTypeConfig | null {
  return LEVEL_TYPES_REGISTRY[typeId] || null
}

/**
 * Получение всех доступных типов
 */
export function getAllLevelTypes(): LevelTypeConfig[] {
  return Object.values(LEVEL_TYPES_REGISTRY)
}

/**
 * Получение типов по категории
 */
export function getLevelTypesByCategory(category: LevelTypeConfig['category']): LevelTypeConfig[] {
  return getAllLevelTypes().filter(type => type.category === category)
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// ============================================================================

/**
 * Результат валидации (переиспользуем из validator.ts)
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Состояние уровня в универсальном формате
 */
export interface LevelState {
  typeId: string                    // ID типа уровня
  config: LevelTypeConfig          // Конфигурация типа
  answers: UniversalAnswer[]       // Данные (секторы + бонусы)
  task?: string                    // HTML задания уровня
  metadata?: Record<string, any>   // Дополнительные данные
  
  // Служебные поля
  lastModified: Date
  version: string                  // Версия формата данных
}
