/**
 * Типы для пейлоадов API level-system
 */

import type { Answer } from './fields'

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


