<template>
  <BaseModal
    v-model="visible"
    header="Предпросмотр"
    width="80vw"
    :maximizable="true"
  >
    <div class="preview-container">
      <div v-if="showModeToggle" class="preview-controls mb-4">
        <BaseButton
          :variant="mode === 'closed' ? 'primary' : 'secondary'"
          @click="mode = 'closed'"
          class="mr-2"
        >
          Закрытая
        </BaseButton>
        <BaseButton
          :variant="mode === 'open' ? 'primary' : 'secondary'"
          @click="mode = 'open'"
        >
          Открытая
        </BaseButton>
      </div>
      
      <div class="preview-content" v-html="currentContent"></div>
    </div>
    
    <template #footer>
      <BaseButton variant="secondary" @click="visible = false">
        Закрыть
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface Props {
  modelValue: boolean
  content: string
  alternativeContent?: string
  showModeToggle?: boolean
  initialMode?: 'closed' | 'open'
}

const props = withDefaults(defineProps<Props>(), {
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
