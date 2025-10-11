<template>
  <div class="flex-1 min-w-[240px]">
    <FloatLabel variant="off">
      <InputText
        id="closedPicName"
        v-model="localClosedPicName"
        placeholder="Закрытые картинки"
        fluid
      />
      <label for="closedPicName">Закрытые картинки</label>
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

// Локальное значение для ввода названия закрытых картинок
const localClosedPicName = ref<string>('')

/**
 * Автоматическое применение названия закрытых картинок ко всем ответам в активном табе
 */
watch(localClosedPicName, (name) => {
  const answers = store.activeTab?.answers
  if (!answers) return

  // Применяем название ко всем ответам, заменяя '&' на номер ответа
  answers.forEach((answer: Answer) => {
    if (!answer.closedPic) {
      answer.closedPic = []
    }
    // Если массив пустой, создаем один элемент
    if (answer.closedPic.length === 0) {
      answer.closedPic.push((name || '').replace(/&/g, String(answer.number)))
    } else {
      // Заполняем ВСЕ существующие элементы массива
      for (let i = 0; i < answer.closedPic.length; i++) {
        answer.closedPic[i] = (name || '').replace(/&/g, String(answer.number))
      }
    }
  })
})

/**
 * Инициализация компонента
 */
onMounted(() => {
  localClosedPicName.value = ''
})
</script>
