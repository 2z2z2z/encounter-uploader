<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="openPicName"
        v-model="localOpenPicName"
        placeholder="Открытые картинки"
        fluid
      />
      <label for="openPicName">Открытые картинки</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { useLevelStore } from '@/store/levels'
import type { Answer } from '@/entities/level/types'

// Store для работы с данными
const store = useLevelStore()

// Локальное значение для ввода названия открытых картинок
const localOpenPicName = ref<string>('')

/**
 * Автоматическое применение названия открытых картинок ко всем ответам в активном табе
 */
watch(localOpenPicName, (name) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем название ко всем ответам, заменяя '&' на номер ответа
  answers.forEach((answer: Answer) => {
    if (!answer.openPic) {
      answer.openPic = []
    }
    // Если массив пустой, создаем один элемент
    if (answer.openPic.length === 0) {
      answer.openPic.push((name || '').replace(/&/g, String(answer.number)))
    } else {
      // Заполняем ВСЕ существующие элементы массива
      for (let i = 0; i < answer.openPic.length; i++) {
        answer.openPic[i] = (name || '').replace(/&/g, String(answer.number))
      }
    }
  })
})

/**
 * Инициализация компонента
 */
onMounted(() => {
  localOpenPicName.value = ''
})
</script>
