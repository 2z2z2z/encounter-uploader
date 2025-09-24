<template>
  <div class="rounded-xl bg-violet-50 mb-4 overflow-hidden">
    <!-- Заголовок с кнопкой сворачивания -->
    <div class="flex items-center justify-between px-5 py-3" :class="{ 'border-b border-violet-100': !isCollapsed }">
      <h3 class="text-sm font-semibold text-violet-900">Панель управления</h3>
      <Button
        :icon="isCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
        text
        rounded
        size="small"
        @click="toggleCollapse"
        v-tooltip.left="isCollapsed ? 'Развернуть панель' : 'Свернуть панель'"
      />
    </div>

    <!-- Контент панели с transition -->
    <Transition name="collapse">
      <div v-if="!isCollapsed" class="flex flex-wrap justify-between items-end gap-x-6 gap-y-8 py-6 px-5">
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
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import Button from 'primevue/button'
import Tooltip from 'primevue/tooltip'
import { useLevelV2Store } from '../store'
import { getLevelTypeConfig } from '../configs'
import type { ControlId } from '../types'
import { controls } from '../bases/controls'

const vTooltip = Tooltip
const store = useLevelV2Store()

const isCollapsed = useLocalStorage('controlPanelCollapsed', false)

const toggleCollapse = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const levelConfig = computed(() => {
  return getLevelTypeConfig(store.levelType)
})

const activeControls = computed<ControlId[]>(() => {
  return levelConfig.value?.controls || []
})


// Получить компонент контрола по ID
const getControlComponent = (controlId: ControlId) => {
  return controls[controlId]
}
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
