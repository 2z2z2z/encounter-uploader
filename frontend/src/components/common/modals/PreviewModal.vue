<template>
  <Dialog
    v-model:visible="visible"
    header="Предпросмотр"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    :maximizable="true"
    :breakpoints="{ '1199px': '95vw', '575px': '98vw' }"
    modal
  >
    <div class="preview-container">
      <!-- Показываем табы только если есть альтернативный контент -->
      <Tabs v-if="showModeToggle" v-model:value="mode" class="mb-4">
        <TabList>
          <Tab value="closed">Закрытая</Tab>
          <Tab value="open">Открытая</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="closed">
            <div class="preview-content" v-html="props.content"></div>
          </TabPanel>
          <TabPanel value="open">
            <div class="preview-content" v-html="currentContent"></div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <!-- Показываем только основной контент если переключение отключено -->
      <div v-else class="preview-content" v-html="props.content"></div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button label="Закрыть" severity="secondary" @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

interface Props {
  modelValue: boolean
  content: string
  alternativeContent?: string
  showModeToggle?: boolean
  initialMode?: 'closed' | 'open'
}

const props = withDefaults(defineProps<Props>(), {
  alternativeContent: '',
  showModeToggle: false,
  initialMode: 'closed'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const mode = ref<'closed' | 'open'>(props.initialMode)

const currentContent = computed(() => {
  if (props.showModeToggle && mode.value === 'open' && props.alternativeContent) {
    return props.alternativeContent
  }
  return props.content
})

watch(() => props.initialMode, (newMode) => {
  mode.value = newMode
})
</script>

<style scoped>
.preview-container {
  max-height: 70vh;
  overflow: auto;
}

.preview-content {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.25rem;
  min-height: 200px;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.preview-content :deep(td),
.preview-content :deep(th) {
  border: 1px solid #dee2e6;
  padding: 0.5rem;
}
</style>
