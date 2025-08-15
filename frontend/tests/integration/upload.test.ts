import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { RequestValidator } from '../utils/RequestValidator'
import { sendTask, sendSector, sendBonuses, type Answer } from '../../src/services/uploader'
import axios from 'axios'

describe('Upload Data Validation', () => {
  let validator: RequestValidator
  let interceptedRequests: Map<string, any> = new Map()
  
  beforeAll(async () => {
    validator = new RequestValidator()
    
    // Загружаем эталонные данные если они существуют
    try {
      await validator.loadBaseline('tests/fixtures/request-baseline.json')
    } catch (error) {
      console.log('⚠️ Эталонные данные не найдены, будут записаны новые')
    }
    
    // Перехватываем запросы для валидации
    axios.interceptors.request.use((config) => {
      if (config.url?.includes('/api/admin/')) {
        interceptedRequests.set(config.url!, config.data)
      }
      return config
    })
  })
  
  afterAll(() => {
    // Очищаем перехватчики
    axios.interceptors.request.clear()
  })
  
  describe('Task Upload', () => {
    it('должен отправлять задание с правильной структурой данных', async () => {
      const mockData = {
        domain: 'test',
        gameId: '12345',
        levelId: '1',
        inputTask: '<table><tr><td>Test Task</td></tr></table>'
      }
      
      // Мокаем axios.post для теста
      const originalPost = axios.post
      let capturedData: any = null
      
      axios.post = jest.fn().mockImplementation((url, data) => {
        capturedData = data
        return Promise.resolve({ status: 200, data: 'OK' })
      })
      
      await sendTask(
        mockData.domain,
        mockData.gameId,
        mockData.levelId,
        mockData.inputTask
      )
      
      // Проверяем критические поля
      expect(validator.validateCriticalFields('task', capturedData)).toBe(true)
      
      // Проверяем структуру данных
      const params = new URLSearchParams(capturedData)
      expect(params.get('domain')).toBe(mockData.domain)
      expect(params.get('gid')).toBe(mockData.gameId)
      expect(params.get('level')).toBe(mockData.levelId)
      expect(params.get('inputTask')).toBe(mockData.inputTask)
      
      axios.post = originalPost
    })
    
    it('должен сохранять HTML структуру задания без изменений', async () => {
      const complexHTML = `
        <table class="olymp-table">
          <tr>
            <td id="1_01">Сектор 1</td>
            <td id="1_02" rowspan="2">Сектор 2</td>
          </tr>
          <tr>
            <td id="1_03">Сектор 3</td>
          </tr>
        </table>
      `.trim()
      
      const originalPost = axios.post
      let capturedHTML: string | null = null
      
      axios.post = jest.fn().mockImplementation((url, data) => {
        const params = new URLSearchParams(data)
        capturedHTML = params.get('inputTask')
        return Promise.resolve({ status: 200, data: 'OK' })
      })
      
      await sendTask('test', '123', '1', complexHTML)
      
      expect(capturedHTML).toBe(complexHTML)
      
      axios.post = originalPost
    })
  })
  
  describe('Sectors Upload', () => {
    it('должен отправлять секторы с правильной структурой txtAnswer_N/ddlAnswerFor_N', async () => {
      const variants = ['ОТВЕТ1', 'ОТВЕТ2', 'ОТВЕТ3']
      
      const originalPost = axios.post
      let capturedData: any = null
      
      axios.post = jest.fn().mockImplementation((url, data) => {
        capturedData = data
        return Promise.resolve({ status: 200, data: 'OK' })
      })
      
      await sendSector(
        'test',
        '123',
        '1',
        variants,
        'Закрытый сектор',
        'Название сектора'
      )
      
      // Проверяем критические поля
      expect(validator.validateCriticalFields('sector', capturedData)).toBe(true)
      
      // Проверяем структуру ответов
      const params = new URLSearchParams(capturedData)
      
      // Проверяем парность полей
      for (let i = 0; i < variants.length; i++) {
        expect(params.get(`txtAnswer_${i}`)).toBe(variants[i])
        expect(params.get(`ddlAnswerFor_${i}`)).toBe('0')
      }
      
      // Проверяем обязательные поля
      expect(params.get('savesector')).toBe(' ')
      expect(params.get('txtSectorName')).toBe('Название сектора')
      
      axios.post = originalPost
    })
    
    it('должен корректно обрабатывать пустое название сектора', async () => {
      const originalPost = axios.post
      let capturedData: any = null
      
      axios.post = jest.fn().mockImplementation((url, data) => {
        capturedData = data
        return Promise.resolve({ status: 200, data: 'OK' })
      })
      
      await sendSector('test', '123', '1', ['ОТВЕТ'], 'закрытый', '')
      
      const params = new URLSearchParams(capturedData)
      expect(params.get('txtSectorName')).toBe('')
      
      axios.post = originalPost
    })
  })
  
  describe('Bonuses Upload', () => {
    it('должен отправлять бонусы с правильными полями времени', async () => {
      const bonuses: Answer[] = [{
        number: 1,
        variants: ['БОНУС1', 'БОНУС2'],
        inSector: false,
        inBonus: true,
        bonusTime: {
          hours: 1,
          minutes: 30,
          seconds: 45,
          negative: true
        },
        closedText: '',
        displayText: 'Отображение',
        bonusName: 'Тестовый бонус'
      }]
      
      // Мокаем GET запрос для формы бонусов
      const originalGet = axios.get
      axios.get = jest.fn().mockResolvedValue({
        data: '<input name="level_1" /><input name="level_2" />'
      })
      
      const originalPost = axios.post
      const capturedRequests: any[] = []
      
      axios.post = jest.fn().mockImplementation((url, data) => {
        capturedRequests.push(data)
        return Promise.resolve({ status: 200, data: 'OK' })
      })
      
      await sendBonuses('test', '123', '1', bonuses)
      
      // Должен быть один запрос на бонус
      expect(capturedRequests).toHaveLength(1)
      
      const params = new URLSearchParams(capturedRequests[0])
      
      // Проверяем временные поля
      expect(params.get('txtHours')).toBe('1')
      expect(params.get('txtMinutes')).toBe('30')
      expect(params.get('txtSeconds')).toBe('45')
      expect(params.get('negative')).toBe('on')
      
      // Проверяем варианты ответов (с отрицательными индексами)
      expect(params.get('answer_-1')).toBe('БОНУС1')
      expect(params.get('answer_-2')).toBe('БОНУС2')
      
      // Проверяем название бонуса
      expect(params.get('txtBonusName')).toBe('Тестовый бонус')
      
      axios.get = originalGet
      axios.post = originalPost
    })
    
    it('должен правильно обрабатывать поля delay и relativeLimit для Type100500', async () => {
      const bonus: Answer = {
        number: 1,
        variants: ['БОНУС'],
        inSector: false,
        inBonus: true,
        bonusTime: { hours: 0, minutes: 10, seconds: 0, negative: false },
        delay: { hours: 1, minutes: 0, seconds: 0 },
        relativeLimit: { hours: 2, minutes: 30, seconds: 0 },
        closedText: '',
        displayText: '',
        bonusName: 'Бонус с задержкой'
      }
      
      const originalGet = axios.get
      axios.get = jest.fn().mockResolvedValue({
        data: '<input name="level_1" />'
      })
      
      const originalPost = axios.post
      let capturedData: any = null
      
      axios.post = jest.fn().mockImplementation((url, data) => {
        capturedData = data
        return Promise.resolve({ status: 200, data: 'OK' })
      })
      
      await sendBonuses('test', '123', '1', [bonus])
      
      const params = new URLSearchParams(capturedData)
      
      // Проверяем поля задержки
      expect(params.get('chkDelay')).toBe('on')
      expect(params.get('txtDelayHours')).toBe('1')
      expect(params.get('txtDelayMinutes')).toBe('0')
      expect(params.get('txtDelaySeconds')).toBe('0')
      
      // Проверяем поля ограничения
      expect(params.get('chkRelativeLimit')).toBe('on')
      expect(params.get('txtValidHours')).toBe('2')
      expect(params.get('txtValidMinutes')).toBe('30')
      expect(params.get('txtValidSeconds')).toBe('0')
      
      axios.get = originalGet
      axios.post = originalPost
    })
    
    it('должен правильно обрабатывать уровни бонусов (allLevels vs targetLevels)', async () => {
      const bonusAllLevels: Answer = {
        number: 1,
        variants: ['БОНУС1'],
        inSector: false,
        inBonus: true,
        allLevels: true,
        bonusTime: { hours: 0, minutes: 5, seconds: 0, negative: false },
        closedText: '',
        displayText: '',
        bonusName: 'Бонус на всех уровнях'
      }
      
      const bonusTargetLevels: Answer = {
        number: 2,
        variants: ['БОНУС2'],
        inSector: false,
        inBonus: true,
        allLevels: false,
        targetLevels: ['2', '3', '5'],
        bonusTime: { hours: 0, minutes: 5, seconds: 0, negative: false },
        closedText: '',
        displayText: '',
        bonusName: 'Бонус на указанных уровнях'
      }
      
      const originalGet = axios.get
      axios.get = jest.fn().mockResolvedValue({
        data: `
          <div class="levelWrapper"><span>1</span><input name="level_1" /></div>
          <div class="levelWrapper"><span>2</span><input name="level_2" /></div>
          <div class="levelWrapper"><span>3</span><input name="level_3" /></div>
          <div class="levelWrapper"><span>5</span><input name="level_5" /></div>
        `
      })
      
      const originalPost = axios.post
      const capturedRequests: any[] = []
      
      axios.post = jest.fn().mockImplementation((url, data) => {
        capturedRequests.push(data)
        return Promise.resolve({ status: 200, data: 'OK' })
      })
      
      // Тест 1: Бонус на всех уровнях
      await sendBonuses('test', '123', '1', [bonusAllLevels])
      
      let params = new URLSearchParams(capturedRequests[0])
      expect(params.get('rbAllLevels')).toBe('0')
      // При allLevels чекбоксы уровней не должны отправляться
      expect(params.get('level_1')).toBeNull()
      expect(params.get('level_2')).toBeNull()
      
      // Тест 2: Бонус на указанных уровнях
      capturedRequests.length = 0
      await sendBonuses('test', '123', '1', [bonusTargetLevels])
      
      params = new URLSearchParams(capturedRequests[0])
      expect(params.get('rbAllLevels')).toBe('1')
      // Должны быть отмечены: текущий уровень (1) + указанные (2, 3, 5)
      expect(params.get('level_1')).toBe('on')
      expect(params.get('level_2')).toBe('on')
      expect(params.get('level_3')).toBe('on')
      expect(params.get('level_5')).toBe('on')
      
      axios.get = originalGet
      axios.post = originalPost
    })
  })
  
  describe('Критические проверки полей', () => {
    it('должен валидировать все критические поля для каждого типа запроса', () => {
      // Task
      const taskData = 'domain=test&gid=123&level=1&inputTask=content'
      expect(validator.validateCriticalFields('task', taskData)).toBe(true)
      
      const invalidTaskData = 'domain=test&gid=123' // отсутствуют level и inputTask
      expect(validator.validateCriticalFields('task', invalidTaskData)).toBe(false)
      
      // Sector
      const sectorData = 'domain=test&gid=123&level=1&savesector= &txtAnswer_0=A1&ddlAnswerFor_0=0'
      expect(validator.validateCriticalFields('sector', sectorData)).toBe(true)
      
      const invalidSectorData = 'domain=test&gid=123&level=1' // отсутствуют ответы
      expect(validator.validateCriticalFields('sector', invalidSectorData)).toBe(false)
      
      // Bonus
      const bonusData = 'domain=test&gid=123&level=1&txtBonusName=B1&answer_-1=A&txtHours=0&txtMinutes=5&txtSeconds=0'
      expect(validator.validateCriticalFields('bonus', bonusData)).toBe(true)
      
      const invalidBonusData = 'domain=test&gid=123&level=1&txtBonusName=B1' // отсутствуют временные поля
      expect(validator.validateCriticalFields('bonus', invalidBonusData)).toBe(false)
    })
  })
})