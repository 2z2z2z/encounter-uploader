/**
 * Рендер-функции полей для DataTable колонок
 * Реализация для шагов 9-10: Answer, Sector, Bonus, BonusTime, ClosedSector, OpenSector
 */

import { h, type VNode } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber' 
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import type { Answer } from '../../types/fields'
import { useLevelV2Store } from '../../store'
// TODO: Импорт LevelsModal когда будет готова интеграция

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

/**
 * Рендер поля BonusLevels - выбор уровней для бонуса
 */
export const renderBonusLevels: FieldRenderer = ({ data }) => {
  // TODO: Интеграция с LevelsModal после реализации слота LevelContent
  const openLevelsModal = (): void => {
    console.log('Открытие модального окна выбора уровней для:', data)
    // Здесь будет логика открытия LevelsModal
  }

  const selectedCount = data.bonusLevels?.length || 0
  const displayText = selectedCount > 0 
    ? `Выбрано: ${selectedCount}` 
    : 'Не выбрано'

  return h('div', { class: 'flex items-center gap-2' }, [
    h(Button, {
      onClick: openLevelsModal,
      icon: 'pi pi-list',
      severity: 'secondary',
      size: 'small',
      variant: 'outlined',
      label: 'Выбрать'
    }),
    h('span', { class: 'text-sm text-gray-600' }, displayText)
  ])
}

/**
 * Рендер поля Delay - время задержки без флага negative
 */
export const renderDelay: FieldRenderer = ({ data }) => {
  if (!data.delay) {
    data.delay = { hours: 0, minutes: 0, seconds: 0 }
  }

  return h('div', { class: 'flex items-center gap-1' }, [
    // Часы
    h(InputNumber, {
      modelValue: data.delay.hours,
      'onUpdate:modelValue': (value: number | null) => {
        if (data.delay) data.delay.hours = value || 0
      },
      min: 0,
      step: 1,
      suffix: ' ч',
      size: 'small',
      class: 'z-w-3'
    }),
    // Минуты
    h(InputNumber, {
      modelValue: data.delay.minutes,
      'onUpdate:modelValue': (value: number | null) => {
        if (data.delay) data.delay.minutes = value || 0
      },
      min: 0,
      suffix: ' м',
      size: 'small',
      class: 'z-w-3'
    }),
    // Секунды
    h(InputNumber, {
      modelValue: data.delay.seconds,
      'onUpdate:modelValue': (value: number | null) => {
        if (data.delay) data.delay.seconds = value || 0
      },
      min: 0,
      suffix: ' с',
      size: 'small',
      class: 'z-w-3'
    })
  ])
}

/**
 * Рендер поля Limit - время ограничения без флага negative
 */
export const renderLimit: FieldRenderer = ({ data }) => {
  if (!data.limit) {
    data.limit = { hours: 0, minutes: 0, seconds: 0 }
  }

  return h('div', { class: 'flex items-center gap-1' }, [
    // Часы
    h(InputNumber, {
      modelValue: data.limit.hours,
      'onUpdate:modelValue': (value: number | null) => {
        if (data.limit) data.limit.hours = value || 0
      },
      min: 0,
      step: 1,
      suffix: ' ч',
      size: 'small',
      class: 'z-w-3'
    }),
    // Минуты
    h(InputNumber, {
      modelValue: data.limit.minutes,
      'onUpdate:modelValue': (value: number | null) => {
        if (data.limit) data.limit.minutes = value || 0
      },
      min: 0,
      suffix: ' м',
      size: 'small',
      class: 'z-w-3'
    }),
    // Секунды
    h(InputNumber, {
      modelValue: data.limit.seconds,
      'onUpdate:modelValue': (value: number | null) => {
        if (data.limit) data.limit.seconds = value || 0
      },
      min: 0,
      suffix: ' с',
      size: 'small',
      class: 'z-w-3'
    })
  ])
}

/**
 * Рендер поля SectorName - название сектора
 */
export const renderSectorName: FieldRenderer = ({ data }) => {
  return h(InputText, {
    modelValue: data.sectorName || '',
    'onUpdate:modelValue': (value: string) => {
      data.sectorName = value
    },
    placeholder: 'Название сектора',
    size: 'small'
  })
}

/**
 * Рендер поля BonusName - название бонуса
 */
export const renderBonusName: FieldRenderer = ({ data }) => {
  return h(InputText, {
    modelValue: data.bonusName || '',
    'onUpdate:modelValue': (value: string) => {
      data.bonusName = value
    },
    placeholder: 'Название бонуса',
    size: 'small'
  })
}

/**
 * Рендер поля BonusTask - бонусное задание
 */
export const renderBonusTask: FieldRenderer = ({ data }) => {
  return h(Textarea, {
    modelValue: data.bonusTask || '',
    'onUpdate:modelValue': (value: string) => {
      data.bonusTask = value
    },
    placeholder: 'Текст бонусного задания',
    autoResize: true,
    rows: 1,
    class: 'w-full'
  })
}

/**
 * Рендер поля Hint - подсказка
 */
export const renderHint: FieldRenderer = ({ data }) => {
  return h(Textarea, {
    modelValue: data.hint || '',
    'onUpdate:modelValue': (value: string) => {
      data.hint = value
    },
    placeholder: 'Текст подсказки',
    autoResize: true,
    rows: 1,
    class: 'w-full'
  })
}

// Мапа рендеров по ID поля
export const fieldRenderers: Record<string, FieldRenderer> = {
  answer: renderAnswer,
  sector: renderSector,  
  bonus: renderBonus,
  bonusTime: renderBonusTime,
  closedText: renderClosedSector,
  displayText: renderOpenSector,
  bonusLevels: renderBonusLevels,
  delay: renderDelay,
  limit: renderLimit,
  sectorName: renderSectorName,
  bonusName: renderBonusName,
  bonusTask: renderBonusTask,
  hint: renderHint
}

// Функция получения рендера по ID поля
export function getFieldRenderer(fieldId: string): FieldRenderer | undefined {
  return fieldRenderers[fieldId]
}


