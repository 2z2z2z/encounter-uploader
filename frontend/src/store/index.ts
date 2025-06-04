import { defineStore } from 'pinia'
import { loginApi } from '../services/api'

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

export const useUploadStore = defineStore('upload', {
  state: () => ({
    // Шаг «Настройки»
    domain: '' as string, // например '126'
    gameId: '' as string,
    levelId: '' as string,
    uploadType: 'olymp' as string, // «Олимпийка (15 секторов)»

    // Параметры загрузки
    config: {
      sectorMode: 'all' as 'all' | 'initialAndFinal' | 'finalOnly',
      bonusTime: {
        hours: 0,
        minutes: 0,
        seconds: 0,
        negative: false,
      },
    },

    // Шаблон закрытого сектора (& → номер)
    closedPattern: '' as string,

    // Данные по ответам (по умолчанию 15 секторов)
    answers: createAnswers(15),
  }),
  actions: {
    setUploadType(type: string) {
      this.uploadType = type
      const desired = type === 'olymp31' ? 31 : 15
      if (this.answers.length > desired) {
        this.answers = this.answers.slice(0, desired)
      } else if (this.answers.length < desired) {
        for (let i = this.answers.length; i < desired; i++) {
          this.answers.push(createAnswerEntry(i + 1))
        }
      }
    },
  },
  persist: true,
})
