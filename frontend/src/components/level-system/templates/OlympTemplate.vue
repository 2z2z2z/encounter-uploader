<!--
  OlympTemplate - шаблон олимпийки
  Реализация согласно плану рефакторинга (Фаза 1.3)
-->

<template>
  <MixedTemplate 
    :use-mixins="['olymp']"
    :config="olympConfig"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MixedTemplate from './MixedTemplate.vue'
import type { TemplateConfig } from '../core/types/LevelType'

// ============================================================================
// PROPS
// ============================================================================

const props = defineProps<{
  sectors?: number
  type?: string
}>()

// Извлекаем количество секторов из props.type если sectors не передан
const sectors = computed(() => {
  if (props.sectors) return props.sectors
  if (props.type) {
    const match = props.type.match(/olymp_(\d+)/)
    return match ? parseInt(match[1]) : 15
  }
  return 15
})

// ============================================================================
// КОНФИГУРАЦИЯ ОЛИМПИЙКИ (из плана)
// ============================================================================

const olympConfig = computed<TemplateConfig>(() => ({
  name: `olymp_${sectors.value}`,
  label: `Олимпийка (${sectors.value} секторов)`,
  category: 'olymp',
  useMixins: ['olymp'],
  
  // Специфичные настройки олимпийки
  props: {
    sectors: sectors.value,
    allowSectorMode: true,
    sectorModes: ['all', 'initialAndFinal', 'finalOnly', 'custom'],
    generateLayout: true,
    supportsBonuses: true,
    supportsTask: true
  },
  
  // Дополнительные возможности для олимпиек
  extraCapabilities: [
    // Базовые capabilities уже подключены через olymp миксин
    // Здесь можно добавить специфичные для конкретной олимпийки
  ]
}))

// ============================================================================
// СПЕЦИФИЧНЫЕ МЕТОДЫ ДЛЯ ОЛИМПИЙКИ
// ============================================================================

// Все методы наследуются от OlympMixin через MixedTemplate
// Но можем добавить специфичные для конкретного размера олимпийки

function getRecommendedSectorCount(): number {
  // Рекомендуемое количество секторов для загрузки
  switch (props.sectors) {
    case 15:
      return Math.ceil(props.sectors * 0.6) // ~9 секторов
    case 31:
      return Math.ceil(props.sectors * 0.5) // ~16 секторов  
    case 63:
      return Math.ceil(props.sectors * 0.4) // ~25 секторов
    case 127:
      return Math.ceil(props.sectors * 0.3) // ~38 секторов
    default:
      return Math.ceil(props.sectors * 0.4)
  }
}

function getRecommendedBonusCount(): number {
  // Рекомендуемое количество бонусов
  switch (props.sectors) {
    case 15:
      return 3
    case 31:
      return 5
    case 63:
      return 8
    case 127:
      return 12
    default:
      return Math.ceil(props.sectors / 10)
  }
}

function getOptimalSectorMode(): 'all' | 'initialAndFinal' | 'finalOnly' | 'custom' {
  // Оптимальный режим секторов в зависимости от размера
  if (props.sectors <= 15) {
    return 'all' // Для малых олимпиек загружаем все секторы
  } else if (props.sectors <= 31) {
    return 'initialAndFinal' // Средние - начальные и финальные
  } else {
    return 'finalOnly' // Большие - только финальные
  }
}

// ============================================================================
// EXPOSE
// ============================================================================

defineExpose({
  olympConfig,
  getRecommendedSectorCount,
  getRecommendedBonusCount,
  getOptimalSectorMode,
  
  // Параметры олимпийки
  sectors: props.sectors,
  type: 'olymp'
})
</script>

<style scoped>
/* Специфичные стили для олимпиек могут быть добавлены здесь */

/* Например, цветовая схема в зависимости от размера */
:deep(.level-header) {
  border-left: 4px solid var(--olymp-color);
}

/* Цвета для разных размеров олимпиек */
.olymp-15 {
  --olymp-color: #10b981; /* green */
}

.olymp-31 {
  --olymp-color: #3b82f6; /* blue */
}

.olymp-63 {
  --olymp-color: #8b5cf6; /* purple */
}

.olymp-127 {
  --olymp-color: #ef4444; /* red */
}
</style>
