<template>
  <div
    class="flex max-md:flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 bg-surface-50"
    data-tour="level-header"
  >
    <div class="flex items-center flex-wrap gap-x-4 gap-y-2">
      <div v-if="showTitle" class="text-2xl font-semibold text-surface-900">
        {{ title }}
      </div>
      <Button
        label="Обучение"
        icon="pi pi-graduation-cap"
        severity="help"
        outlined
        size="small"
        @click="startUserTour"
        data-tour="tour-button"
      />
    </div>

    <div v-if="showMeta" class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-surface-600">
      <span>автор: <strong class="text-surface-900">{{ authStore.username }}</strong></span>
      <span>домен: <strong class="text-surface-900">{{ levelStore.domain }}</strong></span>
      <span>игра: <strong class="text-surface-900">{{ levelStore.gameId }}</strong></span>
      <span>уровень: <strong class="text-surface-900">{{ levelStore.levelId }}</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент шапки страницы загрузки (универсальная логика)
 * Получает название из конфигов типа уровня, отображает мета-данные из store
 */
import { computed } from 'vue'
import Button from 'primevue/button'
import { getLevelTypeConfig, getSubtypeConfig } from '@/entities/level/configs'
import { useLevelStore } from '@/store/levels'
import { useAuthStore } from '@/store/auth'

interface Props {
  typeId: string
  subtype?: string
  showTitle?: boolean
  showMeta?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtype: undefined,
  showTitle: true,
  showMeta: true
})

// Store connections
const levelStore = useLevelStore()
const authStore = useAuthStore()

// Computed properties for props
const showTitle = computed(() => props.showTitle)
const showMeta = computed(() => props.showMeta)

// Универсальное формирование заголовка через конфиги
const title = computed(() => {
  const config = getLevelTypeConfig(props.typeId)
  if (!config) {
    return 'Неизвестный тип уровня'
  }
  
  const baseTitle = config.name
  
  // Добавляем информацию о подтипе если он есть
  if (props.subtype && config.subtypes) {
    const subtypeConfig = getSubtypeConfig(props.typeId, props.subtype)
    if (subtypeConfig) {
      return `${baseTitle} - ${subtypeConfig.name}`
    }
    // Fallback если подтип не найден в конфиге
    return `${baseTitle} (${props.subtype})`
  }

  return baseTitle
})

/**
 * Запуск пользовательской обучалки
 */
function startUserTour() {
  // Диспетчим кастомное событие для запуска тура
  globalThis.dispatchEvent(new globalThis.CustomEvent('start-user-tour'))
}
</script>
