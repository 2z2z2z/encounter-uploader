/**
 * Массовая правка строк активного таба из панели управления
 */

import { ref, watch, type Ref } from 'vue'
import { useLevelStore } from '@/store/levels'
import { applyToEditableRows } from '@/utils/corrections'
import type { Answer } from '@/entities/level/types'

interface BulkRowEdit<T> {
  value: Ref<T>
  apply: (next: T) => void
}

/**
 * Значение контрола и его применение ко всем неотправленным строкам активного таба.
 * Строки меняются только на ввод пользователя (apply): сброс значения при смене таба их не трогает.
 * null означает "не менять"
 *
 * @param createInitial - начальное значение (и значение после смены таба)
 * @param write - запись значения в строку
 */
export function useBulkRowEdit<T>(createInitial: () => T, write: (row: Answer, value: NonNullable<T>) => void): BulkRowEdit<T> {
  const store = useLevelStore()
  const value = ref(createInitial()) as Ref<T>

  const apply = (next: T): void => {
    value.value = next
    if (next === null || next === undefined) return
    applyToEditableRows(store.activeTab?.answers, row => write(row, next))
  }

  watch(() => store.activeTabIndex, () => {
    value.value = createInitial()
  })

  return { value, apply }
}
