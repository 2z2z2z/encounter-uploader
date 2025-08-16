# Upload Builders - Система сборки payload для Encounter API

## 📋 Описание

Модуль `builders.ts` содержит универсальные функции для создания правильно структурированных payload для всех типов запросов к Encounter API. Эти функции гарантируют корректность отправляемых данных и служат единой точкой формирования запросов для всех 20+ типов уровней.

## 🚀 Использование

### Сборка payload для задания (Task)

```typescript
import { buildTaskPayload } from '@/services/upload/builders'

const taskPayload = buildTaskPayload(
  '126',           // domain
  123,             // gameId
  1,               // levelId
  '<table>...</table>' // HTML контент задания
)

// Отправка на сервер
await axios.post('/api/admin/task', taskPayload)
```

### Сборка payload для секторов

```typescript
import { buildSectorPayload } from '@/services/upload/builders'

// Один вариант ответа
const singleVariant = buildSectorPayload(
  '126', 123, 1,
  ['ANSWER1']
)

// Несколько вариантов ответа
const multipleVariants = buildSectorPayload(
  '126', 123, 1,
  ['ANSWER1', 'ANSWER2', 'ANSWER3'],
  'Название сектора' // опционально
)
```

### Сборка payload для бонусов

```typescript
import { buildBonusPayload, type BonusPayloadArgs } from '@/services/upload/builders'

// Простой бонус для олимпийки
const olympBonus: BonusPayloadArgs = {
  domain: '126',
  gid: 123,
  level: 1,
  name: 'Бонус 1',
  variants: ['BONUSANSWER'],
  time: { hours: 0, minutes: 10, seconds: 0 },
  allLevels: false,
  levelCheckboxNames: ['level_1']
}

// Сложный бонус для Type100500 со всеми возможностями
const complexBonus: BonusPayloadArgs = {
  domain: '126',
  gid: 123,
  level: 1,
  name: 'Сложный бонус',
  task: '<p>Описание бонусного задания</p>',
  hint: '<p>Подсказка</p>',
  variants: ['VAR1', 'VAR2', 'VAR3'],
  time: { 
    hours: 0, 
    minutes: 5, 
    seconds: 30, 
    negative: true // отрицательное время
  },
  delay: { // задержка появления (Type100500)
    hours: 0, 
    minutes: 15, 
    seconds: 0 
  },
  relativeLimit: { // ограничение времени действия (Type100500)
    hours: 1, 
    minutes: 0, 
    seconds: 0 
  },
  allLevels: false,
  levelCheckboxNames: ['level_1', 'level_2', 'level_3']
}

const bonusPayload = buildBonusPayload(complexBonus)
```

## ✅ Тестирование

Все builders покрыты snapshot тестами, которые гарантируют неизменность структуры запросов:

```bash
# Запуск тестов
npm run test

# Обновление snapshots при изменении структуры
npm run test:run -- --update

# Просмотр покрытия кода
npm run test:coverage
```

## 🔧 Расширение для новых типов

При добавлении нового типа уровня:

1. Если тип использует стандартные поля - builders уже готовы к использованию
2. Если нужны дополнительные поля - расширьте интерфейс `BonusPayloadArgs`
3. Добавьте новые тесты для проверки корректности

## 📊 Структура данных

### Task Payload
- `domain` - домен Encounter
- `gid` - ID игры
- `level` - номер уровня
- `inputTask` - HTML содержимое задания

### Sector Payload
- Все поля из Task +
- `txtSectorName` - название сектора (опционально)
- `savesector` - всегда пробел " "
- `txtAnswer_N` - варианты ответов
- `ddlAnswerFor_N` - всегда "0" для каждого варианта

### Bonus Payload
- Все базовые поля +
- `txtBonusName` - название бонуса
- `txtTask` - задание бонуса (опционально)
- `txtHelp` - подсказка (опционально)
- `answer_-N` - варианты ответов (с отрицательными индексами!)
- Временные параметры
- Параметры задержки и ограничения (для Type100500)
- Уровни доступности

## ⚠️ Важно

- Все функции возвращают `URLSearchParams`, готовые для отправки
- Индексация в секторах начинается с 0 (`txtAnswer_0`)
- Индексация в бонусах начинается с -1 (`answer_-1`)
- При `allLevels=true` не передаются чекбоксы уровней
- При `allLevels=false` обязательно нужен массив `levelCheckboxNames`

