import { defineStore } from 'pinia'
import { ref, reactive, watch, nextTick } from 'vue'

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

export const useUploadStore = defineStore(
  'upload',
  () => {
    // --- базовые настройки (храним через pinia-plugin-persistedstate) ---
    const domain = ref('')
    const gameId = ref('')
    const levelId = ref('')
    const uploadType = ref('olymp15')

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
      if (type === '100500') return
      const data = {
        config: JSON.parse(JSON.stringify(config)),
        closedPattern: closedPattern.value,
        answers: JSON.parse(JSON.stringify(answers.value)),
      }
      localStorage.setItem(storageKey(type), JSON.stringify(data))
    }

    function loadTypeData(type = uploadType.value) {
      if (type === '100500') {
        closedPattern.value = ''
        answers.value = createAnswers(15)
        config.sectorMode = 'all'
        config.bonusTime = { hours: 0, minutes: 0, seconds: 0, negative: false }
        return
      }
      const raw = localStorage.getItem(storageKey(type))
      let desired = 15
      if (type === 'olymp15') desired = 15
      else if (type === 'olymp31') desired = 31
      else if (type === 'olymp63') desired = 63
      else if (type === 'olymp127') desired = 127
      if (raw) {
        try {
          const obj = JSON.parse(raw)
          Object.assign(config, obj.config || {})
          closedPattern.value = obj.closedPattern || ''
          answers.value = Array.isArray(obj.answers)
            ? obj.answers
            : createAnswers(desired)
        } catch {
          closedPattern.value = ''
          answers.value = createAnswers(desired)
        }
      } else {
        closedPattern.value = ''
        answers.value = createAnswers(desired)
      }
    }

    function setUploadType(type: string, prevType?: string) {
      // Сохраняем данные старого типа только если это реальное переключение
      if (prevType !== undefined && prevType !== type) {
        saveTypeData(prevType)
      }
      uploadType.value = type
      loadTypeData(type)
    }

    function clearTypeData() {
      if (uploadType.value === '100500') return
      let desired = 15
      if (uploadType.value === 'olymp15') desired = 15
      else if (uploadType.value === 'olymp31') desired = 31
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
      // Нормализация устаревшего значения: 'olymp' → 'olymp15'
      if (uploadType.value === 'olymp') {
        uploadType.value = 'olymp15'
      }
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
