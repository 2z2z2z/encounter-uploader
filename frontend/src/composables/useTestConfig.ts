import { ref } from 'vue'
import axios from 'axios'

interface TestConfig {
  uploadType: string
  configFile: string
}

interface TestLevelData {
  domain?: string
  gameId?: string
  uploadType: string
  config: {
    sectorMode: 'all' | 'initialAndFinal' | 'finalOnly'
    bonusTime: {
      hours: number
      minutes: number
      seconds: number
      negative: boolean
    }
  }
  closedPattern: string
  answers: Array<{
    number: number
    inSector: boolean
    inBonus: boolean
    bonusTime: {
      hours: number
      minutes: number
      seconds: number
      negative: boolean
    }
    variants: string[]
    closedText: string
    displayText: string
  }>
}

/**
 * Композабл для работы с тестовыми конфигурациями
 */
export const useTestConfig = () => {
  const isLoading = ref(false)
  const error = ref<string>('')

  /**
   * Загружает тестовую конфигурацию по типу уровня
   */
  const loadTestConfig = async (levelType: string): Promise<TestLevelData | null> => {
    isLoading.value = true
    error.value = ''
    
    try {
      // Загружаем маппинг конфигураций
      const configResponse = await axios.get('/test-configs/config.json')
      const configs: Record<string, TestConfig> = configResponse.data
      
      const testConfig = configs[levelType]
      if (!testConfig) {
        error.value = `Конфигурация для типа "${levelType}" не найдена`
        return null
      }

      // Загружаем данные уровня
      const levelDataResponse = await axios.get(`/test-configs/${testConfig.configFile}`)
      const levelData: TestLevelData = levelDataResponse.data
      
      return levelData
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      error.value = `Ошибка загрузки тестовой конфигурации: ${errorMessage}`
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получает credentials из environment переменных
   */
  const getTestCredentials = () => {
    return {
      login: import.meta.env.VITE_TEST_LOGIN || '',
      password: import.meta.env.VITE_TEST_PASSWORD || '',
      domain: import.meta.env.VITE_TEST_DOMAIN || '',
      gameId: import.meta.env.VITE_TEST_GAME_ID || '',
      levelId: import.meta.env.VITE_TEST_LEVEL_ID || '1'
    }
  }

  return {
    isLoading,
    error,
    loadTestConfig,
    getTestCredentials
  }
}