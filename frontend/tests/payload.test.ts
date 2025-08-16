import { describe, it, expect } from 'vitest'
import { 
  buildTaskPayload, 
  buildSectorPayload, 
  buildBonusPayload,
  paramsToObject,
  type BonusPayloadArgs
} from '../src/services/upload/builders'

describe('Payload Builders', () => {
  describe('buildTaskPayload', () => {
    it('should build correct task payload', () => {
      const payload = buildTaskPayload('126', 123, 1, '<table class="olymp">test content</table>')
      const obj = paramsToObject(payload)
      
      expect(obj).toMatchSnapshot('task-payload-basic')
      
      // Проверяем критические поля
      expect(obj.domain).toBe('126')
      expect(obj.gid).toBe('123')
      expect(obj.level).toBe('1')
      expect(obj.inputTask).toBe('<table class="olymp">test content</table>')
    })
  })
  
  describe('buildSectorPayload', () => {
    it('should build correct sector payload with single variant', () => {
      const payload = buildSectorPayload('126', 123, 1, ['ANSWER1'])
      const obj = paramsToObject(payload)
      
      expect(obj).toMatchSnapshot('sector-payload-single')
      
      // Проверяем критические поля
      expect(obj.savesector).toBe(' ')
      expect(obj.txtAnswer_0).toBe('ANSWER1')
      expect(obj.ddlAnswerFor_0).toBe('0')
    })
    
    it('should build correct sector payload with multiple variants', () => {
      const payload = buildSectorPayload('126', 123, 1, ['ANSWER1', 'ANSWER2', 'ANSWER3'], 'Sector Name')
      const obj = paramsToObject(payload)
      
      expect(obj).toMatchSnapshot('sector-payload-multiple')
      
      // Проверяем парность полей txtAnswer_N и ddlAnswerFor_N
      expect(obj.txtAnswer_0).toBe('ANSWER1')
      expect(obj.ddlAnswerFor_0).toBe('0')
      expect(obj.txtAnswer_1).toBe('ANSWER2')
      expect(obj.ddlAnswerFor_1).toBe('0')
      expect(obj.txtAnswer_2).toBe('ANSWER3')
      expect(obj.ddlAnswerFor_2).toBe('0')
      expect(obj.txtSectorName).toBe('Sector Name')
    })
  })
  
  describe('buildBonusPayload', () => {
    it('should build correct bonus payload for Olymp type', () => {
      const args: BonusPayloadArgs = {
        domain: '126',
        gid: 123,
        level: 1,
        name: 'Bonus 1',
        variants: ['BONUSANSWER1'],
        time: { hours: 0, minutes: 10, seconds: 0 },
        allLevels: false,
        levelCheckboxNames: ['level_1']
      }
      
      const payload = buildBonusPayload(args)
      const obj = paramsToObject(payload)
      
      expect(obj).toMatchSnapshot('bonus-payload-olymp')
      
      // Проверяем критические поля для олимпийки
      expect(obj.txtBonusName).toBe('Bonus 1')
      expect(obj['answer_-1']).toBe('BONUSANSWER1')
      expect(obj.txtHours).toBe('0')
      expect(obj.txtMinutes).toBe('10')
      expect(obj.txtSeconds).toBe('0')
      expect(obj.rbAllLevels).toBe('1')
      expect(obj.level_1).toBe('on')
    })
    
    it('should build correct bonus payload for Type100500 with all features', () => {
      const args: BonusPayloadArgs = {
        domain: '126',
        gid: 123,
        level: 1,
        name: 'Complex Bonus',
        task: '<p>Bonus task description</p>',
        hint: '<p>Hint text</p>',
        variants: ['VAR1', 'VAR2', 'VAR3'],
        time: { hours: 0, minutes: 5, seconds: 30, negative: true },
        delay: { hours: 0, minutes: 15, seconds: 0 },
        relativeLimit: { hours: 1, minutes: 0, seconds: 0 },
        allLevels: false,
        levelCheckboxNames: ['level_1', 'level_2', 'level_3']
      }
      
      const payload = buildBonusPayload(args)
      const obj = paramsToObject(payload)
      
      expect(obj).toMatchSnapshot('bonus-payload-type100500')
      
      // Проверяем все критические поля для Type100500
      expect(obj.txtTask).toBe('<p>Bonus task description</p>')
      expect(obj.txtHelp).toBe('<p>Hint text</p>')
      expect(obj['answer_-1']).toBe('VAR1')
      expect(obj['answer_-2']).toBe('VAR2')
      expect(obj['answer_-3']).toBe('VAR3')
      expect(obj.negative).toBe('on')
      expect(obj.chkDelay).toBe('on')
      expect(obj.txtDelayMinutes).toBe('15')
      expect(obj.chkRelativeLimit).toBe('on')
      expect(obj.txtValidHours).toBe('1')
      expect(obj.level_1).toBe('on')
      expect(obj.level_2).toBe('on')
      expect(obj.level_3).toBe('on')
    })
    
    it('should build correct bonus payload with allLevels=true', () => {
      const args: BonusPayloadArgs = {
        domain: '126',
        gid: 123,
        level: 1,
        name: 'All Levels Bonus',
        variants: ['ANSWER'],
        time: { hours: 0, minutes: 0, seconds: 30 },
        allLevels: true // На всех уровнях
      }
      
      const payload = buildBonusPayload(args)
      const obj = paramsToObject(payload)
      
      expect(obj).toMatchSnapshot('bonus-payload-all-levels')
      
      // При allLevels=true должно быть rbAllLevels=0 и НЕ должно быть чекбоксов уровней
      expect(obj.rbAllLevels).toBe('0')
      expect(obj.level_1).toBeUndefined()
      expect(obj.level_2).toBeUndefined()
    })
  })
  
  describe('Edge cases', () => {
    it('should handle empty variants array', () => {
      const payload = buildSectorPayload('126', 123, 1, [])
      const obj = paramsToObject(payload)
      
      expect(obj.txtAnswer_0).toBeUndefined()
      expect(obj.ddlAnswerFor_0).toBeUndefined()
    })
    
    it('should handle bonus without optional fields', () => {
      const args: BonusPayloadArgs = {
        domain: '126',
        gid: 123,
        level: 1,
        variants: ['SIMPLE'],
        time: { hours: 0, minutes: 0, seconds: 0 },
        allLevels: true
      }
      
      const payload = buildBonusPayload(args)
      const obj = paramsToObject(payload)
      
      // Проверяем, что необязательные поля отсутствуют
      expect(obj.txtTask).toBeUndefined()
      expect(obj.txtHelp).toBeUndefined()
      expect(obj.negative).toBeUndefined()
      expect(obj.chkDelay).toBeUndefined()
      expect(obj.chkRelativeLimit).toBeUndefined()
    })
  })
})

