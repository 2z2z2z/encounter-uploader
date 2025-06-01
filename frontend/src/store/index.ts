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

export const useUploadStore = defineStore('upload', {
  state: () => ({
    // Шаг «Настройки»
    domain: '' as string,            // например '126'
    gameId: '' as string,
    levelId: '' as string,
    uploadType: 'olymp' as string,   // «Олимпийка (15 секторов)»

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

    // Данные по 15 ответам
    answers: Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,                 // порядковый номер
      inSector: true,                // закрывать сектор?
      inBonus: true,                 // начислять бонус?
      bonusTime: {                   // своё время бонуса
        hours: 0,
        minutes: 0,
        seconds: 0,
        negative: false,
      },
      variants: [''],                // варианты ответов
      closedText: '',                // текст для закрытого сектора
      displayText: '',               // текст для открытого сектора
    })),
  }),
  persist: true,
})
