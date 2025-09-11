<template>
  <div class="level-header mb-6">
    <h1 class="text-2xl font-bold text-gray-800">{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент шапки страницы загрузки (универсальная логика)
 * Получает название из конфигов типа уровня
 */
import { computed } from 'vue'
import { getLevelTypeConfig, getSubtypeConfig } from '../configs'

interface Props {
  typeId: string
  subtype?: string
}

const props = defineProps<Props>()

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


