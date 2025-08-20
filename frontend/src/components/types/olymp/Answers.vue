<template>
  <div class="my-8">
    <DataTable :value="store.answers">
      <Column field="number" header="#"></Column>
      <Column header="Ответы">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <div
              v-for="(_, idx) in data.variants"
              :key="idx"
              class="flex items-center gap-1"
            >
              <InputText
                v-model="data.variants[idx]"
                placeholder="ответ"
                size="small"
              />
              <Button
                v-if="idx === data.variants.length - 1 && idx < 9"
                @click="addVariant(data)"
                icon="pi pi-plus"
                severity="success"
                size="small"
                variant="outlined"
              />
              <Button
                v-if="idx > 0"
                @click="removeVariant(data, idx)"
                icon="pi pi-minus"
                severity="danger"
                size="small"
                variant="outlined"
              />
            </div>
          </div>
        </template>
      </Column>
      <Column header="Сектор" style="width: 4rem; text-align: center">
        <template #body="{ data }">
          <Checkbox
            v-model="data.inSector"
            @change="markCustom"
            binary
          />
        </template>
      </Column>
      <Column header="Бонус" style="width: 4rem; text-align: center">
        <template #body="{ data }">
          <Checkbox v-model="data.inBonus" binary />
        </template>
      </Column>
      <Column header="Бонусное время">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <InputNumber
              v-model="data.bonusTime.hours"
              :min="0"
              :step="1"
              suffix=" ч"
              size="small"
              class="z-w-3"
            />
            <InputNumber
              v-model="data.bonusTime.minutes"
              :min="0"
              suffix=" м"
              size="small"
              class="z-w-3"
            />
            <InputNumber
              v-model="data.bonusTime.seconds"
              :min="0"
              suffix=" с"
              size="small"
              class="z-w-3"
            />
            <label class="flex items-center gap-1 ml-2">
              <Checkbox
                v-model="data.bonusTime.negative"
                binary
              />
              <span class="text-gray-500">отриц.</span>
            </label>
          </div>
        </template>
      </Column>
      <Column header="Закрытый сектор">
        <template #body="{ data }">
          <InputText
            v-model="data.closedText"
            placeholder="Текст или картинка"
            size="small"
          />
        </template>
      </Column>
      <Column header="Открытый сектор">
        <template #body="{ data }">
          <InputText
            v-model="data.displayText"
            placeholder="Отображение ответа"
            size="small"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useUploadStore } from '../../../store'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const store = useUploadStore()

function addVariant(row: { variants: string[] }) {
  if (row.variants.length < 10) row.variants.push('')
}
function removeVariant(row: { variants: string[] }, idx: number) {
  if (row.variants.length > 1) row.variants.splice(idx, 1)
}
// при ручном клике «Сектор» — принудительно кастом
function markCustom() {
  ;(store.config as any).sectorMode = 'custom'
}
</script>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({})
</script>


