import { defineStore } from 'pinia'
import { loginApi } from '../services/api'
import { ref, reactive, watch } from 'vue'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    username: '' as string,      // ← логин пользователя
    loggedIn: false as boolean,
    error: '' as string,
  }),
  actions: {
    async login(username: string, password: string) {
      try {
        const res = await loginApi(username, password)
        if (res.data.success) {
          this.loggedIn = true
          this.error = ''
          this.username = username        // ← сохраняем логин
        } else {
          this.loggedIn = false
          this.error = res.data.message || 'Неверный логин или пароль'
          this.username = ''
        }
      } catch (e: any) {
        this.loggedIn = false
        this.error = e.message || 'Сетевая ошибка'
        this.username = ''
      }
    }
  },
  persist: true,  // сохраняем в localStorage
})

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
      const data = {
        config: JSON.parse(JSON.stringify(config)),
        closedPattern: closedPattern.value,
        answers: JSON.parse(JSON.stringify(answers.value)),
      }
      localStorage.setItem(storageKey(type), JSON.stringify(data))
    }

    function loadTypeData(type = uploadType.value) {
      const raw = localStorage.getItem(storageKey(type))
      let desired = 15
      if (type === 'olymp31') desired = 31
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
      const oldType = prevType ?? uploadType.value
      saveTypeData(oldType)
      uploadType.value = type
      loadTypeData(type)
    }

    function clearTypeData() {
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
      () => saveTypeData(uploadType.value),
      { deep: true }
    )

    // загрузка данных для текущего типа при инициализации
    loadTypeData(uploadType.value)

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
      paths: ['domain', 'gameId', 'levelId', 'uploadType'],
    },
  }
)
