<template>
  <div class="flex flex-wrap justify-between gap-2 mt-8">
    <div class="flex flex-wrap gap-2">
      <button v-if="showBack" @click="$emit('back')" class="form-button bg-gray-400 hover:bg-gray-500 h-10 px-4">Назад</button>
    </div>
    <div class="flex flex-wrap gap-2 px-4">
      <button v-if="showClear" @click="$emit('clear')" type="button" class="form-button h-10 px-4">Очистить</button>
      <button v-if="showExport" @click="$emit('export')" type="button" class="form-button h-10 px-4">Экспорт</button>
      <label v-if="showImport" class="form-button h-10 px-4 cursor-pointer">
        Импорт
        <input ref="fileInput" type="file" @change="$emit('import', $event)" :accept="importAccept" class="hidden" />
      </label>
      <button v-if="showPreview" @click="$emit('preview')" class="form-button h-10 px-4">Предпросмотр</button>
    </div>
    <div class="flex flex-wrap gap-2 items-center">
      <label v-if="supportCombineSectors" class="flex items-center gap-1">
        <input type="checkbox" :checked="combineSectors" @change="$emit('update:combineSectors', ($event && (/** @type {any} */ ($event.target)).checked) )" class="cursor-pointer" />
        <span>Объединить секторы (БМП)</span>
      </label>
      <button v-if="showSendTask" @click="$emit('sendTask')" type="button" class="form-button h-10 px-4">Залить задание</button>
      <button v-if="showSendSectors" @click="$emit('sendSectors')" type="button" class="form-button h-10 px-4">Залить секторы</button>
      <button v-if="showSendBonuses" @click="$emit('sendBonuses')" type="button" class="form-button h-10 px-4">Залить бонусы</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  showBack?: boolean
  showClear?: boolean
  showExport?: boolean
  showImport?: boolean
  importAccept?: string
  showPreview?: boolean
  showSendTask?: boolean
  showSendSectors?: boolean
  showSendBonuses?: boolean
  supportCombineSectors?: boolean
  combineSectors?: boolean
}>(), {
  importAccept: '.json,.csv',
  showBack: false,
  showClear: false,
  showExport: false,
  showImport: false,
  showPreview: false,
  showSendTask: false,
  showSendSectors: false,
  showSendBonuses: false,
  supportCombineSectors: false,
  combineSectors: false,
})

defineEmits<{
  (e: 'back'): void
  (e: 'clear'): void
  (e: 'export'): void
  (e: 'import', ev: Event): void
  (e: 'preview'): void
  (e: 'sendTask'): void
  (e: 'sendSectors'): void
  (e: 'sendBonuses'): void
  (e: 'update:combineSectors', val: boolean): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
</script>

<script lang="ts">
export default {}
</script>


