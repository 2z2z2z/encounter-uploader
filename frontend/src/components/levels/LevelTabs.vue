<template>
  <div v-if="shouldShowTabs" class="mb-4" data-tour="level-tabs">
    <Tabs
      :value="store.activeTabIndex"
      @update:value="handleTabChange"
      class="level-tabs"
    >
      <div class="flex items-center gap-3 pb-0 flex-wrap">
        <TabList class="flex-1">
          <Tab
            v-for="(tab, index) in store.tabs"
            :key="tab.id"
            :value="index"
            :disabled="false"
          >
            {{ tab.name }}
          </Tab>
        </TabList>

        <div v-if="canManageTabs" class="flex items-center gap-2 pb-2 max-xs:w-full max-xs:justify-end">
          <Button
            icon="pi pi-plus"
            size="small"
            text
            rounded
            @click="addTab"
            :disabled="!canAddTab"
            v-tooltip.top="'Добавить таб'"
          />
          <Button
            icon="pi pi-copy"
            size="small"
            text
            rounded
            severity="secondary"
            @click="copyCurrentTab"
            :disabled="!canCopyTab"
            v-tooltip.top="'Копировать таб'"
          />
          <Button
            icon="pi pi-minus"
            size="small"
            text
            rounded
            severity="danger"
            @click="removeCurrentTab"
            :disabled="!canRemoveTab"
            v-tooltip.top="'Удалить таб'"
          />
          <InputText
            v-if="store.tabs.length > 0"
            v-model="currentTabName"
            @blur="updateTabName"
            @keyup.enter="updateTabName"
            placeholder="Название таба"
            maxlength="20"
            size="small"
            class="w-32"
          />
        </div>
      </div>

      <TabPanels>
        <TabPanel
          v-for="(tab, index) in store.tabs"
          :key="tab.id"
          :value="index"
        >
          <div class="pt-3">
            <slot :tab="tab" :tab-index="index" />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tooltip from 'primevue/tooltip'
import { useLevelStore } from '@/store/levels'
import { getLevelTypeConfig } from '@/entities/level/configs'

const vTooltip = Tooltip

const store = useLevelStore()

// Локальное состояние для редактирования имени текущего таба
const currentTabName = ref('')

// Получаем конфиг текущего типа уровня
const currentConfig = computed(() => {
  if (!store.levelType) return null
  return getLevelTypeConfig(store.levelType)
})

// Определяем нужно ли показывать табы
const shouldShowTabs = computed(() => {
  if (!currentConfig.value) return false
  return currentConfig.value.isMultiBlocks
})

// Можно ли управлять табами (добавлять/удалять)
const canManageTabs = computed(() => {
  return shouldShowTabs.value && currentConfig.value?.isMultiBlocks === true
})

// Можно ли добавить новый таб (лимит 10)
const canAddTab = computed(() => {
  return store.tabs.length < 10
})

// Можно ли удалить текущий таб (минимум 1)
const canRemoveTab = computed(() => {
  return store.tabs.length > 1
})

// Можно ли копировать текущий таб (есть активный таб и не превышен лимит)
const canCopyTab = computed(() => {
  return store.activeTab && store.tabs.length < 10
})

// Синхронизация имени текущего таба с локальным состоянием
watch(() => store.activeTab?.name, (newName) => {
  if (newName !== undefined) {
    currentTabName.value = newName
  }
}, { immediate: true })

/**
 * Обработка переключения между табами
 */
const handleTabChange = (value: string | number) => {
  const index = typeof value === 'string' ? parseInt(value, 10) : value
  store.setActiveTab(index)
}

/**
 * Добавление нового таба
 */
const addTab = () => {
  if (!canAddTab.value) return
  
  const newTabIndex = store.tabs.length + 1
  const tabName = `Блок ${newTabIndex}`
  
  store.addTab(tabName)
}

/**
 * Удаление текущего таба
 */
const removeCurrentTab = () => {
  if (!canRemoveTab.value) return

  const currentIndex = store.activeTabIndex
  store.removeTab(currentIndex)
}

/**
 * Копирование текущего таба
 */
const copyCurrentTab = () => {
  if (!canCopyTab.value || !store.activeTab) return

  const sourceTab = store.activeTab
  const copyName = `${sourceTab.name} (копия)`

  // Создаем новый ID для таба
  const newTabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  // Копируем все ответы с новыми ID
  const copiedAnswers = sourceTab.answers.map((answer, index) => ({
    ...answer,
    id: `answer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${index}`
  }))

  // Создаем копию таба
  const newTab = {
    id: newTabId,
    name: copyName.slice(0, 20), // Ограничиваем длину имени
    answers: copiedAnswers
  }

  // Добавляем новый таб в store
  store.tabs.push(newTab)
  store.setActiveTab(store.tabs.length - 1)
  store.markDirty()
}

/**
 * Обновление имени текущего таба
 */
const updateTabName = () => {
  const newName = currentTabName.value.trim()
  if (newName.length === 0 || newName.length > 20) {
    // Возвращаем предыдущее значение если некорректное
    currentTabName.value = store.activeTab?.name || ''
    return
  }

  if (newName !== store.activeTab?.name) {
    store.renameTab(store.activeTabIndex, newName)
  }
}
</script>

<style scoped>
.level-tabs :deep(.p-tab) {
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
}

.level-tabs :deep(.p-tab:hover) {
  background-color: rgba(99, 102, 241, 0.05);
}

.level-tabs :deep(.p-tabpanels) {
  padding: 0;
}

.level-tabs :deep(.p-tabpanel) {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>


