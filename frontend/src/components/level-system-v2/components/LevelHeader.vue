<template>
  <Card>
    <template #title v-if="showTitle">{{ title }}</template>
    <template #subtitle v-if="showMeta">
      автор: <strong>{{ authStore.username }}</strong>,
      домен: <strong>{{ levelV2Store.domain }}</strong>,
      игра: <strong>{{ levelV2Store.gameId }}</strong>,
      уровень: <strong>{{ levelV2Store.levelId }}</strong>
    </template>
  </Card>
</template>

<script setup lang="ts">
/**
 * Компонент шапки страницы загрузки (универсальная логика)
 * Получает название из конфигов типа уровня, отображает мета-данные из store
 */
import { computed } from 'vue'
import { getLevelTypeConfig, getSubtypeConfig } from '../configs'
import { useLevelV2Store } from '../store'
import { useAuthStore } from '../../../store/auth'

// PrimeVue components
import Card from 'primevue/card'

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
const levelV2Store = useLevelV2Store()
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
</script>


