<template>
  <div class="overflow-x-auto my-8">
    <table class="min-w-full table-fixed border-collapse text-sm">
      <colgroup>
        <col class="w-8" />
        <col class="w-1/4" />
        <col class="w-20" />
        <col class="w-20" />
        <col class="w-32" />
        <col class="w-1/6" />
        <col />
      </colgroup>
      <thead class="bg-gray-50">
        <tr>
          <th class="p-2 text-left">#</th>
          <th class="p-2 text-left">Ответы</th>
          <th class="p-2 text-center">Сектор</th>
          <th class="p-2 text-center">Бонус</th>
          <th class="p-2 text-left">Бонусное время</th>
          <th class="p-2 text-left">Закрытый сектор</th>
          <th class="p-2 text-left">Открытый сектор</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in answers"
          :key="row.number"
          class="border-t border-gray-200"
        >
          <td class="p-2">{{ row.number }}</td>
          <td class="p-2">
            <div class="flex flex-col gap-1">
              <div
                v-for="(_, idx) in row.variants"
                :key="idx"
                class="flex items-center gap-1"
              >
                <input
                  v-model="row.variants[idx]"
                  placeholder="ответ"
                  class="form-input h-8 min-w-[150px] flex-1"
                  @input="onUpdate"
                />
                <button
                  v-if="idx === row.variants.length - 1 && idx < 9"
                  @click="addVariant(row)"
                  type="button"
                  class="h-8 w-8 rounded-md bg-green-500 text-white cursor-pointer"
                >
                  ＋
                </button>
                <button
                  v-if="idx > 0"
                  @click="removeVariant(row, idx)"
                  type="button"
                  class="h-8 w-8 rounded-md bg-red-500 text-white cursor-pointer"
                >
                  −
                </button>
              </div>
            </div>
          </td>
          <td class="p-2 text-center">
            <input
              type="checkbox"
              v-model="row.inSector"
              @change="onUpdate"
              class="cursor-pointer"
            />
          </td>
          <td class="p-2 text-center">
            <input type="checkbox" v-model="row.inBonus" class="cursor-pointer" />
          </td>
          <td class="p-2">
            <div class="flex items-center gap-1">
              <input
                type="number"
                min="0"
                v-model.number="row.bonusTime.hours"
                placeholder="ч"
                class="form-input h-8 w-16 text-center"
              />
              <input
                type="number"
                min="0"
                v-model.number="row.bonusTime.minutes"
                placeholder="м"
                class="form-input h-8 w-16 text-center"
              />
              <input
                type="number"
                min="0"
                v-model.number="row.bonusTime.seconds"
                placeholder="с"
                class="form-input h-8 w-16 text-center"
              />
              <label class="flex items-center gap-1 ml-2">
                <input
                  type="checkbox"
                  v-model="row.bonusTime.negative"
                  class="cursor-pointer"
                />
                <span class="text-gray-500">–</span>
              </label>
            </div>
          </td>
          <td class="p-2">
            <input
              v-model="row.closedText"
              placeholder="Текст или картинка"
              class="form-input h-8 w-full min-w-[200px]"
            />
          </td>
          <td class="p-2">
            <input
              v-model="row.displayText"
              placeholder="Отображение ответа"
              class="form-input h-8 w-full min-w-[200px]"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Answer } from './types'

// Props
defineProps<{
  answers: Answer[]
}>()

// Emits
const emit = defineEmits<{
  update: []
}>()

// Methods
function addVariant(row: Answer) {
  if (row.variants.length < 10) {
    row.variants.push('')
  }
}

function removeVariant(row: Answer, idx: number) {
  if (row.variants.length > 1) {
    row.variants.splice(idx, 1)
  }
}

function onUpdate() {
  emit('update')
}
</script>