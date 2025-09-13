<template>
  <div class="level-control-panel">
    <!-- Заголовок панели -->
    <div class="control-panel-header">
      <h3 class="text-lg font-semibold text-gray-800">Панель управления</h3>
      <div class="text-sm text-gray-600">
        {{ activeControlsCount }} контролов для {{ typeName }}
      </div>
    </div>

    <!-- Контролы -->
    <div class="controls-grid">
      <div
        v-for="controlId in activeControls"
        :key="controlId"
        class="control-item"
      >
        <component
          :is="getControlComponent(controlId)"
          v-if="getControlComponent(controlId)"
        />
      </div>
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

const activeControlsCount = computed<number>(() => {
  return activeControls.value.length
})

const typeName = computed<string>(() => {
  // ✅ Правильно: название из конфига типа уровня
  return levelConfig.value?.name || 'Неизвестный тип'
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
.level-control-panel {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.control-panel-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.control-panel-header h3 {
  margin-bottom: 0.25rem;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;
}

.control-item {
  min-height: 4rem;
}

/* Адаптивность для планшетов и выше */
@media (min-width: 768px) {
  .controls-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .controls-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .controls-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* Мобильная адаптация */
@media (max-width: 768px) {
  .level-control-panel {
    padding: 1rem;
  }
  
  .controls-grid {
    gap: 1rem;
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


