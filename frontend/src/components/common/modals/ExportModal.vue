<template>
  <BaseModal
    v-model="visible"
    header="Экспортировать данные"
    width="30vw"
  >
    <div class="export-options">
      <p class="mb-4">Выберите формат экспорта:</p>
      
      <div class="flex gap-4 justify-center">
        <BaseButton
          variant="primary"
          @click="handleExport('json')"
          :loading="exporting === 'json'"
        >
          <i class="pi pi-file mr-2"></i>
          JSON
        </BaseButton>
        
        <BaseButton
          variant="primary"
          @click="handleExport('csv')"
          :loading="exporting === 'csv'"
        >
          <i class="pi pi-file-excel mr-2"></i>
          CSV
        </BaseButton>
      </div>
    </div>
    
    <template #footer>
      <BaseButton variant="secondary" @click="visible = false">
        Отмена
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'export': [format: 'json' | 'csv']
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const exporting = ref<'json' | 'csv' | null>(null)

async function handleExport(format: 'json' | 'csv') {
  exporting.value = format
  emit('export', format)
  
  // Даем время на завершение экспорта
  globalThis.setTimeout(() => {
    exporting.value = null
    visible.value = false
  }, 500)
}
</script>

<style scoped>
.export-options {
  padding: 1rem;
}
</style>
