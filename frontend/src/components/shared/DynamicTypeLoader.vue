<template>
  <component 
    :is="dynamicComponent" 
    v-if="dynamicComponent"
    v-bind="componentProps"
  />
  <ErrorComponent 
    v-else-if="hasError"
    :error="errorMessage"
  />
  <div v-else class="loading">
    Загрузка компонента...
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, defineAsyncComponent, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import { loadTypeComponent } from '../../router/dynamic-loader'

const ErrorComponent = defineAsyncComponent(() => import('./ErrorComponent.vue'))

// ============================================================================
// PROPS И ROUTER
// ============================================================================

const route = useRoute()
const dynamicComponent = ref<any>(null)
const hasError = ref(false)
const errorMessage = ref('')

// ============================================================================
// COMPUTED
// ============================================================================

const componentType = computed(() => {
  const type = route.params.type as string
  return type || 'olymp_15'
})

const componentProps = computed(() => {
  // Передаем параметры маршрута как props
  return {
    ...route.params,
    type: componentType.value
  }
})

// ============================================================================
// ЗАГРУЗКА КОМПОНЕНТА
// ============================================================================

async function loadComponent() {
  try {
    hasError.value = false
    errorMessage.value = ''
    dynamicComponent.value = null
    
    const type = componentType.value
    const loader = loadTypeComponent(type)
    
    if (loader) {
      const loadedComponent = await loader()
      if (loadedComponent && loadedComponent.default) {
        dynamicComponent.value = markRaw(loadedComponent.default)
      } else {
        throw new Error(`Компонент не имеет default export: ${type}`)
      }
    } else {
      throw new Error(`Не найден загрузчик для типа: ${type}`)
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки динамического компонента:', error)
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'Неизвестная ошибка загрузки'
    
    // Fallback на ErrorComponent
    dynamicComponent.value = ErrorComponent
  }
}

// ============================================================================
// WATCHERS
// ============================================================================

// Перезагружаем компонент при изменении типа
watchEffect(() => {
  loadComponent()
})
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666;
}
</style>
