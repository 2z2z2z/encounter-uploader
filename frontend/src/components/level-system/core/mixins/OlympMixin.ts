/**
 * OlympMixin - миксин функций олимпиек
 * Реализация согласно плану рефакторинга (Фаза 1.2)
 */

import type { MixinDefinition, LevelCapability, UniversalAnswer } from '../types/LevelType'
import { generateOlympLayout } from '../../../../utils/olymp'

// Типы для олимпийской логики
type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'

export function useOlympMixin(): MixinDefinition {
  return {
    name: 'olymp',
    
    // Capabilities олимпиек (из плана)
    capabilities: [
      { type: 'task', required: true },
      { type: 'sectors', required: true },
      { type: 'bonuses', required: false }
    ] as LevelCapability[],
    
    // UI компоненты олимпиек (из плана) - TODO: создать недостающие компоненты  
    components: {
      // SectorControls: () => import('../../../shared/forms/SectorControls.vue'), // TODO: создать
      // OlympTable: () => import('../../../shared/tables/OlympTable.vue') // TODO: создать
    },
    
    // Логика олимпиек (из плана)
    methods: {
      // Генерация олимпийской таблицы
      generateOlympLayout: (sectors: number, level: string) => {
        return generateOlympLayout(sectors, level)
      },
      
      // Применение режимов секторов (из плана)
      applySectorMode: (mode: SectorMode, answers: UniversalAnswer[], sectors: number) => {
        const strategies = {
          all: () => answers.forEach(a => { a.inSector = true }),
          
          initialAndFinal: () => {
            const initial = Math.floor((sectors + 1) / 2)
            answers.forEach(a => {
              const num = typeof a.id === 'number' ? a.id : parseInt(a.id.toString())
              a.inSector = num <= initial || num === sectors
            })
          },
          
          finalOnly: () => {
            answers.forEach(a => {
              const num = typeof a.id === 'number' ? a.id : parseInt(a.id.toString())
              a.inSector = num === sectors
            })
          },
          
          custom: () => {
            // Кастомный режим - пользователь выбирает сам
          }
        }
        
        if (strategies[mode]) {
          strategies[mode]()
        }
      },
      
      // Заполнение открытых секторов (из существующей логики)
      fillOpenSectors: (answers: UniversalAnswer[], pattern: string) => {
        const openAnswers = answers.filter(a => a.inSector && !a.inBonus)
        
        openAnswers.forEach((answer, index) => {
          if (pattern.includes('&')) {
            answer.variants = [pattern.replace('&', (index + 1).toString())]
          } else {
            answer.variants = [pattern]
          }
        })
      },
      
      // Генерация предпросмотра для олимпийки
      generatePreview: (answers: UniversalAnswer[], sectors: number, level: string) => {
        const layout = generateOlympLayout(sectors, level)
        const openSectors = answers.filter(a => a.inSector && !a.inBonus)
        const bonuses = answers.filter(a => a.inBonus)
        
        return {
          html: layout,
          openSectorsCount: openSectors.length,
          bonusesCount: bonuses.length,
          totalSectors: sectors
        }
      },
      
      // Валидация олимпийских данных
      validateOlympData: (answers: UniversalAnswer[], sectors: number) => {
        const errors: string[] = []
        
        // Проверяем количество секторов
        const maxId = Math.max(...answers.map(a => {
          return typeof a.id === 'number' ? a.id : parseInt(a.id.toString())
        }))
        
        if (maxId > sectors) {
          errors.push(`Максимальный номер ответа (${maxId}) превышает количество секторов (${sectors})`)
        }
        
        // Проверяем наличие ответов в секторах
        const sectorAnswers = answers.filter(a => a.inSector)
        if (sectorAnswers.length === 0) {
          errors.push('Не выбрано ни одного сектора для загрузки')
        }
        
        // Проверяем корректность вариантов ответов
        sectorAnswers.forEach(answer => {
          if (answer.variants.length === 0 || answer.variants.every(v => !v.trim())) {
            errors.push(`Сектор ${answer.id} не содержит вариантов ответов`)
          }
        })
        
        return {
          valid: errors.length === 0,
          errors,
          warnings: []
        }
      }
    },
    
    // Computed properties для олимпиек
    computedProperties: {
      sectorsCount: () => (answers: UniversalAnswer[]) => {
        return answers.filter(a => a.inSector && !a.inBonus).length
      },
      
      bonusesCount: () => (answers: UniversalAnswer[]) => {
        return answers.filter(a => a.inBonus).length
      },
      
      totalCount: () => (answers: UniversalAnswer[]) => {
        return answers.length
      }
    }
  }
}

// Экспорт типов для использования в других миксинах
export type { SectorMode }
