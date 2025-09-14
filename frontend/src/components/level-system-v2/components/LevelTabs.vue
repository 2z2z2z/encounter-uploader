<template>
  <div v-if="shouldShowTabs" class="level-tabs-container">
    <Tabs
      :value="store.activeTabIndex"
      @update:value="handleTabChange"
      class="level-tabs"
    >
      <TabList>
        <Tab
          v-for="(tab, index) in store.tabs"
          :key="tab.id"
          :value="index"
          :disabled="false"
        >
          {{ tab.name }}
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel
          v-for="(tab, index) in store.tabs"
          :key="tab.id"
          :value="index"
        >
          <div class="tab-content">
            <!-- Содержимое таба рендерится родительским компонентом -->
            <slot :tab="tab" :tab-index="index" />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Управление табами для типов с множественными блоками -->
    <div v-if="canManageTabs" class="tab-controls">
      <Button
        icon="pi pi-plus"
        label="Добавить таб"
        size="small"
        outlined
        @click="addTab"
        :disabled="!canAddTab"
        class="tab-control-btn"
      />
      <Button
        icon="pi pi-minus"
        label="Удалить"
        size="small"
        outlined
        severity="danger"
        @click="removeCurrentTab"
        :disabled="!canRemoveTab"
        class="tab-control-btn"
      />
      <InputText
        v-if="store.tabs.length > 0"
        v-model="currentTabName"
        @blur="updateTabName"
        @keyup.enter="updateTabName"
        placeholder="Название таба"
        maxlength="20"
        class="tab-name-input"
      />
    </div>
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
import { useLevelV2Store } from '../store'
import { getLevelTypeConfig } from '../configs'

const store = useLevelV2Store()

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

// Синхронизация имени текущего таба с локальным состоянием
watch(() => store.activeTab?.name, (newName) => {
  if (newName !== undefined) {
    currentTabName.value = newName
  }
}, { immediate: true })

/**
 * Обработка переключения между табами
 */
const handleTabChange = (value: number) => {
  store.setActiveTab(value)
}

/**
 * Добавление нового таба
 */
const addTab = () => {
  if (!canAddTab.value) return
  
  const newTabIndex = store.tabs.length + 1
  const tabName = `Таб ${newTabIndex}`
  
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
.level-tabs-container {
  margin-bottom: 1rem;
}

.level-tabs :deep(.p-tabview-nav) {
  border-bottom: 1px solid #e5e7eb;
}

.level-tabs :deep(.p-tabview-header) {
  padding: 0.5rem 1rem;
}

.level-tabs :deep(.p-tabview-panels) {
  padding-top: 1rem;
}

.tab-content {
  min-height: 0;
}

.tab-controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
}

.tab-control-btn {
  font-size: 0.875rem;
}

.tab-name-input {
  font-size: 0.875rem;
  height: 2rem;
  width: 8rem;
}
</style>


