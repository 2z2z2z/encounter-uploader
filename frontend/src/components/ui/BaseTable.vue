<template>
  <DataTable
    :value="data"
    :paginator="paginator"
    :rows="rows"
    :rows-per-page-options="rowsPerPageOptions"
    :sort-mode="sortMode"
    :removable-sort="removableSort"
    :loading="loading"
    :scrollable="scrollable"
    :scroll-height="scrollHeight"
    :table-style="tableStyle"
    :class="tableClass"
    @row-click="$emit('row-click', $event)"
    @row-select="$emit('row-select', $event)"
    @row-unselect="$emit('row-unselect', $event)"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>

    <template v-if="$slots.empty" #empty>
      <slot name="empty" />
    </template>
    <template v-else #empty>
      <div class="text-center py-4 text-gray-500">
        Нет данных для отображения
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable'
import { computed } from 'vue'

interface Props {
  data: any[]
  paginator?: boolean
  rows?: number
  rowsPerPageOptions?: number[]
  sortMode?: 'single' | 'multiple'
  removableSort?: boolean
  loading?: boolean
  scrollable?: boolean
  scrollHeight?: string
  tableStyle?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  paginator: false,
  rows: 10,
  rowsPerPageOptions: () => [5, 10, 20, 50],
  sortMode: 'single',
  removableSort: true,
  loading: false,
  scrollable: false,
  scrollHeight: 'flex',
  tableStyle: 'min-width: 50rem',
  class: ''
})

defineEmits<{
  'row-click': [event: any]
  'row-select': [event: any]
  'row-unselect': [event: any]
}>()

const tableClass = computed(() => {
  const classes = [props.class]
  return classes.join(' ')
})
</script>
