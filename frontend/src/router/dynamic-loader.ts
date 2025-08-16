/**
 * Динамическая загрузка компонентов типов уровней
 * Реализация согласно плану рефакторинга (Фаза 5.1)
 */

import type { Component } from 'vue'

// ============================================================================
// ДЕКЛАРАТИВНАЯ КАРТА КОМПОНЕНТОВ ЧЕРЕЗ import.meta.glob (из плана)
// ============================================================================

// Загружаем все компоненты типов уровней (исправлена ошибка Vite glob)
const levelTypeComponents = import.meta.glob<{ default: Component }>([
  '../components/level-types/**/*.vue',
  '../components/level-system/templates/*.vue'
], { eager: false })

// Загружаем тестовые компоненты
const testComponents = import.meta.glob<{ default: Component }>([
  '../components/Test*.vue'
], { eager: false })

// ============================================================================
// КАРТА ТИПОВ И ИХ КОМПОНЕНТОВ
// ============================================================================

interface TypeComponentMap {
  [key: string]: () => Promise<Component>
}

// Основные типы уровней
export const typeComponentsMap: TypeComponentMap = {
  // Олимпийки - используют OlympTemplate с разными параметрами
  'olymp_15': () => import('../components/level-system/templates/OlympTemplate.vue'),
  'olymp_31': () => import('../components/level-system/templates/OlympTemplate.vue'),
  'olymp_63': () => import('../components/level-system/templates/OlympTemplate.vue'),
  'olymp_127': () => import('../components/level-system/templates/OlympTemplate.vue'),
  
  // Type100500
  'type_100500': () => import('../components/level-system/templates/BulkTemplate.vue'),
  
  // Гибридные типы
  'hybrid_olymp': () => import('../components/level-types/custom/HybridLevel.vue'),
  'linear_level': () => import('../components/level-types/custom/LinearLevel.vue'),
  
  // Legacy компоненты (для обратной совместимости)
  'Olymp15': () => import('../components/types/Olymp15/index.vue'),
  'Olymp31': () => import('../components/types/Olymp31/index.vue'),
  'Olymp63': () => import('../components/types/Olymp63/index.vue'),
  'Olymp127': () => import('../components/types/Olymp127/index.vue'),
  'Type100500': () => import('../components/types/Type100500/index.vue')
}

// Тестовые компоненты
export const testComponentsMap: TypeComponentMap = {
  'test-editor': () => import('../components/TestSimpleEditor.vue'),
  'test-olymp': () => import('../components/TestUniversalOlymp.vue'),
  'test-type100500': () => import('../components/TestUniversalType100500.vue'),
  'test-configurable': () => import('../components/TestConfigurableArchitecture.vue'),
  'test-api': () => import('../components/TestOptimizedAPI.vue')
}

// ============================================================================
// ФУНКЦИИ ЗАГРУЗКИ
// ============================================================================

/**
 * Динамическая загрузка компонента по типу (из плана)
 */
export function loadTypeComponent(type: string): () => Promise<Component> {
  // Сначала ищем в основных типах
  if (typeComponentsMap[type]) {
    return typeComponentsMap[type]
  }
  
  // Затем в тестовых
  if (testComponentsMap[type]) {
    return testComponentsMap[type]
  }
  
  // Пытаемся загрузить по пути (fallback)
  const possiblePaths = [
    `../components/level-types/${type}/index.vue`,
    `../components/level-types/olymp/${type}.vue`,
    `../components/level-types/bulk/${type}.vue`,
    `../components/level-types/custom/${type}.vue`,
    `../components/types/${type}/index.vue`
  ]
  
  for (const path of possiblePaths) {
    if (levelTypeComponents[path]) {
      return levelTypeComponents[path] as () => Promise<{ default: Component }>
    }
  }
  
  // Если ничего не найдено, возвращаем компонент ошибки
  return () => import('../components/shared/ErrorComponent.vue')
}

/**
 * Предзагрузка компонентов для оптимизации (из плана)
 */
export async function preloadComponents(types: string[]): Promise<void> {
  const loadPromises = types
    .filter(type => typeComponentsMap[type])
    .map(type => typeComponentsMap[type]())
  
  try {
    await Promise.all(loadPromises)
    console.log(`✅ Предзагружено ${loadPromises.length} компонентов типов`)
  } catch (error) {
    console.warn('⚠️ Ошибка предзагрузки компонентов:', error)
  }
}

/**
 * Получение списка всех доступных типов
 */
export function getAvailableTypes(): string[] {
  return Object.keys(typeComponentsMap)
}

/**
 * Проверка доступности типа
 */
export function isTypeAvailable(type: string): boolean {
  return type in typeComponentsMap
}

/**
 * Получение информации о загрузке
 */
export function getLoadingStats() {
  const totalComponents = Object.keys(levelTypeComponents).length
  const mappedTypes = Object.keys(typeComponentsMap).length
  
  return {
    totalComponents,
    mappedTypes,
    testComponents: Object.keys(testComponentsMap).length,
    coveragePercent: Math.round((mappedTypes / totalComponents) * 100)
  }
}

// ============================================================================
// УТИЛИТЫ ДЛЯ ROUTER
// ============================================================================

/**
 * Создание route definition с lazy loading (из плана)
 */
export function createTypeRoute(path: string, type: string) {
  return {
    path,
    name: `type-${type}`,
    component: loadTypeComponent(type),
    props: true,
    meta: {
      title: `Тип ${type}`,
      type,
      requiresAuth: true
    }
  }
}

/**
 * Создание маршрутов для всех типов
 */
export function createAllTypeRoutes() {
  return getAvailableTypes().map(type => 
    createTypeRoute(`/upload/${type}`, type)
  )
}

/**
 * Создание динамического маршрута (из плана)
 */
export function createDynamicTypeRoute() {
  return {
    path: '/upload/:type',
    name: 'dynamic-type',
    component: (to: any) => loadTypeComponent(to.params.type)(),
    props: true,
    meta: {
      title: 'Динамический тип',
      requiresAuth: true
    }
  }
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
  loadTypeComponent,
  preloadComponents,
  getAvailableTypes,
  isTypeAvailable,
  getLoadingStats,
  createTypeRoute,
  createAllTypeRoutes,
  createDynamicTypeRoute
}
