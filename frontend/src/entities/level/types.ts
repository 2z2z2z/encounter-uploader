/**
 * Центральный экспорт всех типов архитектуры level-system
 */

// ===== FIELDS TYPES =====

// Канонические идентификаторы полей
export type FieldId =
	| 'answer'          // Ответ
	| 'sector'          // Сектор
	| 'bonus'           // Бонус
	| 'bonusLevels'     // Уровни бонуса
	| 'bonusTime'       // Бонусное время
	| 'delay'           // Задержка
	| 'limit'           // Ограничение
	| 'closedText'      // Закрытый сектор
	| 'displayText'     // Открытый сектор
	| 'closedPic'       // Закрытая картинка (массив)
	| 'openPic'         // Открытая картинка (массив)
	| 'sectorName'      // Название сектора
	| 'bonusName'       // Название бонуса
	| 'bonusTask'       // Бонусное задание
	| 'hint'            // Подсказка
	| 'correctionType'  // Тип корректировки (бонус/штраф)
	| 'participant'     // Участник игры (команда или игрок)
	| 'correctionLevel' // Уровень корректировки (номер или все)
	| 'correctionTime'  // Время корректировки (д, ч, м, с)
	| 'comment'         // Комментарий
	| 'status'          // Статус отправки строки

// Тип значения поля
export type FieldType =
	| 'string'          // Текстовое поле
	| 'string[]'        // Массив строк (варианты ответов)
	| 'boolean'         // Чекбокс
	| 'time'            // Время (часы, минуты, секунды с флагом negative)
	| 'timeSimple'      // Время без флага negative
	| 'html'            // HTML/многострочный текст
	| 'levels'          // Выбор уровней
	| 'select'          // Выбор одного значения из списка
	| 'duration'        // Время с днями (дни, часы, минуты, секунды)
	| 'status'          // Статус отправки (только чтение)

// Определение поля
export interface FieldDefinition {
	id: FieldId
	label: string
	type: FieldType
	columnLabel?: string     // Название колонки в таблице
	columnWidth?: string     // Минимальная ширина колонки (по умолчанию 150px)
	controlId?: string       // ID связанного контрола
	required?: boolean       // Обязательное поле
	defaultValue?: unknown   // Значение по умолчанию
	placeholder?: string     // Placeholder для поля
	expandable?: boolean     // Расширяемое поле (для textarea)
}

// Значение времени
export interface TimeValue {
	hours: number
	minutes: number
	seconds: number
	negative?: boolean  // Только для bonusTime
}

// Длительность с днями (для корректировок результатов)
export interface DurationValue extends TimeValue {
	days: number
}

// Тип корректировки результатов
export type CorrectionType = 'bonus' | 'penalty'

// Участник игры (команда в командной игре, игрок в одиночной)
export interface GameParticipant {
	id: string    // ID участника в EN (пусто, если не найден в игре)
	name: string  // Имя участника
}

// Уровень игры из формы корректировок
export interface GameLevelOption {
	id: string      // ID уровня в EN
	number: string  // Порядковый номер уровня
}

// Корректировка, уже внесённая в игру (строка списка EN)
export interface ExistingCorrection {
	id: string            // ID корректировки в EN
	dateTime: string      // Дата и время начисления
	participant: string   // Команда или игрок
	level: string         // Номер уровня ('' - все уровни)
	reason: string        // Причина (действие)
	isManual: boolean     // Добавлена администратором вручную
	type: CorrectionType
	seconds: number       // Время в секундах
	comment: string
}

// Состояние отправки строки
export type RowUploadState = 'pending' | 'sent' | 'error'

// Статус отправки строки
export interface RowUploadStatus {
	state: RowUploadState
	message?: string  // Причина ошибки или пояснение
}

/**
 * Структура ответа (строка в таблице контента)
 *
 * Представляет одну строку в таблице LevelContent.
 */
export interface Answer {
	id: string                    // Уникальный ID ответа
	number: number                // Порядковый номер (1-based)
	variants: string[]            // Варианты ответов (может быть несколько)
	sector: boolean               // Участвует в секторе
	bonus: boolean                // Участвует в бонусе
	bonusTime: TimeValue          // Бонусное время
	closedText: string            // Закрытый сектор (текст или URL картинки)
	displayText: string           // Открытый сектор (отображение после ввода)
	closedPic?: string[]          // Закрытые картинки (массив)
	openPic?: string[]            // Открытые картинки (массив)
	bonusLevels?: string[]        // Уровни для бонуса
	delay?: TimeValue             // Задержка
	limit?: TimeValue             // Ограничение
	sectorName?: string           // Название сектора
	bonusName?: string            // Название бонуса
	bonusTask?: string            // Бонусное задание
	hint?: string                 // Подсказка
	correctionType?: CorrectionType       // Тип корректировки
	participant?: GameParticipant | null  // Участник корректировки
	correctionLevel?: string              // Номер уровня ('' - все уровни)
	correctionTime?: DurationValue        // Время корректировки
	comment?: string                      // Комментарий
	status?: RowUploadStatus              // Статус отправки строки
}

// Данные таба
export interface TabData {
	id: string                    // ID таба
	name: string                  // Имя таба (1-20 символов)
	answers: Answer[]             // Массив ответов в табе

	// Настройки массовых операций (не сохраняются)
	quickSettings?: {
		sectorPattern?: string
		bonusPattern?: string
		bonusTaskPattern?: string
		hintPattern?: string
		quickTime?: TimeValue
		quickDelay?: TimeValue
		quickLimit?: TimeValue
	}
}

// ===== CONFIG TYPES =====

// Идентификаторы типов уровней (расширяемый тип)
export type LevelTypeId = string

// Категория типа уровня (для совместимости, может быть убрана)
export type LevelCategory = string

// Стратегия генерации подсказки для бонусов
export type BonusHintStrategy = 'none' | 'autoContent'

// Режим закрытия уровня
export type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'

// Идентификаторы контролов
export type ControlId =
	| 'sectorMode'           // Закрытие уровня
	| 'bonusTime'            // Бонусное время (ч, м, с)
	| 'closedSectorName'     // Название закрытого сектора
	| 'openSectorFill'       // Заполнить открытые сектора
	| 'sectorNames'          // Название секторов
	| 'bonusNames'           // Название бонусов
	| 'closedPicNames'       // Название закрытых картинок
	| 'openPicNames'         // Название открытых картинок
	| 'delay'                // Задержка (ч, м, с)
	| 'limit'                // Ограничение (ч, м, с)
	| 'bonusTasks'           // Бонусные задания
	| 'hints'                // Подсказки (по факту выполнения)
	| 'bonusLevels'          // Уровни бонусов
	| 'correctionGame'       // Данные игры для корректировок (участники, уровни)
	| 'correctionType'       // Тип корректировки для всех строк
	| 'correctionLevel'      // Уровень корректировки для всех строк
	| 'correctionTime'       // Время корректировки для всех строк
	| 'correctionComment'    // Комментарий для всех строк

// Идентификаторы кнопок
export type ButtonId =
	// Навигационные
	| 'back'                 // Назад
	// Функциональные
	| 'addCodes'             // Добавить коды
	| 'clear'                // Очистить
	| 'export'               // Экспорт
	| 'import'               // Импорт
	| 'preview'              // Предпросмотр
	| 'addRow'               // Добавить строку
	| 'addAllParticipants'   // Добавить всех участников игры
	| 'existingCorrections'  // Внесённые корректировки
	// Экшн-кнопки
	| 'uploadTask'           // Залить задание
	| 'uploadSectors'        // Залить секторы
	| 'uploadBonuses'        // Залить бонусы
	| 'uploadCorrections'    // Отправить корректировки

// Тип пейлоада
export type PayloadType = 'task' | 'sector' | 'bonus' | 'correction'

// Конфигурация кнопки
export interface ButtonConfig {
	id: ButtonId
	label: string
	icon?: string
	variant?: 'primary' | 'secondary' | 'danger'
	options?: {
		combineSectors?: boolean  // Для кнопки "Залить секторы" - объединить сектора (БМП)
	}
}

// Конфигурация контрола
export interface ControlConfig {
	id: ControlId
	fieldId: FieldId  // Связанное поле
	label: string
}

/**
 * Подтип уровня (используется для типов с фиксированной размерностью)
 *
 * @example
 * { id: 'variant15', name: '15 секторов', dimension: 15 }
 *
 * ВАЖНО: Подтипы - это НЕ отдельные типы уровней, а вариации одного типа
 * с разными параметрами (обычно - размерностью)
 */
export interface LevelSubtype {
	id: string          // Уникальный идентификатор подтипа
	name: string        // Отображаемое название подтипа
	dimension: number   // Размерность (количество ответов в таблице)
}

// ===== CONTENT GENERATORS SYSTEM =====

/**
 * Контекст для генерации контента пейлоадов
 *
 * Содержит все необходимые данные для создания HTML или другого контента
 * для отправки в пейлоадах заданий.
 */
export interface ContentGeneratorContext {
	answers: Array<{
		id: string
		number: number
		variants: string[]
		sector: boolean
		bonus: boolean
		bonusTime: { hours: number; minutes: number; seconds: number; negative?: boolean }
		closedText: string
		displayText: string
		closedPic?: string[]
		openPic?: string[]
		bonusLevels?: string[]
		delay?: { hours: number; minutes: number; seconds: number }
		limit?: { hours: number; minutes: number; seconds: number }
		sectorName?: string
		bonusName?: string
		bonusTask?: string
		hint?: string
	}>           // Массив ответов активного таба
	fields: FieldId[]               // Поля для использования в генерации
	dimension?: number              // Размерность (для типов с подтипами)
	levelId: string                 // ID уровня
	showBlockIds?: boolean          // Показывать визуальные метки ID (только для preview)
	blockOrder?: number[]           // Фиксированный порядок блоков (индексы для перемешивания)
}

/**
 * Функция генератора контента
 *
 * Принимает контекст и создает строку контента (обычно HTML)
 * для отправки в пейлоаде задания.
 */
export type ContentGenerator = (context: ContentGeneratorContext) => string

/**
 * Конфигурация Task пейлоада с генератором контента
 */
export interface TaskPayloadConfig {
	generator: string        // Имя генератора (например: 'olymp.task')
	fields: FieldId[]       // Поля для использования в генерации
}

/**
 * Новая структура конфигурации пейлоадов
 *
 * Объектный формат где каждый тип пейлоада настраивается отдельно:
 * - task: объект с генератором (если поддерживается) или false
 * - sector: простой boolean (генератор не нужен)
 * - bonus: простой boolean (генератор не нужен)
 */
export interface PayloadsConfig {
	task?: TaskPayloadConfig | boolean  // Конфиг генератора или false
	sector?: boolean                    // Простая поддержка пейлоада
	bonus?: boolean                     // Простая поддержка пейлоада
	correction?: boolean                // Корректировки результатов игры
}

/**
 * Основная конфигурация типа уровня
 *
 * Определяет полную структуру типа уровня включая его подтипы,
 * используемые поля, контролы, кнопки и пейлоады
 *
 * @example
 * Тип с подтипами: имеет подтипы, фиксированное количество ответов
 * Тип без подтипов: без подтипов, ручное добавление ответов
 */
export interface LevelTypeConfig {
	// Основные параметры
	id: LevelTypeId         // Уникальный идентификатор типа уровня
	category: LevelCategory  // Дублирует id для совместимости
	name: string            // Отображаемое название типа

	// Настройки типа
	isMultiBlocks: boolean       // Поддержка множественных табов
	manualCodeAddition: boolean   // Ручное добавление кодов
	maxAnswers?: number           // Максимум ответов (для ручного добавления)
	maxTabs?: number              // Максимум табов (по умолчанию 10)
	isGameScope?: boolean         // Работает со всей игрой: № уровня не нужен, игра может быть завершена

	// Подтипы (опционально, для типов с фиксированной размерностью)
	subtypes?: LevelSubtype[]

	// Элементы интерфейса
	fields: FieldId[]             // Используемые поля
	controls: ControlId[]         // Используемые контролы
	buttons: {
		navigation: ButtonId[]      // Навигационные кнопки
		functional: ButtonId[]      // Функциональные кнопки
		action: ButtonConfig[]      // Экшн-кнопки с конфигурацией
	}

	// Пейлоады (новая структура с генераторами)
	payloads: PayloadsConfig      // Конфигурация пейлоадов

	// Поведение по умолчанию для подсказок бонусов
	bonusHintStrategy?: BonusHintStrategy

	// Значения по умолчанию
	defaults?: {
		sectorMode?: SectorMode
		bonusTime?: { hours: number; minutes: number; seconds: number; negative: boolean }
		closedPattern?: string
		[key: string]: unknown
	}
}

// Конфигурация активного уровня (runtime)
export interface ActiveLevelConfig {
	typeId: LevelTypeId
	subtypeId?: string            // ID выбранного подтипа
	dimension?: number            // Активная размерность
	config: LevelTypeConfig      // Полная конфигурация типа
}

// ===== PAYLOAD TYPES =====

// Базовые данные для всех пейлоадов
export interface BasePayloadData {
	domain: string
	gameId: string | number
	levelId: string | number
}

// Данные для пейлоада задания
export interface TaskPayloadData extends BasePayloadData {
	htmlContent: string  // HTML контент задания
}

// Данные для пейлоада сектора
export interface SectorPayloadData extends BasePayloadData {
	sectorName: string
	answers: Answer[]
	combineSectors?: boolean  // Объединить сектора (БМП)
}

// Данные для пейлоада бонуса
export interface BonusPayloadData extends BasePayloadData {
	bonus: Answer
	levelMapping?: Record<string, string>  // Маппинг уровней для выбора
	hintStrategy?: BonusHintStrategy
	closedPicIds?: string[]  // Массив ID закрытых картинок для hint (например, ["1_02", "1_03"])
}

// Данные для пейлоада корректировки результатов (levelId - ID уровня в EN, '0' - все уровни)
export interface CorrectionPayloadData extends BasePayloadData {
	correctionType: CorrectionType
	participantId: string
	time: DurationValue
	comment: string
}

// Параметры URLSearchParams для задания
export interface TaskPayloadParams {
	domain: string
	gid: string
	level: string
	inputTask: string  // HTML контент
}

// Параметры URLSearchParams для сектора
export interface SectorPayloadParams {
	domain: string
	gid: string
	level: string
	txtSectorName: string
	savesector: string
	[key: `txtAnswer_${number}`]: string
	[key: `ddlAnswerFor_${number}`]: string
}

// Параметры URLSearchParams для бонуса
export interface BonusPayloadParams {
	domain: string
	gid: string
	level: string
	txtBonusName: string
	txtTask: string
	txtHelp?: string
	txtHours: string
	txtMinutes: string
	txtSeconds: string
	negative?: 'on'
	chkDelay?: 'on'
	txtDelayHours?: string
	txtDelayMinutes?: string
	txtDelaySeconds?: string
	chkRelativeLimit?: 'on'
	txtValidHours?: string
	txtValidMinutes?: string
	txtValidSeconds?: string
	rbAllLevels: '0' | '1'
	[key: `answer_-${number}`]: string
	[key: string]: string | undefined  // Для динамических полей уровней
}

// Функция-строитель пейлоада
export type PayloadBuilder<T extends BasePayloadData> = (data: T) => globalThis.URLSearchParams

// Результат загрузки
export interface UploadResult {
	success: boolean
	message?: string
	error?: string
	details?: unknown
}

// Результат добавления кодов
export interface AddCodesResult {
	added: number      // Количество добавленных кодов
	duplicates: number // Количество пропущенных дубликатов
	total: number      // Общее количество кодов
}

// Прогресс загрузки
export interface UploadProgress {
	current: number
	total: number
	currentItem?: string
	percentage: number
	isPaused: boolean
	errors: string[]
}

// Настройки загрузки
export interface UploadSettings {
	sleepMs?: number         // Задержка между запросами
	retryAttempts?: number   // Количество попыток
	retryDelay?: number      // Задержка между попытками
}

// Общий тип для всех данных пейлоадов
export type PayloadData = TaskPayloadData | SectorPayloadData | BonusPayloadData

// ===== STORE STATE =====

// Общие типы для store
export interface LevelStoreState {
	// Основные данные
	levelType: LevelTypeId  // Исправлено: должен быть LevelTypeId, а не string
	subtypeId?: string
	dimension?: number

	// Табы
	tabs: TabData[]
	activeTabIndex: number

	// Настройки
	config: {
		sectorMode: SectorMode
		bonusTime: TimeValue
		closedPattern?: string
		blockOrder?: number[]     // Порядок блоков для предпросмотра (сохраняется между сессиями)
		[key: string]: unknown
	}

	// Загрузка
	uploadProgress?: UploadProgress

	// История действий (для undo/redo)
	history?: {
		past: unknown[]
		future: unknown[]
	}
}
