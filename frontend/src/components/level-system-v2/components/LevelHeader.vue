<template>
  <div class="level-header mb-6">
    <h1 class="text-2xl font-bold text-gray-800">{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент шапки страницы загрузки
 * Принимает данные роута как props
 */
import { computed } from 'vue'

interface Props {
  typeId: string
  subtype?: string
}

const props = defineProps<Props>()

// Формирование заголовка с учетом типа и подтипа
const title = computed(() => {
  const baseTitle = props.typeId === 'olymp' ? 'Олимпийка' : '100500 секторов и бонусов'
  
  // Добавляем информацию о подтипе для Олимпийки
  if (props.typeId === 'olymp' && props.subtype) {
    return `${baseTitle} (${props.subtype})`
  }
  
  return baseTitle
})
</script>


