import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchBonusLevels } from '@/services/uploader'
import { useAuthStore } from '@/store/auth'

interface BonusLevelOption {
  label: string
  name: string
}

interface LoadParams {
  domain?: string
  gameId?: string | number
  levelId?: string | number
}

function createKey({ domain, gameId, levelId }: LoadParams): string {
  return [domain || '', gameId ?? '', levelId ?? ''].join('|')
}

export const useBonusLevelsStore = defineStore('level-v2/bonus-levels', () => {
  const options = ref<BonusLevelOption[]>([])
  const isLoading = ref(false)
  const error = ref('')
  const loadedKey = ref('')

  const mapping = computed<Record<string, string>>(() => {
    return options.value.reduce<Record<string, string>>((acc, option) => {
      acc[option.label] = option.name
      return acc
    }, {})
  })

  async function loadLevels(params: LoadParams, force = false): Promise<BonusLevelOption[]> {
    const { domain, gameId, levelId } = params
    const key = createKey(params)

    if (!domain || !gameId || !levelId) {
      options.value = []
      error.value = 'Не заданы параметры уровня для загрузки уровней бонуса.'
      return []
    }

    if (!force && options.value.length > 0 && loadedKey.value === key) {
      return options.value
    }

    const authStore = useAuthStore()

    if (!authStore.username || !authStore.password) {
      options.value = []
      error.value = 'Укажите учетные данные перед загрузкой уровней бонуса.'
      return []
    }

    isLoading.value = true
    error.value = ''

    try {
      await authStore.authenticate(domain)
      const list = await fetchBonusLevels(domain, gameId, levelId)
      options.value = list
      loadedKey.value = key
      return options.value
    } catch (err: unknown) {
      options.value = []
      loadedKey.value = ''
      error.value = err instanceof Error ? err.message : 'Не удалось загрузить уровни бонуса.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function reset(): void {
    options.value = []
    error.value = ''
    loadedKey.value = ''
  }

  return {
    options,
    isLoading,
    error,
    mapping,
    loadLevels,
    reset,
  }
})