<template>
  <BaseModal
    :model-value="modelValue"
    header="Внесённые корректировки"
    width="min(1100px, 95vw)"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-4">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Участник или комментарий"
              aria-label="Поиск по участнику или комментарию"
              size="small"
              class="w-64"
            />
          </IconField>
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="isOnlyManual"
              input-id="onlyManualCorrections"
              :binary="true"
            />
            <label for="onlyManualCorrections" class="text-sm cursor-pointer">
              Только добавленные вручную
            </label>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1">
          <Button
            as="a"
            :href="enListUrl"
            target="_blank"
            rel="noopener"
            label="Открыть на EN"
            icon="pi pi-external-link"
            icon-pos="right"
            link
            size="small"
          />
          <Button
            as="a"
            :href="enSummaryUrl"
            target="_blank"
            rel="noopener"
            label="Сводка результатов"
            icon="pi pi-external-link"
            icon-pos="right"
            link
            size="small"
          />
          <Button
            label="Обновить"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            :loading="correctionsStore.isListLoading"
            @click="loadList"
          />
        </div>
      </div>

      <Message v-if="correctionsStore.listError" severity="error" :closable="false">
        {{ correctionsStore.listError }}
      </Message>

      <DataTable
        :value="visibleCorrections"
        :loading="correctionsStore.isListLoading"
        size="small"
        striped-rows
        scrollable
        scroll-height="60vh"
        data-key="id"
        table-class="w-full"
      >
        <template #empty>
          <span class="text-surface-500">{{ emptyMessage }}</span>
        </template>
        <Column header="Дата" body-class="whitespace-nowrap text-surface-500 tabular-nums">
          <template #body="{ data }">
            <div>{{ splitDateTime(data.dateTime).date }}</div>
            <div class="text-xs">{{ splitDateTime(data.dateTime).time }}</div>
          </template>
        </Column>
        <Column field="participant" header="Участник" body-class="whitespace-nowrap font-medium" />
        <Column header="Уровень" body-class="whitespace-nowrap">
          <template #body="{ data }">
            {{ formatLevel(data.level) }}
          </template>
        </Column>
        <Column header="Тип" body-class="whitespace-nowrap">
          <template #body="{ data }">
            <Tag
              :value="CORRECTION_TYPES[data.type as CorrectionType].label"
              :severity="data.type === 'penalty' ? 'danger' : 'success'"
            />
          </template>
        </Column>
        <Column header="Время" body-class="whitespace-nowrap tabular-nums">
          <template #body="{ data }">
            {{ formatSecondsToString(data.seconds) }}
          </template>
        </Column>
        <Column v-if="!isOnlyManual" field="reason" header="Причина" body-class="text-surface-500 min-w-40" />
        <Column header="Комментарий" body-class="min-w-64">
          <template #body="{ data }">
            <span class="line-clamp-3 wrap-anywhere" :title="data.comment">{{ data.comment }}</span>
          </template>
        </Column>
      </DataTable>

      <div v-if="correctionsStore.existing.length > 0" class="text-sm text-surface-500">
        Показано {{ visibleCorrections.length }} из {{ correctionsStore.existing.length }}:
        бонусов {{ countByType.bonus }}, штрафов {{ countByType.penalty }}
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
/**
 * Список корректировок, уже внесённых в игру на EN.
 * Комментарии выводятся текстом: EN хранит их как HTML без экранирования
 */
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useLevelStore } from '@/store/levels'
import { useCorrectionsStore } from '@/store/corrections'
import { ALL_LEVELS_OPTION, CORRECTION_TYPES } from '@/entities/level/constants'
import { formatSecondsToString } from '@/utils/time-parser'
import type { CorrectionType } from '@/entities/level/types'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const store = useLevelStore()
const correctionsStore = useCorrectionsStore()
const isOnlyManual = ref(true)
const searchQuery = ref('')

const enBaseUrl = computed(() => `https://${store.domain}.en.cx`)
const enListUrl = computed(() => `${enBaseUrl.value}/GameBonusPenaltyTime.aspx?gid=${store.gameId}`)
const enSummaryUrl = computed(() => `${enBaseUrl.value}/Administration/GameCorrection.aspx?gid=${store.gameId}`)

const visibleCorrections = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return correctionsStore.existing.filter(item => {
    if (isOnlyManual.value && !item.isManual) return false
    if (!query) return true
    return item.participant.toLowerCase().includes(query) || item.comment.toLowerCase().includes(query)
  })
})

const countByType = computed<Record<CorrectionType, number>>(() => {
  return visibleCorrections.value.reduce(
    (counts, item) => ({ ...counts, [item.type]: counts[item.type] + 1 }),
    { bonus: 0, penalty: 0 }
  )
})

const emptyMessage = computed(() => {
  if (correctionsStore.isListLoading) return 'Загрузка...'
  return correctionsStore.existing.length > 0 ? 'Ничего не найдено' : 'Корректировок нет'
})

/**
 * Дата и время EN ("25.09.2026 20:45:46") двумя строками, чтобы колонка была узкой
 */
const splitDateTime = (dateTime: string): { date: string, time: string } => {
  const [date = '', ...time] = dateTime.split(' ')
  return { date, time: time.join(' ') }
}

/**
 * Номер уровня или "Все", как в таблице корректировок
 */
const formatLevel = (level: string): string => level || ALL_LEVELS_OPTION.label

/**
 * Загружает актуальный список корректировок игры
 */
const loadList = async (): Promise<void> => {
  try {
    await correctionsStore.loadExisting({ domain: store.domain, gameId: store.gameId })
  } catch (err: unknown) {
    console.error('[CorrectionsListModal] Failed to load corrections:', err)
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    void loadList()
  }
})
</script>
