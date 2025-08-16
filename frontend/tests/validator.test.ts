import { describe, it, expect } from 'vitest'
import { 
  validateCriticalFields, 
  validatePayload,
  type ValidationResult 
} from '../src/services/upload/validator'
import { 
  buildTaskPayload, 
  buildSectorPayload, 
  buildBonusPayload 
} from '../src/services/upload/builders'

describe('Payload Validator', () => {
  describe('validateCriticalFields for task', () => {
    it('should validate correct task data', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        inputTask: '<table>Test content</table>'
      }
      
      const result = validateCriticalFields('task', data)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should detect missing inputTask', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1'
      }
      
      const result = validateCriticalFields('task', data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Отсутствует HTML содержимое задания (inputTask)')
    })
    
    it('should warn about short content', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        inputTask: 'short'
      }
      
      const result = validateCriticalFields('task', data)
      
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Подозрительно короткое содержимое задания')
    })
  })
  
  describe('validateCriticalFields for sector', () => {
    it('should validate correct sector data', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        savesector: ' ',
        txtAnswer_0: 'ANSWER1',
        ddlAnswerFor_0: '0',
        txtAnswer_1: 'ANSWER2',
        ddlAnswerFor_1: '0'
      }
      
      const result = validateCriticalFields('sector', data)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should detect missing savesector', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        txtAnswer_0: 'ANSWER1',
        ddlAnswerFor_0: '0'
      }
      
      const result = validateCriticalFields('sector', data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Отсутствует поле savesector')
    })
    
    it('should detect mismatched answer/ddl pairs', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        savesector: ' ',
        txtAnswer_0: 'ANSWER1',
        txtAnswer_1: 'ANSWER2',
        ddlAnswerFor_0: '0'
        // Missing ddlAnswerFor_1
      }
      
      const result = validateCriticalFields('sector', data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Несоответствие количества ответов (2) и ddl полей (1)')
      expect(result.errors).toContain('Отсутствует ddlAnswerFor_1 для txtAnswer_1')
    })
  })
  
  describe('validateCriticalFields for bonus', () => {
    it('should validate correct bonus data for all levels', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        txtBonusName: 'Bonus',
        'answer_-1': 'ANSWER',
        txtHours: '0',
        txtMinutes: '10',
        txtSeconds: '0',
        rbAllLevels: '0' // На всех уровнях
      }
      
      const result = validateCriticalFields('bonus', data)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should validate correct bonus data for specific levels', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        txtBonusName: 'Bonus',
        'answer_-1': 'ANSWER',
        txtHours: '0',
        txtMinutes: '10',
        txtSeconds: '0',
        rbAllLevels: '1', // На указанных уровнях
        level_1: 'on',
        level_2: 'on'
      }
      
      const result = validateCriticalFields('bonus', data)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should detect missing time fields', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        'answer_-1': 'ANSWER',
        rbAllLevels: '0'
        // Missing time fields
      }
      
      const result = validateCriticalFields('bonus', data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Отсутствует временное поле: txtHours')
      expect(result.errors).toContain('Отсутствует временное поле: txtMinutes')
      expect(result.errors).toContain('Отсутствует временное поле: txtSeconds')
    })
    
    it('should detect missing levels when rbAllLevels=1', () => {
      const data = {
        domain: '126',
        gid: '123',
        level: '1',
        'answer_-1': 'ANSWER',
        txtHours: '0',
        txtMinutes: '0',
        txtSeconds: '0',
        rbAllLevels: '1' // На указанных уровнях, но нет чекбоксов
      }
      
      const result = validateCriticalFields('bonus', data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Не выбрано ни одного уровня для бонуса')
    })
    
    it('should validate delay fields when enabled', () => {
      const dataValid = {
        domain: '126',
        gid: '123',
        level: '1',
        'answer_-1': 'ANSWER',
        txtHours: '0',
        txtMinutes: '0',
        txtSeconds: '0',
        rbAllLevels: '0',
        chkDelay: 'on',
        txtDelayHours: '0',
        txtDelayMinutes: '15',
        txtDelaySeconds: '0'
      }
      
      const resultValid = validateCriticalFields('bonus', dataValid)
      expect(resultValid.valid).toBe(true)
      
      // Теперь без полей задержки
      const dataInvalid = {
        ...dataValid,
        chkDelay: 'on',
        txtDelayHours: undefined
      }
      delete dataInvalid.txtDelayHours
      
      const resultInvalid = validateCriticalFields('bonus', dataInvalid)
      expect(resultInvalid.valid).toBe(false)
      expect(resultInvalid.errors).toContain('Включена задержка, но отсутствует поле: txtDelayHours')
    })
  })
  
  describe('validatePayload integration', () => {
    it('should validate payload created by builders', () => {
      // Task
      const taskPayload = buildTaskPayload('126', 123, 1, '<table>Content</table>')
      const taskResult = validatePayload('task', taskPayload)
      expect(taskResult.valid).toBe(true)
      
      // Sector
      const sectorPayload = buildSectorPayload('126', 123, 1, ['ANSWER1', 'ANSWER2'])
      const sectorResult = validatePayload('sector', sectorPayload)
      expect(sectorResult.valid).toBe(true)
      
      // Bonus
      const bonusPayload = buildBonusPayload({
        domain: '126',
        gid: 123,
        level: 1,
        name: 'Test Bonus',
        variants: ['ANSWER'],
        time: { hours: 0, minutes: 5, seconds: 0 },
        allLevels: true
      })
      const bonusResult = validatePayload('bonus', bonusPayload)
      expect(bonusResult.valid).toBe(true)
    })
  })
  
  describe('Edge cases', () => {
    it('should detect missing base fields', () => {
      const data = {
        inputTask: '<table>Content</table>'
        // Missing domain, gid, level
      }
      
      const result = validateCriticalFields('task', data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Отсутствует обязательное поле: domain')
      expect(result.errors).toContain('Отсутствует обязательное поле: gid')
      expect(result.errors).toContain('Отсутствует обязательное поле: level')
    })
    
    it('should warn about empty variants', () => {
      const sectorData = {
        domain: '126',
        gid: '123',
        level: '1',
        savesector: ' '
        // No variants
      }
      
      const sectorResult = validateCriticalFields('sector', sectorData)
      expect(sectorResult.warnings).toContain('Нет вариантов ответов для сектора')
      
      const bonusData = {
        domain: '126',
        gid: '123',
        level: '1',
        txtHours: '0',
        txtMinutes: '0',
        txtSeconds: '0',
        rbAllLevels: '0'
        // No variants
      }
      
      const bonusResult = validateCriticalFields('bonus', bonusData)
      expect(bonusResult.warnings).toContain('Нет вариантов ответов для бонуса')
    })
  })
})

