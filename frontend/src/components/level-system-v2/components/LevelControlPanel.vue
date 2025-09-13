<template>
  <div class="flex flex-wrap justify-between items-end gap-x-8 gap-y-10 mt-8 mb-6 rounded-2xl bg-violet-50 py-10 px-5">
    <div
      v-for="controlId in activeControls"
      :key="controlId"
      class="flex-1 text-nowrap"
    >
      <component
        :is="getControlComponent(controlId)"
        v-if="getControlComponent(controlId)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLevelV2Store } from '../store'
import { getLevelTypeConfig } from '../configs'
import type { ControlId } from '../types'
import { controls } from '../bases/controls'

const store = useLevelV2Store()

/**
 * ✅ Правильно: получение конфигурации через универсальную систему БЕЗ хардкода
 * ❌ ЗАПРЕЩЕНО: Хардкод store.levelType === 'olymp' или 'type100500'
 */
const levelConfig = computed(() => {
  return getLevelTypeConfig(store.levelType)
})

// Вычисляемые свойства
const activeControls = computed<ControlId[]>(() => {
  // ✅ Правильно: получаем контролы из конфига типа уровня
  return levelConfig.value?.controls || []
})


// Получить компонент контрола по ID
const getControlComponent = (controlId: ControlId) => {
  return controls[controlId]
}
</script>

<style scoped>
/**
 * Стилизация контрол-панели через обычные CSS свойства
 * Без @apply для совместимости с TailwindCSS v4
 */

.control-panel-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

/* Мобильная адаптация */
@media (max-width: 768px) {
  .level-control-panel {
    padding: 1rem;
  }
  
  .control-panel-header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }
  
  .control-panel-header h3 {
    font-size: 1rem;
    line-height: 1.5rem;
  }
}
</style>
