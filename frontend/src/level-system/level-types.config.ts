/**
 * Единый конфигурационный файл для всех типов уровней
 * Реализация согласно плану рефакторинга (Фаза 3.1)
 * 
 * ✨ ДОБАВЛЕНИЕ НОВОГО ТИПА ЗАЙМЕТ 1-5 МИНУТ!
 */

// TODO: установить Zod или заменить на альтернативную валидацию
// import { z } from 'zod';
import type { LevelTypeConfig, UniversalAnswer } from '../types/level-system'

// ============================================================================
// БАЗОВЫЕ СХЕМЫ ДАННЫХ (из плана)
// ============================================================================

// TODO: После установки Zod - раскомментировать и типизировать схемы
/*
import { UniversalAnswerSchema } from '../components/level-system/core/types/LevelType';

const OlympAnswerSchema = z.array(UniversalAnswerSchema.extend({
  sectorName: z.string().optional(),
  bonusName: z.string().optional()
}));

const Type100500AnswerSchema = z.array(UniversalAnswerSchema.extend({
  targetLevels: z.array(z.string()).optional(),
  delay: z.object({
    hours: z.number().optional(),
    minutes: z.number().optional(),
    seconds: z.number().optional()
  }).optional(),
  relativeLimit: z.object({
    hours: z.number().optional(),
    minutes: z.number().optional(),
    seconds: z.number().optional()
  }).optional()
}));
*/

// ============================================================================
// ДЕКЛАРАТИВНАЯ КОНФИГУРАЦИЯ ВСЕХ ТИПОВ (из плана 3.1)
// ============================================================================

export const levelTypes: LevelTypeConfig[] = [
  // ============================================================================
  // ОЛИМПИЙКИ - одна строка для добавления нового!
  // ============================================================================
  {
    id: 'olymp_15',
    name: 'Олимпийка (15 секторов)',
    description: 'Классическая олимпийка с 15 секторами и бонусами',
    category: 'olymp',
    defaultSectorCount: 15,
    maxSectorCount: 15,
    capabilities: {
      hasTask: true,
      hasSectors: true,
      hasBonuses: true,
      hasDelay: false,
      hasLimits: false,
      hasLevels: false,
      hasTabs: false,
      hasCustomFields: false
    },
    icon: '🏆',
    color: '#4f46e5',
    layout: 'table'
    // TODO: schema: OlympAnswerSchema после установки Zod
  },
  {
    id: 'olymp_31',
    name: 'Олимпийка (31 сектор)',
    description: 'Классическая олимпийка с 31 сектором и бонусами',
    category: 'olymp',
    defaultSectorCount: 31,
    maxSectorCount: 31,
    capabilities: {
      hasTask: true,
      hasSectors: true,
      hasBonuses: true,
      hasDelay: false,
      hasLimits: false,
      hasLevels: false,
      hasTabs: false,
      hasCustomFields: false
    },
    icon: '🏆',
    color: '#4f46e5',
    layout: 'table'
  },
  {
    id: 'olymp_63',
    name: 'Олимпийка (63 сектора)',
    description: 'Классическая олимпийка с 63 секторами и бонусами',
    category: 'olymp',
    defaultSectorCount: 63,
    maxSectorCount: 63,
    capabilities: {
      hasTask: true,
      hasSectors: true,
      hasBonuses: true,
      hasDelay: false,
      hasLimits: false,
      hasLevels: false,
      hasTabs: false,
      hasCustomFields: false
    },
    icon: '🏆',
    color: '#4f46e5',
    layout: 'table'
  },
  {
    id: 'olymp_127',
    name: 'Олимпийка (127 секторов)',
    description: 'Классическая олимпийка с 127 секторами и бонусами',
    category: 'olymp',
    defaultSectorCount: 127,
    maxSectorCount: 127,
    capabilities: {
      hasTask: true,
      hasSectors: true,
      hasBonuses: true,
      hasDelay: false,
      hasLimits: false,
      hasLevels: false,
      hasTabs: false,
      hasCustomFields: false
    },
    icon: '🏆',
    color: '#4f46e5',
    layout: 'table'
  },

  // ============================================================================
  // НОВЫЕ ОЛИМПИЙКИ - добавить за 5 минут!
  // ============================================================================
  
  // 📝 ПРИМЕР: Добавление новой олимпийки займет 1 минуту:
  /*
  {
    id: 'olymp_255',
    name: 'Олимпийка (255 секторов)',
    description: 'Мега-олимпийка с 255 секторами',
    category: 'olymp',
    defaultSectorCount: 255,
    maxSectorCount: 255,
    capabilities: {
      hasTask: true,
      hasSectors: true,
      hasBonuses: true,
      hasDelay: false,
      hasLimits: false,
      hasLevels: false,
      hasTabs: false,
      hasCustomFields: false
    },
    icon: '🏆',
    color: '#4f46e5',
    layout: 'table'
  },
  */

  // ============================================================================
  // TYPE100500 И МАССОВЫЕ ТИПЫ
  // ============================================================================
  {
    id: 'type_100500',
    name: '100500 секторов и бонусов',
    description: 'Массовая загрузка с табами, задержками и ограничениями',
    category: 'complex',
    defaultSectorCount: 100,
    capabilities: {
      hasTask: false,
      hasSectors: true,
      hasBonuses: true,
      hasDelay: true,
      hasLimits: true,
      hasLevels: true,
      hasTabs: true,
      hasCustomFields: false
    },
    icon: '📦',
    color: '#059669',
    layout: 'tabs',
    validation: {
      minVariantsPerSector: 1,
      maxVariantsPerSector: 10,
      requiredFields: ['variants']
    }
    // TODO: schema: Type100500AnswerSchema после установки Zod
  },

  // ============================================================================
  // КАСТОМНЫЕ И ГИБРИДНЫЕ ТИПЫ
  // ============================================================================
  
  // 📝 ПРИМЕР: Гибридный тип (олимпийка + возможности Type100500)
  /*
  {
    id: 'hybrid_olymp',
    name: 'Гибридная олимпийка',
    description: 'Олимпийка с задержками и ограничениями из Type100500',
    category: 'custom',
    defaultSectorCount: 31,
    capabilities: {
      hasTask: true,
      hasSectors: true,
      hasBonuses: true,
      hasDelay: true,      // Из Type100500
      hasLimits: true,     // Из Type100500
      hasLevels: true,     // Из Type100500
      hasTabs: false,      // Сохраняем олимпийскую структуру
      hasCustomFields: false
    },
    icon: '🎯',
    color: '#dc2626',
    layout: 'table',
    customConfig: {
      mixins: ['olymp', 'bulk'],
      allowSectorMode: true,
      enableDelayControls: true,
      enableLimitControls: true
    }
  },
  */

  // 📝 ПРИМЕР: Линейный квест тип
  /*
  {
    id: 'linear_quest',
    name: 'Линейный квест',
    description: 'Пошаговый квест с кастомными полями',
    category: 'custom',
    defaultSectorCount: 10,
    capabilities: {
      hasTask: true,
      hasSectors: true,
      hasBonuses: false,
      hasDelay: false,
      hasLimits: false,
      hasLevels: false,
      hasTabs: false,
      hasCustomFields: true
    },
    icon: '🗺️',
    color: '#7c3aed',
    layout: 'custom',
    validation: {
      requiredFields: ['variants', 'stepOrder'],
      customRules: [
        (data) => {
          // Проверка последовательности шагов
          const hasValidOrder = data.every((answer, index) => 
            answer.customFields?.stepOrder === index + 1
          );
          return {
            valid: hasValidOrder,
            errors: hasValidOrder ? [] : ['Неправильный порядок шагов']
          };
        }
      ]
    },
    customConfig: {
      customFields: {
        stepOrder: { type: 'number', label: 'Порядок шага', required: true },
        stepDescription: { type: 'textarea', label: 'Описание шага', required: false },
        allowSkip: { type: 'boolean', label: 'Разрешить пропуск', required: false }
      }
    }
  }
  */
];

// ============================================================================
// ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В СИСТЕМЕ
// ============================================================================

/**
 * Получение конфигурации типа по ID
 */
export function getLevelTypeConfigById(typeId: string): LevelTypeConfig | null {
  return levelTypes.find(type => type.id === typeId) || null;
}

/**
 * Получение всех типов определенной категории
 */
export function getLevelTypesByCategory(category: 'olymp' | 'complex' | 'custom'): LevelTypeConfig[] {
  return levelTypes.filter(type => type.category === category);
}

/**
 * Получение списка всех доступных типов для UI
 */
export function getAllLevelTypes(): LevelTypeConfig[] {
  return [...levelTypes];
}

/**
 * Добавление нового типа в runtime (для динамического расширения)
 */
export function registerLevelType(config: LevelTypeConfig): void {
  const existingIndex = levelTypes.findIndex(type => type.id === config.id);
  if (existingIndex >= 0) {
    levelTypes[existingIndex] = config; // Обновляем существующий
  } else {
    levelTypes.push(config); // Добавляем новый
  }
}

// ============================================================================
// ИНСТРУКЦИЯ ПО ДОБАВЛЕНИЮ НОВОГО ТИПА
// ============================================================================

/*
🚀 КАК ДОБАВИТЬ НОВЫЙ ТИП УРОВНЯ:

1. ⚡ БЫСТРО (1-5 минут) - для похожего типа:
   - Скопируйте существующий объект конфигурации
   - Измените id, name, description
   - Настройте capabilities под нужды
   - Готово! Тип автоматически появится в UI

2. 🛠️ СРЕДНЕ (15-30 минут) - для нового функционала:
   - Добавьте новый объект конфигурации
   - Создайте кастомный layout компонент (если нужен)
   - Настройте validation rules
   - Добавьте customConfig для специфичных полей

3. 🧠 СЛОЖНО (1-2 часа) - для совершенно нового типа:
   - Создайте новую схему валидации (TODO: с Zod)
   - Разработайте новый layout компонент
   - Добавьте кастомные миксины (если нужны)
   - Протестируйте интеграцию

✨ РЕЗУЛЬТАТ: Новый тип автоматически появится в:
- Селекторе типов в настройках
- Роутинге (через dynamic-loader.ts)  
- Системе валидации
- Унифицированном API
*/

