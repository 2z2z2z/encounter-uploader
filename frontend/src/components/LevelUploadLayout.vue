<template>
  <div :class="containerClass">
    <h1 v-if="showTitle" class="text-2xl font-semibold text-center">{{ title }}</h1>

    <p v-if="showMeta" class="text-sm text-gray-500 text-center mb-0">
      автор: <strong>{{ authStore.username }}</strong>,
      домен: <strong>{{ store.domain }}</strong>,
      игра: <strong>{{ store.gameId }}</strong>,
      уровень: <strong>{{ store.levelId }}</strong>
    </p>

    <slot name="error"></slot>

    <div class="flex flex-wrap justify-between items-end gap-4 mt-8 mb-4">
      <slot name="controls"></slot>
    </div>

    <div class="flex flex-wrap justify-end gap-2 mb-4">
      <slot name="topActions"></slot>
    </div>

    <slot name="table"></slot>

    <div class="flex flex-wrap justify-between gap-2 mt-8">
      <div class="flex flex-wrap gap-2" v-if="showBack">
        <button @click="$emit('back')" class="form-button bg-gray-400 hover:bg-gray-500 h-10 px-4">Назад</button>
      </div>
      <div class="flex flex-wrap gap-2 px-4" v-if="showCommonActions">
        <button @click="$emit('clear')" type="button" class="form-button h-10 px-4">Очистить</button>
        <button @click="$emit('export')" type="button" class="form-button h-10 px-4">Экспорт</button>
        <label class="form-button h-10 px-4 cursor-pointer">
          Импорт
          <input type="file" @change="$emit('importChange', $event)" accept=".json,.csv" class="hidden" />
        </label>
        <button v-if="showPreview" @click="$emit('preview')" class="form-button h-10 px-4">Предпросмотр</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <slot name="rightActions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { useUploadStore } from '../store'
import { useAuthStore } from '../store/auth'

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

const containerClass = computed(() => props.containerClass || '')
const showPreview = !!props.showPreview
const showTitle = props.showTitle !== false
const showMeta = props.showMeta !== false
const showBack = props.showBack !== false
const showCommonActions = props.showCommonActions !== false
</script>

<script lang="ts">
export default {}
</script>


