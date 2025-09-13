import { ref } from 'vue'
import axios from 'axios'
import type { TabData } from '@/components/level-system-v2/types'

/**
 * Конфигурация тестового типа уровня из config.json
 */
interface TestConfigV2 {
  typeId: string
  subtype: string | null
  configFile: string
}

/**
 * Данные уровня в формате экспорта level-system-v2
 */
interface TestLevelDataV2 {
  version: number
  type: string
  timestamp: string
  exportFormat: string
  tabs: TabData[]
  config: {
    sectorMode: 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'
    bonusTime: {
      hours: number
      minutes: number
      seconds: number
      negative: boolean
    }
  }
}

/**
 * Credentials из переменных окружения
 */
interface TestCredentialsV2 {
  login: string
  password: string
  domain: string
  gameId: string
  levelId: string
}

/**
 * Композабл для работы с тестовыми конфигурациями v2
 * 
 * ВАЖНО: Работает исключительно с JSON файлами и переменными окружения.
 * НЕ использует localStorage - все данные загружаются из файлов.
 */
export const useTestConfigV2 = () => {
  const isLoading = ref(false)
  const error = ref<string>('')

  /**
   * Загружает тестовую конфигурацию по типу уровня из test-configs-v2/
   * @param levelType - тип уровня (olymp15, olymp31, olymp63, olymp127, type100500)
   * @returns данные уровня в формате экспорта v2 или null при ошибке
   */
  const loadTestConfigV2 = async (levelType: string): Promise<TestLevelDataV2Extended | null> => {
    isLoading.value = true
    error.value = ''
    
    try {
      // Загружаем маппинг конфигураций v2
      const configResponse = await axios.get('/test-configs-v2/config.json')
      const configs: Record<string, TestConfigV2> = configResponse.data
      
      const testConfig = configs[levelType]
      if (!testConfig) {
        error.value = `Конфигурация v2 для типа "${levelType}" не найдена`
        return null
      }

      // Загружаем данные уровня в формате экспорта v2
      const levelDataResponse = await axios.get(`/test-configs-v2/${testConfig.configFile}`)
      const levelData: TestLevelDataV2 = levelDataResponse.data
      
      // Валидация формата
      if (!levelData.tabs || !Array.isArray(levelData.tabs)) {
        throw new Error('Неверная структура JSON файла v2: отсутствует массив tabs')
      }

      if (!levelData.config) {
        throw new Error('Неверная структура JSON файла v2: отсутствует config')
      }

      // Дополняем данными из config.json (через расширенный тип)
      const extendedData: TestLevelDataV2Extended = {
        ...levelData,
        typeId: testConfig.typeId,
        subtype: testConfig.subtype
      }

      return extendedData
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      error.value = `Ошибка загрузки тестовой конфигурации v2: ${errorMessage}`
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получает credentials из environment переменных
   * ВАЖНО: НЕ использует localStorage, только переменные окружения
   */
  const getTestCredentialsV2 = (): TestCredentialsV2 => {
    return {
      login: import.meta.env.VITE_TEST_LOGIN || 'test',
      password: import.meta.env.VITE_TEST_PASSWORD || 'test',
      domain: import.meta.env.VITE_TEST_DOMAIN || 'test',
      gameId: import.meta.env.VITE_TEST_GAME_ID || 'test',
      levelId: import.meta.env.VITE_TEST_LEVEL_ID || '1'
    }
  }

  /**
   * Парсит параметры роута для извлечения typeId и subtype
   * @param levelType - параметр из роута (olymp15, olymp31, type100500)
   * @returns объект с typeId и subtype
   */
  const parseTestLevelType = (levelType: string): { typeId: string; subtype: string | null } => {
    // Олимпийка: olymp15 -> typeId: 'olymp', subtype: '15'
    if (levelType.startsWith('olymp')) {
      const subtype = levelType.replace('olymp', '')
      return { typeId: 'olymp', subtype }
    }
    
    // Type100500: type100500 -> typeId: 'type100500', subtype: null
    if (levelType === 'type100500') {
      return { typeId: 'type100500', subtype: null }
    }
    
    // Fallback
    return { typeId: levelType, subtype: null }
  }

  /**
   * Получает мета-информацию о тестовом типе
   */
  const getTestTypeInfo = (levelType: string) => {
    const { typeId, subtype } = parseTestLevelType(levelType)
    const credentials = getTestCredentialsV2()
    
    return {
      typeId,
      subtype,
      credentials,
      testMode: true,
      // Для отладочной панели
      testConfigPath: `/test-configs-v2/${levelType}.json`,
      envVars: {
        domain: credentials.domain,
        gameId: credentials.gameId,
        levelId: credentials.levelId
      }
    }
  }

  return {
    isLoading,
    error,
    loadTestConfigV2,
    getTestCredentialsV2,
    parseTestLevelType,
    getTestTypeInfo
  }
}

/**
 * Расширенный тип для включения дополнительных полей из config.json
 */
export interface TestLevelDataV2Extended extends TestLevelDataV2 {
  typeId?: string
  subtype?: string | null
}