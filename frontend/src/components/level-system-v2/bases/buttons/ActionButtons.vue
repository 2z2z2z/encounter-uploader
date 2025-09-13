<template>
  <div class="action-buttons flex flex-wrap gap-2">
    <!-- Динамические экшн-кнопки на основе конфига (БЕЗ хардкода типов!) -->
    <template v-for="button in actionButtons" :key="button.id">
      <!-- Сама кнопка -->
      <Button
        :label="button.label"
        :severity="button.variant || 'primary'"
        class="h-10 px-4 text-nowrap max-xs:w-full"
        @click="handleUpload(button.id)"
      />
      
      <!-- Опция БМП только для кнопки uploadSectors с соответствующей настройкой -->
      <div 
        v-if="button.id === 'uploadSectors' && button.options?.combineSectors" 
        class="flex items-center"
      >
        <Checkbox
          v-model="combineSectors"
          :id="`combine-sectors-${button.id}`"
          :binary="true"
          size="large"
        />
        <label 
          :for="`combine-sectors-${button.id}`" 
          class="ml-2 text-sm cursor-pointer"
        >
          Объединить сектора (БМП)
        </label>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент экшн-кнопок (правая часть футера)
 * 
 * Кнопки и их видимость определяются через config.buttons.action
 * Опция БМП настраивается через buttonConfig.options.combineSectors
 */

import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { useConfirm } from 'primevue/useconfirm'
import { useLevelV2Store } from '../../store'
import { getLevelTypeConfig } from '../../configs'
import { useLevelPayloads } from '../../composables/useLevelPayloads'
import type { ButtonId } from '../../types'

const store = useLevelV2Store()
const confirm = useConfirm()
const { uploadTask, uploadSectors, uploadBonuses } = useLevelPayloads()

const levelConfig = computed(() => {
  return getLevelTypeConfig(store.levelType)
})

const actionButtons = computed(() => {
  return levelConfig.value?.buttons?.action || []
})

// Состояние чекбокса БМП
const combineSectors = ref(false)

/**
 * Универсальный хэндлер загрузки (интеграция с useLevelPayloads)
 */
const handleUpload = async (buttonId: ButtonId): Promise<void> => {
  try {
    const confirmed = await showUploadConfirmation(buttonId)
    if (!confirmed) return

    switch (buttonId) {
      case 'uploadTask':
        await uploadTask()
        break
        
      case 'uploadSectors':
        await uploadSectors(combineSectors.value)
        break
        
      case 'uploadBonuses':
        await uploadBonuses()
        break
        
      default:
        console.warn(`[ActionButtons] Неизвестный buttonId: ${buttonId}`)
        break
    }

  } catch (err: unknown) {
    console.error(`[ActionButtons] Error in ${buttonId}:`, err)
  }
}

/**
 * Показывает диалог подтверждения загрузки
 */
const showUploadConfirmation = (buttonId: ButtonId): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const action = getActionLabel(buttonId)
    confirm.require({
      message: `Во время заливки НЕ переключайтесь на другие вкладки браузера и не сворачивайте его.\n\nПродолжить ${action.toLowerCase()}?`,
      header: `Подтверждение: ${action}`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Отмена',
      rejectClass: 'p-button-outlined',
      acceptLabel: 'Продолжить',
      accept: () => resolve(true),
      reject: () => resolve(false)
    })
  })
}

/**
 * Получает человекочитаемое название действия
 */
const getActionLabel = (buttonId: ButtonId): string => {
  const button = actionButtons.value.find(btn => btn.id === buttonId)
  return button?.label || buttonId
}
</script>
