/**
 * LevelTypeRegistry - система регистрации и управления типами уровней
 * Реализация согласно плану рефакторинга (Фаза 3.2)
 */

import type { LevelTypeConfig } from '../types/level-system'
import { levelTypes, getLevelTypeConfigById } from '../level-system/level-types.config'

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface RegisteredLevelType extends LevelTypeConfig {
  // Динамически загружаемый компонент
  component: () => Promise<any>
  
  // Метаданные регистрации
  registered: Date
  version?: string
  author?: string
}

// ============================================================================
// REGISTRY CLASS (из плана)
// ============================================================================

export class LevelTypeRegistry {
  private types = new Map<string, RegisteredLevelType>()
  private initialized = false

  constructor() {
    this.registerTypesFromConfig()
  }

  // ============================================================================
  // ИНИЦИАЛИЗАЦИЯ ИЗ КОНФИГУРАЦИИ (из плана 3.2)
  // ============================================================================

  private registerTypesFromConfig() {
    console.log('🚀 Регистрация типов уровней из конфигурации...')
    
    levelTypes.forEach(config => {
      try {
        const registeredType: RegisteredLevelType = {
          ...config,
          // Динамический импорт компонента-шаблона (из плана)
          component: this.createComponentLoader(config),
          registered: new Date(),
          version: '1.0.0'
        }
        
        this.types.set(config.id, registeredType)
        console.log(`✅ Зарегистрирован тип: ${config.id} (${config.name})`)
        
      } catch (error) {
        console.error(`❌ Ошибка регистрации типа ${config.id}:`, error)
      }
    })
    
    this.initialized = true
    console.log(`🎉 Регистрация завершена. Всего типов: ${this.types.size}`)
  }

  // ============================================================================
  // ДИНАМИЧЕСКАЯ ЗАГРУЗКА КОМПОНЕНТОВ (из плана)
  // ============================================================================

  private createComponentLoader(config: LevelTypeConfig): () => Promise<any> {
    return async () => {
      try {
        // Определяем путь к компоненту на основе категории и layout
        let componentPath: string

        switch (config.category) {
          case 'olymp':
            // Все олимпийки используют универсальный OlympTemplate
            componentPath = '../components/level-system/templates/OlympTemplate.vue'
            break
            
          case 'complex':
            if (config.id === 'type_100500') {
              componentPath = '../components/level-system/templates/BulkTemplate.vue'
            } else {
              // Другие сложные типы
              componentPath = `../components/level-types/${config.category}/${config.id}.vue`
            }
            break
            
          case 'custom':
            // Кастомные типы
            componentPath = `../components/level-types/custom/${config.id}.vue`
            break
            
          default:
            // Fallback - попытка загрузить по ID
            componentPath = `../components/level-types/${config.id}.vue`
        }

        console.log(`📦 Загружаем компонент для ${config.id}: ${componentPath}`)
        
        // Динамический импорт
        const module = await import(componentPath)
        
        // Для олимпиек передаем количество секторов как props
        if (config.category === 'olymp') {
          return {
            ...module.default,
            props: { 
              sectors: config.defaultSectorCount,
              config: config
            }
          }
        }
        
        return module.default
        
      } catch (error) {
        console.error(`❌ Не удалось загрузить компонент для ${config.id}:`, error)
        
        // Fallback - загружаем компонент ошибки
        return import('../components/shared/ErrorComponent.vue')
      }
    }
  }

  // ============================================================================
  // ПУБЛИЧНОЕ API (из плана)
  // ============================================================================

  /**
   * Получение типа по ID
   */
  getType(id: string): RegisteredLevelType | null {
    if (!this.initialized) {
      console.warn('⚠️ Registry не инициализирован')
      return null
    }
    
    return this.types.get(id) || null
  }

  /**
   * Получение всех зарегистрированных типов
   */
  listAllTypes(): RegisteredLevelType[] {
    return Array.from(this.types.values())
  }

  /**
   * Получение типов по категории
   */
  getTypesByCategory(category: 'olymp' | 'complex' | 'custom'): RegisteredLevelType[] {
    return this.listAllTypes().filter(type => type.category === category)
  }

  /**
   * Проверка существования типа
   */
  hasType(id: string): boolean {
    return this.types.has(id)
  }

  /**
   * Получение количества зарегистрированных типов
   */
  getTypesCount(): number {
    return this.types.size
  }

  // ============================================================================
  // ДИНАМИЧЕСКАЯ РЕГИСТРАЦИЯ (из плана)
  // ============================================================================

  /**
   * Регистрация нового типа в runtime
   */
  registerType(config: LevelTypeConfig, component?: () => Promise<any>): boolean {
    try {
      if (this.types.has(config.id)) {
        console.warn(`⚠️ Тип ${config.id} уже зарегистрирован. Перезаписываем.`)
      }

      const registeredType: RegisteredLevelType = {
        ...config,
        component: component || this.createComponentLoader(config),
        registered: new Date(),
        version: '1.0.0'
      }

      this.types.set(config.id, registeredType)
      console.log(`✅ Динамически зарегистрирован тип: ${config.id}`)
      
      return true
    } catch (error) {
      console.error(`❌ Ошибка динамической регистрации ${config.id}:`, error)
      return false
    }
  }

  /**
   * Удаление типа из registry
   */
  unregisterType(id: string): boolean {
    if (this.types.delete(id)) {
      console.log(`🗑️ Удален тип: ${id}`)
      return true
    }
    
    console.warn(`⚠️ Тип ${id} не найден для удаления`)
    return false
  }

  // ============================================================================
  // СТАТИСТИКА И ОТЛАДКА
  // ============================================================================

  /**
   * Получение статистики registry
   */
  getStatistics() {
    const types = this.listAllTypes()
    
    return {
      total: types.length,
      olymp: types.filter(t => t.category === 'olymp').length,
      complex: types.filter(t => t.category === 'complex').length,
      custom: types.filter(t => t.category === 'custom').length,
      
      // Статистика по возможностям
      withTask: types.filter(t => t.capabilities.hasTask).length,
      withBonuses: types.filter(t => t.capabilities.hasBonuses).length,
      withTabs: types.filter(t => t.capabilities.hasTabs).length,
      withCustomFields: types.filter(t => t.capabilities.hasCustomFields).length,
      
      lastRegistered: Math.max(...types.map(t => t.registered.getTime()))
    }
  }

  /**
   * Вывод информации в консоль для отладки
   */
  printDebugInfo() {
    console.group('🎯 LevelTypeRegistry Debug Info')
    
    const stats = this.getStatistics()
    console.log('📊 Статистика:', stats)
    
    console.log('\n📋 Зарегистрированные типы:')
    this.types.forEach((type, id) => {
      console.log(`  ${id}: ${type.name} (${type.category})`)
    })
    
    console.groupEnd()
  }

  // ============================================================================
  // ВАЛИДАЦИЯ ТИПОВ
  // ============================================================================

  /**
   * Валидация конфигурации типа
   */
  validateTypeConfig(config: LevelTypeConfig): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // Базовые проверки
    if (!config.id || config.id.trim() === '') {
      errors.push('ID типа обязателен')
    }
    
    if (!config.name || config.name.trim() === '') {
      errors.push('Название типа обязательно')
    }
    
    if (!['olymp', 'complex', 'custom'].includes(config.category)) {
      errors.push('Некорректная категория типа')
    }
    
    if (typeof config.defaultSectorCount !== 'number' || config.defaultSectorCount < 1) {
      errors.push('defaultSectorCount должен быть положительным числом')
    }
    
    if (!config.capabilities) {
      errors.push('Объект capabilities обязателен')
    }
    
    if (!['table', 'tabs', 'custom'].includes(config.layout)) {
      errors.push('Некорректный тип layout')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Глобальный экземпляр registry
 */
export const levelTypeRegistry = new LevelTypeRegistry()

// Экспорт для использования в компонентах Vue
export function useLevelTypeRegistry() {
  return levelTypeRegistry
}

// ============================================================================
// ИНТЕГРАЦИЯ С РОУТЕРОМ (для dynamic-loader.ts)
// ============================================================================

/**
 * Получение загрузчика компонента для роутера
 */
export function getTypeComponentLoader(typeId: string): (() => Promise<any>) | null {
  const type = levelTypeRegistry.getType(typeId)
  return type ? type.component : null
}

// ============================================================================
// АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ В DEVELOPMENT
// ============================================================================

if (import.meta.env.DEV) {
  // Выводим информацию о registry в development режиме
  setTimeout(() => {
    levelTypeRegistry.printDebugInfo()
  }, 1000)
}

