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
 * ✅ ПРАВИЛЬНО: Работает через getLevelTypeConfig() БЕЗ хардкода типов
 * ❌ ЗАПРЕЩЕНО: Хардкод store.levelType === 'olymp' или 'type100500'
 * 
 * Кнопки и их видимость определяются ТОЛЬКО через config.buttons.action
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

// Store, конфигурация и композаблы
const store = useLevelV2Store()
const confirm = useConfirm()
const { uploadTask, uploadSectors, uploadBonuses } = useLevelPayloads()

// ✅ Правильно: получение конфига через универсальную функцию
const levelConfig = computed(() => {
  return getLevelTypeConfig(store.levelType)
})

// ✅ Правильно: кнопки определяются ТОЛЬКО через конфиг
const actionButtons = computed(() => {
  return levelConfig.value?.buttons?.action || []
})

// Состояние чекбокса БМП (реактивная переменная)
const combineSectors = ref(false)

// Удалена неиспользуемая переменная showCombineSectors
// Опция БМП проверяется прямо в template через button.options?.combineSectors

/**
 * Универсальный хэндлер загрузки (интеграция с useLevelPayloads)
 */
const handleUpload = async (buttonId: ButtonId): Promise<void> => {
  try {
    // Подтверждающий диалог
    const confirmed = await showUploadConfirmation(buttonId)
    if (!confirmed) return

    // Вызов соответствующей функции загрузки
    switch (buttonId) {
      case 'uploadTask':
        await uploadTask()
        break
        
      case 'uploadSectors':
        // Передаем параметр БМП для секторов
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
    // Ошибки уже обрабатываются в функциях загрузки
    // Здесь просто логируем для отладки
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
