import { defineStore } from 'pinia'
import { ref, reactive, watch, nextTick } from 'vue'
import { UnifiedStateManager } from './unified/StateManager'

// Дублирующий auth store удален - используется store/auth.ts согласно плану рефакторинга

function createAnswerEntry(num: number) {
  return {
    number: num,
    inSector: true,
    inBonus: true,
    bonusTime: {
      hours: 0,
      minutes: 0,
      seconds: 0,
      negative: false,
    },
    variants: [''],
    closedText: '',
    displayText: '',
  }
}

function createAnswers(count: number) {
  return Array.from({ length: count }, (_, i) => createAnswerEntry(i + 1))
}

// Инициализируем StateManager для миграции данных
const stateManager = new UnifiedStateManager({
  enableLegacyMigration: true
})

// Очищаем старые ключи после миграции (выполняется один раз)
setTimeout(() => {
  const result = stateManager.clearLegacyData()
  console.log(`🧹 Очистка legacy данных: удалено ${result.cleared.length} ключей`)
}, 1000) // Задержка чтобы миграция успела завершиться

export const useUploadStore = defineStore(
  'upload',
  () => {
    // --- базовые настройки (храним через pinia-plugin-persistedstate) ---
    const domain = ref('')
    const gameId = ref('')
    const levelId = ref('')
    const uploadType = ref('olymp')

    // --- параметры конкретного уровня (храним отдельно для каждого типа) ---
    const config = reactive({
      sectorMode: 'all' as 'all' | 'initialAndFinal' | 'finalOnly',
      bonusTime: {
        hours: 0,
        minutes: 0,
        seconds: 0,
        negative: false,
      },
    })

    const closedPattern = ref('')
    const answers = ref(createAnswers(15))

    function storageKey(type: string) {
      return `upload-${type}`
    }

    function saveTypeData(type = uploadType.value) {
      // ОТКЛЮЧЕНО: Старая система хранения заменена на UnifiedStateManager
      // Данные теперь сохраняются через новую систему с ключами encounter-uploader:*
      console.log(`📝 Сохранение данных для ${type} теперь обрабатывается UnifiedStateManager`)
    }

    function loadTypeData(type = uploadType.value) {
      console.log(`📖 Загрузка данных для типа: ${type}`)
      
      // Пытаемся загрузить из новой системы
      const newSystemKey = convertTypeToNewFormat(type)
      const newData = stateManager.load(newSystemKey, levelId.value || '1')
      
      if (newData) {
        console.log(`✅ Данные загружены из новой системы: ${newSystemKey}`)
        // Загружаем из новой системы
        if (newData.answers && Array.isArray(newData.answers)) {
          answers.value = newData.answers
        }
        if (newData.typeConfig) {
          Object.assign(config, newData.typeConfig)
        }
        closedPattern.value = newData.typeConfig?.closedPattern || ''
        return
      }
      
      // Fallback: загрузка из старой системы (для совместимости)
      console.log(`⚠️ Fallback: загрузка из старой системы для ${type}`)
      
      if (type === '100500') {
        closedPattern.value = ''
        answers.value = createAnswers(15)
        config.sectorMode = 'all'
        config.bonusTime = { hours: 0, minutes: 0, seconds: 0, negative: false }
        return
      }
      
      let desired = 15
      if (type === 'olymp31') desired = 31
      else if (type === 'olymp63') desired = 63
      else if (type === 'olymp127') desired = 127
      
      closedPattern.value = ''
      answers.value = createAnswers(desired)
      config.sectorMode = 'all'
      config.bonusTime = { hours: 0, minutes: 0, seconds: 0, negative: false }
    }
    
    // Вспомогательная функция для конвертации типов
    function convertTypeToNewFormat(type: string): string {
      if (type === 'olymp') return 'olymp_15'
      if (type === 'olymp31') return 'olymp_31'
      if (type === 'olymp63') return 'olymp_63'
      if (type === 'olymp127') return 'olymp_127'
      if (type === '100500') return 'type_100500'
      return type
    }

    function setUploadType(type: string, prevType?: string) {
      // ОБНОВЛЕНО: Используем новую систему хранения
      console.log(`🔄 Переключение типа: ${prevType} -> ${type}`)
      
      // Сохранение через UnifiedStateManager происходит автоматически
      // благодаря автосохранению каждые 30 секунд
      uploadType.value = type
      loadTypeData(type)
    }

    function clearTypeData() {
      if (uploadType.value === '100500') return
      let desired = 15
      if (uploadType.value === 'olymp31') desired = 31
      else if (uploadType.value === 'olymp63') desired = 63
      else if (uploadType.value === 'olymp127') desired = 127
      answers.value = createAnswers(desired)
      closedPattern.value = ''
      config.sectorMode = 'all'
      config.bonusTime = { hours: 0, minutes: 0, seconds: 0, negative: false }
      saveTypeData(uploadType.value)
    }

    watch(
      [config, closedPattern, answers],
      () => {
        if (uploadType.value !== '100500') saveTypeData(uploadType.value)
      },
      { deep: true }
    )

    // Инициализация данных для текущего типа при запуске
    // Выполняется в nextTick чтобы persist успел восстановить uploadType
    nextTick(() => {
      loadTypeData(uploadType.value)
    })

    return {
      domain,
      gameId,
      levelId,
      uploadType,
      config,
      closedPattern,
      answers,
      setUploadType,
      clearTypeData,
    }
  },
  {
    persist: {
      pick: ['domain', 'gameId', 'levelId', 'uploadType'],
    },
  }
)
