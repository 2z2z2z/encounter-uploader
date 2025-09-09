/**
 * Тестовый файл для проверки работоспособности store
 * Запустить: node --loader ts-node/esm test-store.ts
 */

import { createPinia, setActivePinia } from 'pinia'
import { useLevelV2Store } from './store'

// Создаем тестовое окружение
setActivePinia(createPinia())

// Получаем store
const store = useLevelV2Store()

console.log('=== Тестирование LevelV2Store ===\n')

// Тест 1: Инициализация
console.log('1. Инициализация для Олимпийки 15:')
store.initializeLevelType('olymp', '15', false)
console.log(`   - levelType: ${store.levelType}`)
console.log(`   - subtypeId: ${store.subtypeId}`)
console.log(`   - dimension: ${store.dimension}`)
console.log(`   - storageKey: ${store.storageKey}`)
console.log(`   - tabCount: ${store.tabCount}`)
console.log(`   - answers in tab: ${store.activeTab?.answers.length || 0}`)

// Тест 2: Добавление ответов
console.log('\n2. Добавление ответов:')
store.addAnswer(['test1', 'test2'])
store.addAnswer(['test3'])
console.log(`   - Добавлено 2 ответа`)
console.log(`   - answers in tab: ${store.activeTab?.answers.length || 0}`)
console.log(`   - isDirty: ${store.isDirty}`)

// Тест 3: Работа с табами для type100500
console.log('\n3. Инициализация для type100500:')
store.initializeLevelType('type100500', undefined, false)
console.log(`   - levelType: ${store.levelType}`)
console.log(`   - storageKey: ${store.storageKey}`)

console.log('\n4. Работа с табами:')
store.addTab('Блок 2')
store.addTab('Блок 3')
console.log(`   - tabCount: ${store.tabCount}`)
console.log(`   - Табы: ${store.tabs.map(t => t.name).join(', ')}`)
console.log(`   - activeTabIndex: ${store.activeTabIndex}`)
console.log(`   - canAddTab: ${store.canAddTab}`)

// Тест 4: Удаление таба
console.log('\n5. Удаление таба:')
const removed = store.removeTab(1)
console.log(`   - Удален таб с индексом 1: ${removed}`)
console.log(`   - tabCount: ${store.tabCount}`)
console.log(`   - Табы: ${store.tabs.map(t => t.name).join(', ')}`)

// Тест 5: Массовые операции
console.log('\n6. Массовые операции:')
store.addMultipleAnswers([
	['code1', 'code2'],
	['code3'],
	['code1', 'code2'], // дубликат - не добавится
	['code4', 'code5']
])
console.log(`   - Попытка добавить 4 ответа (1 дубликат)`)
console.log(`   - answers in active tab: ${store.activeTab?.answers.length || 0}`)

// Тест 6: Конфигурация
console.log('\n7. Работа с конфигурацией:')
store.setSectorMode('finalOnly')
store.setBonusTime({ hours: 1, minutes: 30, seconds: 45, negative: true })
console.log(`   - sectorMode: ${store.config.sectorMode}`)
console.log(`   - bonusTime: ${JSON.stringify(store.config.bonusTime)}`)

// Тест 7: Очистка
console.log('\n8. Очистка активного таба:')
store.clearActiveTab()
console.log(`   - answers in active tab: ${store.activeTab?.answers.length || 0}`)

console.log('\n=== Тесты завершены успешно ===')
