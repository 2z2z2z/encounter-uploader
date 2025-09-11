/**
 * Рендер-функции полей для DataTable колонок
 * Реализация для шагов 9-10: Answer, Sector, Bonus, BonusTime, ClosedSector, OpenSector
 */

import { h, type VNode } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber' 
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import type { Answer } from '../../types'
import { useLevelV2Store } from '../../store'

// Тип для функции рендеринга поля в DataTable
export type FieldRenderer = (data: { data: Answer, index: number }) => VNode

/**
 * Рендер поля Answer - варианты ответов с кнопками +/-
 */
export const renderAnswer: FieldRenderer = ({ data }) => {
  const addVariant = (answer: Answer): void => {
    if (answer.variants.length < 10) {
      answer.variants.push('')
    }
  }
  
  const removeVariant = (answer: Answer, index: number): void => {
    if (answer.variants.length > 1) {
      answer.variants.splice(index, 1)
    }
  }

  return h('div', { class: 'flex flex-col gap-1' }, 
    data.variants.map((variant, idx) => 
      h('div', { key: idx, class: 'flex items-center gap-1' }, [
        h(InputText, {
          modelValue: variant,
          'onUpdate:modelValue': (value: string) => {
            data.variants[idx] = value
          },
          placeholder: 'ответ',
          size: 'small'
        }),
        // Кнопка добавления (на последнем варианте, если меньше 10)
        idx === data.variants.length - 1 && idx < 9 
          ? h(Button, {
              onClick: () => addVariant(data),
              icon: 'pi pi-plus',
              severity: 'success',
              size: 'small',
              variant: 'outlined'
            })
          : null,
        // Кнопка удаления (если больше одного варианта)
        idx > 0 
          ? h(Button, {
              onClick: () => removeVariant(data, idx),
              icon: 'pi pi-minus', 
              severity: 'danger',
              size: 'small',
              variant: 'outlined'
            })
          : null
      ].filter(Boolean))
    )
  )
}

/**
 * Рендер поля Sector - чекбокс участия в секторе
 */
export const renderSector: FieldRenderer = ({ data }) => {
  const store = useLevelV2Store()
  
  const markCustom = (): void => {
    // При ручном изменении сектора переключаемся в режим "все"
    // TODO: Уточнить правильную логику для sectorMode при ручных изменениях
    store.config.sectorMode = 'all'
  }

  return h(Checkbox, {
    modelValue: data.sector,
    'onUpdate:modelValue': (value: boolean) => {
      data.sector = value
    },
    onChange: markCustom,
    binary: true
  })
}

/**
 * Рендер поля Bonus - чекбокс участия в бонусе
 */
export const renderBonus: FieldRenderer = ({ data }) => {
  return h(Checkbox, {
    modelValue: data.bonus,
    'onUpdate:modelValue': (value: boolean) => {
      data.bonus = value
    },
    binary: true
  })
}

/**
 * Рендер поля BonusTime - время с флагом negative
 */
export const renderBonusTime: FieldRenderer = ({ data }) => {
  return h('div', { class: 'flex items-center gap-1' }, [
    // Часы
    h(InputNumber, {
      modelValue: data.bonusTime.hours,
      'onUpdate:modelValue': (value: number | null) => {
        data.bonusTime.hours = value || 0
      },
      min: 0,
      step: 1,
      suffix: ' ч',
      size: 'small',
      class: 'z-w-3'
    }),
    // Минуты
    h(InputNumber, {
      modelValue: data.bonusTime.minutes,
      'onUpdate:modelValue': (value: number | null) => {
        data.bonusTime.minutes = value || 0
      },
      min: 0,
      suffix: ' м', 
      size: 'small',
      class: 'z-w-3'
    }),
    // Секунды
    h(InputNumber, {
      modelValue: data.bonusTime.seconds,
      'onUpdate:modelValue': (value: number | null) => {
        data.bonusTime.seconds = value || 0
      },
      min: 0,
      suffix: ' с',
      size: 'small', 
      class: 'z-w-3'
    }),
    // Флаг отрицательности
    h('label', { class: 'flex items-center gap-1 ml-2' }, [
      h(Checkbox, {
        modelValue: data.bonusTime.negative,
        'onUpdate:modelValue': (value: boolean) => {
          data.bonusTime.negative = value
        },
        binary: true
      }),
      h('span', { class: 'text-gray-500' }, 'отриц.')
    ])
  ])
}

/**
 * Рендер поля ClosedSector - текстовое поле закрытого сектора
 */
export const renderClosedSector: FieldRenderer = ({ data }) => {
  return h(InputText, {
    modelValue: data.closedText,
    'onUpdate:modelValue': (value: string) => {
      data.closedText = value
    },
    placeholder: 'Текст или картинка',
    size: 'small'
  })
}

/**
 * Рендер поля OpenSector - текстовое поле открытого сектора
 */
export const renderOpenSector: FieldRenderer = ({ data }) => {
  return h(InputText, {
    modelValue: data.displayText,
    'onUpdate:modelValue': (value: string) => {
      data.displayText = value
    },
    placeholder: 'Отображение ответа',
    size: 'small'
  })
}

// Мапа рендеров по ID поля
export const fieldRenderers: Record<string, FieldRenderer> = {
  answer: renderAnswer,
  sector: renderSector,  
  bonus: renderBonus,
  bonusTime: renderBonusTime,
  closedText: renderClosedSector,
  displayText: renderOpenSector
}

// Функция получения рендера по ID поля
export function getFieldRenderer(fieldId: string): FieldRenderer | undefined {
  return fieldRenderers[fieldId]
}


