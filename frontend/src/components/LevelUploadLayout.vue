<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 p-4">
    <div class="w-full max-w-[1920px]">
      <Card>
        <template #title v-if="showTitle">{{ title }}</template>
        <template #subtitle v-if="showMeta">автор: <strong>{{ authStore.username }}</strong>,
            домен: <strong>{{ store.domain }}</strong>,
            игра: <strong>{{ store.gameId }}</strong>,
            уровень: <strong>{{ store.levelId }}</strong></template>
        <template #content>
          <slot name="error"></slot>

          <div class="flex flex-wrap justify-between items-end gap-x-8 gap-y-10 mt-8 mb-6 rounded-2xl bg-violet-50 py-10 px-5">
            <slot name="controls"></slot>
          </div>

          <div class="flex flex-wrap justify-end gap-2 mb-4">
            <slot name="topActions"></slot>
          </div>

          <slot name="table"></slot>

          <div class="flex flex-wrap justify-between gap-2 mt-8">
            <div class="flex flex-wrap gap-2" v-if="showBack">
              <Button 
                @click="$emit('back')" 
                label="Назад"
                severity="secondary"
                class="h-10 px-4"
              />
            </div>
            <div class="flex flex-wrap gap-2 px-4" v-if="showCommonActions">
              <Button 
                @click="$emit('clear')" 
                label="Очистить"
                severity="secondary"
                class="h-10 px-4"
                icon="pi pi-trash"
              />
              <Button 
                @click="$emit('export')" 
                label="Экспорт"
                severity="secondary"
                class="h-10 px-4"
                icon="pi pi-file-export"
              />
              <Button 
                @click="triggerFileInput" 
                label="Импорт"
                severity="secondary"
                class="h-10 px-4"
                icon="pi pi-file-import"
              />
              <input 
                ref="fileInputRef" 
                type="file" 
                @change="$emit('importChange', $event)" 
                accept=".json,.csv" 
                class="hidden" 
              />
              <Button 
                v-if="showPreview" 
                @click="$emit('preview')" 
                label="Предпросмотр"
                severity="secondary"
                class="h-10 px-4"
                icon="pi pi-eye"
              />
            </div>
            <div class="flex flex-wrap gap-2">
              <slot name="rightActions"></slot>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUploadStore } from '../store'
import { useAuthStore } from '../store/auth'
import Card from 'primevue/card'
import Button from 'primevue/button'

const props = defineProps<{ 
  title: string;
  showPreview?: boolean;
  containerClass?: string;
  showTitle?: boolean;
  showMeta?: boolean;
  showBack?: boolean;
  showCommonActions?: boolean;
}>()

const store = useUploadStore()
const authStore = useAuthStore()
const fileInputRef = ref<HTMLInputElement>()

const showPreview = !!props.showPreview
const showTitle = props.showTitle !== false
const showMeta = props.showMeta !== false
const showBack = props.showBack !== false
const showCommonActions = props.showCommonActions !== false

function triggerFileInput() {
  fileInputRef.value?.click()
}
</script>

<script lang="ts">
export default {}
</script>


