<template>
  <VueOnboardingTour
    :tour-id="tourId"
    :steps="tourSteps"
    :cookie-storage="false"
    :start-tour="shouldAutoStart"
    start-event="start-user-tour"
    :backdrop="true"
    label-terminate="Закончить"
    scrollable-container-selector=".main-content"
    @end-tour="handleTourFinished"
  />
</template>

<script setup lang="ts">
/**
 * Компонент пошаговой обучалки для новых пользователей
 *
 * Показывает 4-шаговый tour по основным элементам интерфейса:
 * 1. LevelHeader - информация о настройках
 * 2. LevelControlPanel - инструменты редактирования
 * 3. LevelContent - основная рабочая область
 * 4. LevelFooter - кнопки действий
 */

import { computed, onMounted, ref } from 'vue'
import { useLevelStore } from '@/store/levels'
import { getLevelTypeConfig } from '@/entities/level/configs'

withDefaults(defineProps<{
  /** Уникальный ID тура для cookie storage */
  tourId?: number
}>(), {
  tourId: 1001
})

const levelStore = useLevelStore()
const shouldAutoStart = ref(false)

// Проверяем первый заход
const TOUR_KEY = 'encounter-uploader-tour-completed'
const isFirstVisit = !globalThis.localStorage.getItem(TOUR_KEY)
const tourStarted = ref(false)

// Получаем конфиг текущего типа уровня
const currentConfig = computed(() => {
  if (!levelStore.levelType) return null
  return getLevelTypeConfig(levelStore.levelType)
})

// Определяем есть ли мульти-табы
const hasMultiTabs = computed(() => {
  return currentConfig.value?.isMultiBlocks === true
})

/**
 * Определение шагов обучалки
 */
const tourSteps = computed(() => {
  const steps = []
  let stepNumber = 1
  const getTotalSteps = () => hasMultiTabs.value ? 7 : 6

  // Приветственный шаг
  steps.push({
    target: '[data-tour="tour-button"]',
    title: 'Добро пожаловать!',
    description: `
      <div style="text-align: center; padding: 10px;">
        <h3>🎯 Небольшой тур по интерфейсу</h3>
        <p>Мы покажем основные элементы интерфейса загрузчика уровней в Encounter.</p>
        <p><em>Страницу загрузки можно обновлять, все данные сохраняются локально и мгновенно обновляются при изменениях.</em></p>
      </div>
    `,
    tag: `Мини-обучение`
  })

  // Информация о настройках
  steps.push({
    target: '[data-tour="level-header"]',
    title: 'Информация',
    description: `
      <p>Здесь отображается информация типе уровня и текущих настройках.</p>
      <p>Эти данные задаются на странице настроек.</p>
    `,
    tag: `Шаг ${stepNumber++} из ${getTotalSteps()}`
  })

  // Панель управления
  steps.push({
    target: '[data-tour="control-panel"]',
    title: 'Панель управления',
    description: `
      <p>Инструменты <strong>массового редактирования</strong> данных:</p>
      <ul style="margin: 10px 0; padding-left: 15px;">
        <li>— Заполнение всех полей одним значением</li>
        <li>— Некоторые поля поддерживают оператор "<strong>&</strong>" для нумерации</li>
        <li>— Очистка всех полей таблицы</li>
        <li>— Настройка задержек и времени</li>
      </ul>
      <p>💡 <em>Можно свернуть/развернуть кликом на стрелку</em></p>
    `,
    tag: `Шаг ${stepNumber++} из ${getTotalSteps()}`,
    beforeScript: () => {
      // Автоматически развернуть панель если свернута
      const panel = globalThis.document.querySelector('[data-tour="control-panel"]')
      const isCollapsed = panel?.querySelector('.collapsed')
      if (isCollapsed) {
        const toggleButton = panel?.querySelector('.toggle-button')
        if (toggleButton) {
          (toggleButton as globalThis.HTMLElement).click()
        }
      }
    }
  })

  // Мульти-табы (условно)
  if (hasMultiTabs.value) {
    steps.push({
      target: '[data-tour="level-tabs"]',
      title: 'Блоки',
      description: `
        <p>Для этого типа уровня доступны <strong>блоки</strong>:</p>
        <ul style="margin: 10px 0; padding-left: 15px;">
          <li>— Удобно для БМП (разделение типов кодов на баллон, маркер, пиксель)</li>
          <li>— Переключение между блоками</li>
          <li>— Добавление/копирование/удаление блоков</li>
          <li>— Переименование блока в поле ввода</li>
        </ul>
        <p><em>💡 Максимум 10 блоков, минимум 1</em></p>
      `,
      tag: `Шаг ${stepNumber++} из ${getTotalSteps()}`,
      beforeScript: () => {
        // Проверяем, есть ли табы на странице
        const tabsContainer = globalThis.document.querySelector('[data-tour="level-tabs"]')
        if (!tabsContainer || !tabsContainer.offsetParent) {
          console.log('Tabs not visible, skipping step')
          return false // пропустить шаг если табов нет
        }

        // Подсветим активный таб
        const activeTab = tabsContainer.querySelector('.p-tab.p-tab-active, .tab.active')
        if (activeTab) {
          activeTab.classList.add('tour-highlight')
          globalThis.setTimeout(() => {
            activeTab.classList.remove('tour-highlight')
          }, 1500)
        }
        return true
      },
      afterScript: () => {
        // Демонстрация работы кнопок управления табами
        const addButton = globalThis.document.querySelector('[data-tour="level-tabs"] .pi-plus')?.parentElement
        const copyButton = globalThis.document.querySelector('[data-tour="level-tabs"] .pi-copy')?.parentElement
        const removeButton = globalThis.document.querySelector('[data-tour="level-tabs"] .pi-minus')?.parentElement

        if (addButton && removeButton && copyButton) {
          // Подсвечиваем кнопки поочередно
          globalThis.setTimeout(() => {
            addButton.classList.add('tour-demo-pulse')
            globalThis.setTimeout(() => addButton.classList.remove('tour-demo-pulse'), 900)
          }, 300)

          globalThis.setTimeout(() => {
            copyButton.classList.add('tour-demo-pulse')
            globalThis.setTimeout(() => copyButton.classList.remove('tour-demo-pulse'), 600)
          }, 600)

          globalThis.setTimeout(() => {
            removeButton.classList.add('tour-demo-pulse')
            globalThis.setTimeout(() => removeButton.classList.remove('tour-demo-pulse'), 900)
          }, 900)
        }
      }
    })
  }

  // Основная рабочая область
  steps.push({
    target: '[data-tour="level-content"]',
    title: 'Заливаемый контент',
    description: `
      <p>Главная таблица для заливки:</p>
      <ul style="margin: 10px 0; padding-left: 15px;">
        <li><strong>Строки</strong> — отдельные ответы (сектора/бонусы)</li>
        <li><strong>Колонки</strong> — свойства и настройки каждого элемента</li>
        <li><strong>Чекбоксы (сектор/бонус)</strong> — что загружать, а что нет</li>
      </ul>
      <p>Можно редактировать каждую ячейку индивидуально или использовать панель управления для массовых операций.</p>
    `,
    tag: `Шаг ${stepNumber++} из ${getTotalSteps()}`
  })

  // Навигационные кнопки
  steps.push({
    target: '[data-tour="navigation-buttons"]',
    title: 'Навигационные кнопки',
    description: `
      <p><strong>🔙 Кнопки навигации:</strong></p>
      <ul style="margin: 10px 0; padding-left: 15px;">
        <li>— Возврат к настройкам игры</li>
        <li>— Смена типа уровня</li>
      </ul>
    `,
    tag: `Шаг ${stepNumber++} из ${getTotalSteps()}`
  })

  // Функциональные кнопки
  steps.push({
    target: '[data-tour="functional-buttons"]',
    title: 'Функциональные кнопки',
    description: `
      <p><strong>📁 Кнопки для работы с таблицей (разные кнопки для разных типов уровней):</strong></p>
      <ul style="margin: 10px 0; padding-left: 15px;">
        <li>— Добавление кодов</li>
        <li>— Очистка от кодов</li>
        <li>— Экспорт/импорт из .csv или .json</li>
        <li>— Предварительный просмотр</li>
      </ul>
    `,
    tag: `Шаг ${stepNumber++} из ${getTotalSteps()}`,
    afterScript: () => {
      // Кратковременная подсветка функциональных кнопок
      const buttons = globalThis.document.querySelectorAll('[data-tour="functional-buttons"] button')
      buttons.forEach((btn, i) => {
        globalThis.setTimeout(() => {
          btn.classList.add('tour-demo-pulse')
          globalThis.setTimeout(() => btn.classList.remove('tour-demo-pulse'), 800)
        }, i * 150)
      })
    }
  })

  // Экшн кнопки
  steps.push({
    target: '[data-tour="action-buttons"]',
    title: 'Кнопки действий',
    description: `
      <p><strong>🚀 Основные действия (в зависимости от типа уровня):</strong></p>
      <ul style="margin: 10px 0; padding-left: 15px;">
        <li>— Заливка заданий</li>
        <li>— Заливка секторов (с чекбоксом "БМП", при котором коды из всех блоков объединяются в один сектор)</li>
        <li>— Заливка бонусов</li>
      </ul>
      <p><em>Во время заливки будет доступен прогресс-бар с информацией и возможность поставить на паузу.</em></p>
    `,
    tag: `Шаг ${stepNumber} из ${getTotalSteps()}`,
    beforeScript: () => {
      // Плавно скроллим к кнопкам действий
      const actionButtons = globalThis.document.querySelector('[data-tour="action-buttons"]')
      if (actionButtons) {
        actionButtons.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    afterScript: () => {
      // Финальная анимация - подсветка основной кнопки загрузки
      const uploadButton = globalThis.document.querySelector('.upload-button, .primary-action-button')
      if (uploadButton) {
        uploadButton.classList.add('tour-finale-glow')
        globalThis.setTimeout(() => {
          uploadButton.classList.remove('tour-finale-glow')
        }, 2000)
      }
    }
  })

  return steps
})

/**
 * Обработка завершения тура
 */
function handleTourFinished() {
  // Сохраняем факт прохождения тура
  globalThis.localStorage.setItem(TOUR_KEY, 'true')
  tourStarted.value = false
  console.log('Tour finished, flag saved:', globalThis.localStorage.getItem(TOUR_KEY))
}


/**
 * Функция для запуска тура программно
 */
function startTour() {
  globalThis.dispatchEvent(new globalThis.CustomEvent('start-user-tour'))
}

/**
 * Автозапуск при первом заходе
 */
onMounted(() => {
  console.log('UserTour mounted, isFirstVisit:', isFirstVisit, 'tourStarted:', tourStarted.value)
  console.log('localStorage value:', globalThis.localStorage.getItem(TOUR_KEY))

  if (isFirstVisit && !tourStarted.value) {
    console.log('Starting tour auto-start timer...')
    // Небольшая задержка для загрузки всех компонентов
    globalThis.setTimeout(() => {
      // Проверяем еще раз, чтобы не запускать тур если уже был закрыт
      const currentFlag = globalThis.localStorage.getItem(TOUR_KEY)
      console.log('Timer fired, current flag:', currentFlag, 'tourStarted:', tourStarted.value)

      if (!currentFlag && !tourStarted.value) {
        console.log('Starting tour automatically!')
        tourStarted.value = true
        shouldAutoStart.value = true
      } else {
        console.log('Tour not started - flag exists or tour already started')
      }
    }, 1000)
  } else {
    console.log('Tour not started - not first visit or tour already started')
  }
})

// Экспортируем функцию для использования в родительском компоненте
defineExpose({
  startTour,
  handleTourFinished
})
</script>

<style>
/**
 * Анимации для интерактивной обучалки
 * Глобальные стили для демонстрационных эффектов
 */

/* Пульсирующая анимация для функциональных кнопок */
@keyframes tour-demo-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

.tour-demo-pulse {
  animation: tour-demo-pulse 0.8s ease-in-out;
}

/* Финальная анимация свечения для главной кнопки */
@keyframes tour-finale-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
  }
  25% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.6);
  }
  50% {
    box-shadow: 0 0 35px rgba(34, 197, 94, 1), 0 0 50px rgba(34, 197, 94, 0.8);
  }
  75% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.6);
  }
}

.tour-finale-glow {
  animation: tour-finale-glow 2s ease-in-out;
  position: relative;
  z-index: 1;
}

/* Подсветка для выделенных элементов тура */
@keyframes tour-highlight {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(99, 102, 241, 0.1);
  }
  100% {
    background-color: transparent;
  }
}

.tour-highlight {
  animation: tour-highlight 1.5s ease-in-out;
}

/* Плавные переходы для всех элементов тура */
[data-tour] {
  transition: all 0.3s ease-in-out;
}

/* Улучшение видимости кнопки обучения */
[data-tour="tour-button"] {
  position: relative;
}

[data-tour="tour-button"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

/* Анимация для разворачивания панели управления */
.control-panel-expand {
  animation: expandPanel 0.5s ease-out;
}

@keyframes expandPanel {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 500px;
    opacity: 1;
  }
}

/* Особый стиль для активного шага тура */
.vue-onboarding-tour-step.active {
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

/* Плавная анимация появления подсказок */
.vue-onboarding-tour-tooltip {
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>