# Исследование и исправление функционала "Уровни бонусов" в архитектуре v2

## 🔍 Исследование проблемы

### Описание проблемы
На тестовой странице 100500 для v2 (http://192.168.0.12:5173/v2/test/type100500) при нажатии на "Уровни бонусов" в модальном окне показывается ошибка "Не удалось загрузить список уровней: Request failed with status code 500" при выборе опции "На выбранных уровнях".

---

## 📁 Исследованные файлы

### Старая архитектура:
- `frontend/src/components/types/Type100500/index.vue` - основной компонент с рабочим модалом
- `frontend/src/services/uploader.ts` - функция `fetchBonusLevels()` (строки 441-475)
- `server/index.js` - API endpoint `/api/admin/bonus-form` (строки 223-246)

### Новая архитектура v2:
- `frontend/src/components/common/modals/LevelsModal.vue` - модальное окно (заглушка)
- `frontend/src/components/level-system-v2/bases/controls/BonusLevelsControl.vue` - контрол-панель
- `frontend/src/components/level-system-v2/bases/fields/tableRenderers.ts` - рендеры полей (строки 188-210)
- `frontend/src/components/level-system-v2/components/LevelUploadPage.vue` - инициализация (строки 70-92)
- `frontend/src/components/level-system-v2/store/index.ts` - store v2
- `frontend/src/composables/useTestConfig.ts` - тестовая конфигурация старой архитектуры
- `frontend/src/composables/useTestConfigV2.ts` - тестовая конфигурация новой архитектуры

---

## 📊 Анализ старой архитектуры (рабочая)

### Компоненты и файлы
1. **`Type100500/index.vue`** - основной компонент с встроенным модальным окном
2. **`services/uploader.ts`** - функция `fetchBonusLevels()` для получения списка уровней
3. **`server/index.js`** - API endpoint `/api/admin/bonus-form` для парсинга HTML

### Как работает получение списка уровней

#### 1. API вызов (`uploader.ts:441-475`)
```typescript
export async function fetchBonusLevels(
  domain: string,
  gameid: string | number,
  level: string | number
): Promise<Array<{ label: string; name: string }>> {
  const urlForm = `/api/admin/bonus-form?domain=${encodeURIComponent(
    domain
  )}&gid=${encodeURIComponent(String(gameid))}&level=${encodeURIComponent(
    String(level)
  )}`
  const res = await axios.get(urlForm, { withCredentials: true })
  const htmlText = res.data as string
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, 'text/html')
  const inputs = Array.from(doc.querySelectorAll('input[name^="level_"]')) as HTMLInputElement[]
  // ... парсинг чекбоксов из HTML
}
```

#### 2. Серверный endpoint (`server/index.js:223-246`)
```javascript
app.get('/api/admin/bonus-form', async (req, res) => {
  const { domain, gid, level } = req.query
  const url = `https://${domain}.en.cx/Administration/Games/BonusEdit.aspx?gid=${gid}&level=${level}&bonus=0&action=save`

  const proxyRes = await axios.get(url, {
    headers: { Cookie: req.session.authCookie },
  })
  res.status(200).send(proxyRes.data)
})
```

### Модальное окно в старой архитектуре (`Type100500/index.vue:223-270`)

**Основные возможности:**
- ✅ Две опции: "На всех уровнях" / "На указанных уровнях"
- ✅ Автоматическая загрузка списка уровней при открытии
- ✅ Кнопки "Отметить все" и "Обновить"
- ✅ Применение к отдельной строке или массовое применение
- ✅ Правильная обработка ошибок API

**Пример использования:**
- **Массовое применение**: `openLevelsModal('bulk')` (строка 79)
- **Индивидуальное применение**: `openLevelsModal('row', row)` (строка 149)

**Инициализация данных (Type100500/index.vue:442-457):**
```typescript
async function refreshLevels() {
  try {
    loadingLevels.value = true
    const list = await fetchBonusLevels(store.domain, store.gameId, store.levelId)
    availableLevels.value = list
  } catch (e: any) {
    notify.error('Не удалось загрузить список уровней', e.message || String(e))
  } finally {
    loadingLevels.value = false
  }
}
```

---

## 🔬 Анализ новой архитектуры v2 (проблемная)

### Текущая реализация

#### 1. LevelsModal.vue (компонент модала)
**Статус**: ❌ Использует заглушку вместо реального API

```typescript
// Строки 151-175 - ЗАГЛУШКА!
async function loadAvailableLevels() {
  loading.value = true
  error.value = ''

  try {
    // Здесь будет вызов API для получения списка уровней
    // Пока используем заглушку
    await new Promise(resolve => globalThis.setTimeout(resolve, 500))

    // Генерируем тестовые уровни
    availableLevels.value = Array.from({ length: 20 }, (_, i) => ({
      label: `Уровень ${i + 1}`,
      value: String(i + 1)
    }))

    // Автоматически выбираем текущий уровень
    if (!selectedLevels.value.includes(props.currentLevel)) {
      selectedLevels.value.push(props.currentLevel)
    }
  } catch (_err) {
    error.value = 'Не удалось загрузить список уровней'
  } finally {
    loading.value = false
  }
}
```

#### 2. BonusLevelsControl.vue (контрол-панель)
**Статус**: ✅ Корректная интеграция с LevelsModal, но получает неработающий модал

#### 3. tableRenderers.ts (рендеры строк таблицы)
**Статус**: ❌ НЕ подключен к реальному модалу

```typescript
// Строки 188-192 - ЗАГЛУШКА!
export const renderBonusLevels: FieldRenderer = ({ data }) => {
  const openLevelsModal = (): void => {
    console.log('Открытие модального окна выбора уровней для:', data)
    // Здесь будет логика открытия LevelsModal
  }
  // ...
}
```

#### 4. LevelUploadPage.vue (инициализация)
**Статус**: ❌ Проблема с тестовой конфигурацией

```typescript
// Строки 74-82 - ПРОБЛЕМА!
if (!levelV2Store.domain) {
  levelV2Store.domain = 'test'  // ← Hardcoded "test"!
}
if (!levelV2Store.gameId) {
  levelV2Store.gameId = 'test'  // ← Hardcoded "test"!
}
if (!levelV2Store.levelId) {
  levelV2Store.levelId = '1'
}
```

---

## 🔍 Сравнение архитектур и выявленные различия

| Аспект | Старая архитектура | Новая архитектура v2 |
|--------|-------------------|---------------------|
| **API интеграция** | ✅ Реальный `fetchBonusLevels()` | ❌ Заглушка с `setTimeout()` |
| **Конфигурация тестирования** | ✅ Переменные окружения | ❌ Hardcoded "test" значения |
| **Модал в контрол-панели** | ✅ Встроенный в компонент | ✅ Отдельный компонент |
| **Модал в строках таблицы** | ✅ Одно и то же модальное окно | ❌ Не подключен |
| **Кнопка "Обновить"** | ✅ Есть | ❌ Отсутствует |
| **Обработка ошибок** | ✅ Показ уведомлений | ❌ Только в консоль |
| **Получение credentials** | ✅ Из store (domain, gameId) | ❌ Hardcoded или пустые |

---

## 🕵️ Причина ошибки 500

### Root cause анализ:
1. **Новая архитектура v2** передает `domain='test'`, `gameId='test'` в API
2. **Сервер** пытается сделать запрос на `https://test.en.cx/Administration/Games/BonusEdit.aspx?gid=test&level=1`
3. **Домен test.en.cx не существует** → ошибка сети → HTTP 500
4. **Пользователь видит**: "Request failed with status code 500"

### Контраст со старой архитектурой:
- Старая архитектура использует **переменные окружения** (`VITE_TEST_DOMAIN`, `VITE_TEST_GAME_ID`)
- При правильной настройке env переменных делается запрос к **реальному домену**
- API работает корректно

---

## 🚨 Проблема с двумя видами тестирования

### Выявлена путаница между режимами тестирования:

#### Режим 1: Тестирование авторизации и настроек
- **URL**: http://192.168.0.12:5173/
- **Credentials**: `test/test` (демо доступы)
- **Назначение**: Тестировать UI страниц авторизации и настроек

#### Режим 2: Тестирование типов уровней (обход авторизации)
- **URL**: http://192.168.0.12:5173/v2/test/type100500
- **Credentials**: Переменные окружения (`VITE_TEST_*`)
- **Назначение**: Тестировать функционал уровней с реальными API

### Проблема в новой архитектуре:
**Режим 2 использует значения из Режима 1!**
- `domain='test'` вместо `VITE_TEST_DOMAIN`
- `gameId='test'` вместо `VITE_TEST_GAME_ID`

---

## 🔧 План исправления

### Этап 1: Исправить API интеграцию в LevelsModal.vue
**Файл**: `frontend/src/components/common/modals/LevelsModal.vue`

**Изменения:**
1. ✅ Импортировать `fetchBonusLevels` из `@/services/uploader`
2. ✅ Добавить зависимость от store v2 для получения `domain`, `gameId`, `levelId`
3. ✅ Заменить заглушку на реальный API вызов
4. ✅ Добавить кнопку "Обновить" в footer
5. ✅ Улучшить обработку ошибок (показ конкретных сообщений)

```typescript
// Пример интеграции:
import { fetchBonusLevels } from '@/services/uploader'
import { useLevelV2Store } from '@/components/level-system-v2/store'

const store = useLevelV2Store()

async function loadAvailableLevels() {
  loading.value = true
  error.value = ''

  try {
    const levels = await fetchBonusLevels(store.domain, store.gameId, store.levelId)
    availableLevels.value = levels.map(level => ({
      label: level.label,
      value: level.label
    }))
  } catch (err) {
    error.value = `Не удалось загрузить список уровней: ${err.message}`
  } finally {
    loading.value = false
  }
}
```

### Этап 2: Исправить тестовую конфигурацию в LevelUploadPage.vue
**Файл**: `frontend/src/components/level-system-v2/components/LevelUploadPage.vue`

**Изменения:**
1. ✅ Импортировать `useTestConfigV2`
2. ✅ Удалить hardcoded значения `'test'`
3. ✅ Использовать переменные окружения

```typescript
import { useTestConfigV2 } from '@/composables/useTestConfigV2'

onMounted(() => {
  if (typeId.value && config.value) {
    // Получаем правильные credentials для тестирования
    const { getTestCredentialsV2 } = useTestConfigV2()
    const credentials = getTestCredentialsV2()

    // Инициализируем store правильными значениями из переменных окружения
    levelV2Store.domain = credentials.domain
    levelV2Store.gameId = credentials.gameId
    levelV2Store.levelId = credentials.levelId

    levelV2Store.initializeLevelType(
      typeId.value as LevelTypeId,
      subtypeConfig.value || subtype.value,
      true
    )
  }
})
```

### Этап 3: Подключить модал в tableRenderers.ts
**Файл**: `frontend/src/components/level-system-v2/bases/fields/tableRenderers.ts`

**Изменения:**
1. ✅ Создать механизм связи между renderer и родительским компонентом
2. ✅ Передавать callback для открытия модала через контекст
3. ✅ Реализовать передачу данных строки в модал

**Варианты решения:**
- **Вариант A**: Передача callback через props рендера
- **Вариант B**: Использование глобального event bus
- **Вариант C**: Интеграция через provide/inject

### Этап 4: Добавить кнопку "Обновить" в LevelsModal
**Файл**: `frontend/src/components/common/modals/LevelsModal.vue`

**Изменения:**
1. ✅ Добавить кнопку "Обновить" в footer template
2. ✅ Привязать к функции `loadAvailableLevels`
3. ✅ Показывать состояние загрузки при обновлении

### Этап 5: Унификация поведения со старой архитектурой
**Цель**: Обеспечить идентичное поведение модала

**Изменения:**
1. ✅ Идентичная логика применения уровней
2. ✅ Одинаковые состояния и переходы
3. ✅ Совместимый формат данных (`allLevels` / `targetLevels`)

### Этап 6: Тестирование и отладка
1. ✅ Настройка переменных окружения для тестирования
2. ✅ Проверка работы обоих вариантов модала (массовый + индивидуальный)
3. ✅ Тестирование обработки ошибок API
4. ✅ Проверка соответствия со старой архитектурой

---

## 📋 Файлы для изменения

### Обязательные изменения:
1. **`LevelsModal.vue`** - основная интеграция API
2. **`LevelUploadPage.vue`** - исправление тестовой конфигурации
3. **`tableRenderers.ts`** - подключение модала в строки таблицы

### Возможные изменения:
4. **`BonusLevelsControl.vue`** - доработки интеграции (если потребуется)
5. **`useLevelV2Store.ts`** - добавление методов для работы с модалом (опционально)

---

## ⚡ Ожидаемый результат

После всех исправлений функционал "Уровни бонусов" в архитектуре v2:

### ✅ Будет полностью работать:
- Реальные API вызовы к серверу Encounter
- Правильная обработка тестовых сценариев с переменными окружения
- Отсутствие ошибок 500 при выборе "На выбранных уровнях"
- Функциональность кнопки "Обновить"

### ✅ Будет поддерживать все возможности старой архитектуры:
- Два режима: "На всех уровнях" / "На выбранных уровнях"
- Массовое применение из контрол-панели
- Индивидуальное применение для строк таблицы
- Правильные уведомления об ошибках

### ✅ Будет корректно интегрирована:
- Единый модал для обоих случаев использования
- Связь с store v2 для получения метаданных игры
- Совместимость с существующей логикой обработки данных

---

## 🔍 Дополнительные наблюдения

### Хорошие решения в новой архитектуре:
- ✅ Выделение модала в отдельный переиспользуемый компонент
- ✅ Четкое разделение props и events
- ✅ TypeScript интерфейсы для типизации
- ✅ Композабл `useTestConfigV2` для тестовых данных

### Рекомендации для будущих доработок:
- ✅ Добавить unit тесты для модала
- ✅ Рассмотреть кэширование списка уровней
- ✅ Добавить индикатор загрузки при открытии модала
- ✅ Реализовать debounce для избежания множественных запросов