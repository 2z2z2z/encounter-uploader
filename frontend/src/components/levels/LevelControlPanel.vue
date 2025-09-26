<template>
  <div
    class="rounded-xl bg-violet-50 mb-4 overflow-hidden"
    data-tour="control-panel"
  >
    <!-- Заголовок с кнопкой сворачивания -->
    <div class="flex items-center justify-between px-5 py-3" :class="{ 'border-b border-violet-100': !isCollapsed }">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-violet-900">Панель управления</h3>
        <i
          class="pi pi-info-circle text-xs text-violet-600 cursor-help"
          v-tooltip.top="'Инструменты для массового редактирования таблицы'"
        />
      </div>
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
      <div
        v-show="!isCollapsed"
        class="grid gap-x-6 gap-y-8 py-6 px-5 mt-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="controlId in activeControls"
          :key="controlId"
          class="min-w-0 text-nowrap"
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
import { useLevelStore } from '@/store/levels'
import { getLevelTypeConfig } from '@/entities/level/configs'
import type { ControlId } from '@/entities/level/types'
import { controls } from '@/components/ui/controls'

const vTooltip = Tooltip
const store = useLevelStore()

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
  margin-top: 0;
}
</style>
