/**
 * BulkMixin - миксин функций Type100500
 * Реализация согласно плану рефакторинга (Фаза 1.2)
 */

import type { MixinDefinition, LevelCapability, UniversalAnswer } from '../types/LevelType'

// Типы для Type100500
interface Tab {
  id: string
  name: string
  rows: UniversalAnswer[]
  quickTime: {
    hours: number
    minutes: number
    seconds: number
  }
  sectorPattern: string
  bonusPattern: string
}

export function useBulkMixin(): MixinDefinition {
  return {
    name: 'bulk',
    
    // Capabilities Type100500 (из плана)
    capabilities: [
      { type: 'sectors', required: false },
      { type: 'bonuses', required: false },
      { type: 'delay', required: false },
      { type: 'limit', required: false },
      { type: 'levels', required: false }
    ] as LevelCapability[],
    
    // UI компоненты Type100500 (из плана) - TODO: создать недостающие компоненты
    components: {
      // TabsManager: () => import('../../../shared/forms/TabsManager.vue'), // TODO: создать
      // DelayControls: () => import('../../../shared/forms/DelayControls.vue'), // TODO: создать
      // LimitControls: () => import('../../../shared/forms/LimitControls.vue'), // TODO: создать
      LevelSelector: () => import('../../../shared/forms/LevelSelector.vue'), // ✅ существует
      // BulkTable: () => import('../../../shared/tables/BulkTable.vue') // TODO: создать
    },
    
    // Логика Type100500 (из плана)
    methods: {
      // Создание нового таба (из плана)
      createTab: (name?: string): Tab => ({
        id: `tab_${Date.now()}`,
        name: name || 'Блок',
        rows: [],
        quickTime: { hours: 0, minutes: 0, seconds: 0 },
        sectorPattern: '',
        bonusPattern: ''
      }),
      
      // Добавление строки в таб (из плана)
      addRow: (tab: Tab): UniversalAnswer => {
        const newRow: UniversalAnswer = {
          id: tab.rows.length + 1,
          variants: [''],
          inSector: false,
          inBonus: false,
          bonusTime: { hours: 0, minutes: 0, seconds: 0 },
          delay: { hours: 0, minutes: 0, seconds: 0 },
          relativeLimit: { hours: 0, minutes: 0, seconds: 0 },
          allLevels: true,
          targetLevels: []
        }
        
        tab.rows.push(newRow)
        return newRow
      },
      
      // Удаление строки из таба (из плана)
      removeRow: (tab: Tab, index: number) => {
        if (index >= 0 && index < tab.rows.length) {
          tab.rows.splice(index, 1)
          // Пересчитываем ID
          tab.rows.forEach((row, i) => {
            row.id = i + 1
          })
        }
      },
      
      // Генерация кодов (из существующей логики Type100500)
      generateCodes: (count: number, length: number = 4, useLetters: boolean = false, useNumbers: boolean = true): string[] => {
        const codes: string[] = []
        const chars = []
        
        if (useNumbers) chars.push(...'0123456789'.split(''))
        if (useLetters) chars.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
        
        if (chars.length === 0) return codes
        
        for (let i = 0; i < count; i++) {
          let code = ''
          for (let j = 0; j < length; j++) {
            code += chars[Math.floor(Math.random() * chars.length)]
          }
          codes.push(code)
        }
        
        return codes
      },
      
      // Применение кодов к строкам
      applyCodesToRows: (rows: UniversalAnswer[], codes: string[]) => {
        rows.forEach((row, index) => {
          if (index < codes.length) {
            row.variants = [codes[index]]
          }
        })
      },
      
      // Применение паттерна к именам секторов/бонусов
      applyPatternToNames: (rows: UniversalAnswer[], pattern: string, type: 'sector' | 'bonus') => {
        rows.forEach((row, index) => {
          const name = pattern.replace('&', (index + 1).toString())
          
          if (type === 'sector') {
            row.sectorName = name
          } else {
            row.bonusName = name
          }
        })
      },
      
      // Массовое применение времени бонуса
      applyBulkBonusTime: (rows: UniversalAnswer[], time: { hours: number, minutes: number, seconds: number, negative?: boolean }) => {
        rows.filter(row => row.inBonus).forEach(row => {
          row.bonusTime = { ...time }
        })
      },
      
      // Массовое применение задержки
      applyBulkDelay: (rows: UniversalAnswer[], delay: { hours: number, minutes: number, seconds: number }) => {
        rows.forEach(row => {
          row.delay = { ...delay }
        })
      },
      
      // Массовое применение ограничения времени
      applyBulkLimit: (rows: UniversalAnswer[], limit: { hours: number, minutes: number, seconds: number }) => {
        rows.forEach(row => {
          row.relativeLimit = { ...limit }
        })
      },
      
      // Очистка всех данных
      clearAllData: (tabs: Tab[]) => {
        tabs.forEach(tab => {
          tab.rows = []
          tab.sectorPattern = ''
          tab.bonusPattern = ''
          tab.quickTime = { hours: 0, minutes: 0, seconds: 0 }
        })
      },
      
      // Экспорт данных Type100500
      exportData: (tabs: Tab[]) => {
        return {
          version: '2.0',
          type: 'type100500',
          exportDate: new Date().toISOString(),
          data: tabs.map(tab => ({
            name: tab.name,
            settings: {
              quickTime: tab.quickTime,
              sectorPattern: tab.sectorPattern,
              bonusPattern: tab.bonusPattern
            },
            answers: tab.rows
          }))
        }
      },
      
      // Импорт данных Type100500
      importData: (jsonData: any, tabs: Tab[]) => {
        try {
          const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
          
          if (data.type !== 'type100500') {
            throw new Error('Неверный тип данных для импорта')
          }
          
          tabs.length = 0 // Очищаем существующие табы
          
          data.data.forEach((tabData: any, index: number) => {
            const tab: Tab = {
              id: `imported_tab_${index}`,
              name: tabData.name || `Блок ${index + 1}`,
              rows: tabData.answers || [],
              quickTime: tabData.settings?.quickTime || { hours: 0, minutes: 0, seconds: 0 },
              sectorPattern: tabData.settings?.sectorPattern || '',
              bonusPattern: tabData.settings?.bonusPattern || ''
            }
            tabs.push(tab)
          })
          
          return { success: true, message: `Импортировано ${tabs.length} блоков` }
        } catch (error) {
          return { 
            success: false, 
            message: `Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
          }
        }
      },
      
      // Валидация данных Type100500
      validateBulkData: (tabs: Tab[]) => {
        const errors: string[] = []
        const warnings: string[] = []
        
        if (tabs.length === 0) {
          errors.push('Необходимо создать хотя бы один блок')
          return { valid: false, errors, warnings }
        }
        
        tabs.forEach((tab, tabIndex) => {
          if (!tab.name.trim()) {
            warnings.push(`Блок ${tabIndex + 1} не имеет названия`)
          }
          
          const activeRows = tab.rows.filter(row => 
            row.inSector || row.inBonus || row.variants.some(v => v.trim())
          )
          
          if (activeRows.length === 0) {
            warnings.push(`Блок "${tab.name}" не содержит активных строк`)
          }
          
          // Проверяем корректность времени бонусов
          activeRows.filter(row => row.inBonus).forEach(row => {
            if (!row.bonusTime || (row.bonusTime.hours === 0 && row.bonusTime.minutes === 0 && row.bonusTime.seconds === 0)) {
              warnings.push(`Строка ${row.id} в блоке "${tab.name}" имеет бонус без времени`)
            }
          })
        })
        
        return {
          valid: errors.length === 0,
          errors,
          warnings
        }
      }
    },
    
    // Computed properties для Type100500
    computedProperties: {
      totalRowsCount: () => (tabs: Tab[]) => {
        return tabs.reduce((sum, tab) => sum + tab.rows.length, 0)
      },
      
      activeSectorsCount: () => (tabs: Tab[]) => {
        return tabs.reduce((sum, tab) => 
          sum + tab.rows.filter(row => row.inSector && !row.inBonus).length, 0
        )
      },
      
      activeBonusesCount: () => (tabs: Tab[]) => {
        return tabs.reduce((sum, tab) => 
          sum + tab.rows.filter(row => row.inBonus).length, 0
        )
      }
    }
  }
}

// Экспорт типов для использования в других компонентах
export type { Tab }
