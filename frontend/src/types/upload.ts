// Единые типы и фабрики для полей заливки уровней

export interface Hms {
	hours: number
	minutes: number
	seconds: number
	negative?: boolean
}

export function createHms(hours = 0, minutes = 0, seconds = 0, negative = false): Hms {
	return { hours, minutes, seconds, negative }
}

export interface UploadAnswerCommon {
	number: number
	variants: string[]
	inSector: boolean
	inBonus: boolean
	bonusTime: Hms
	closedText: string
	displayText: string
}

export interface UploadBonusExtras {
	// Бонус-специфичные поля (используются не во всех пресетах)
	allLevels?: boolean
	delay?: Hms
	relativeLimit?: Hms
	bonusName?: string
	bonusTask?: string
	bonusHint?: string
	noHint?: boolean
	targetLevels?: string[]
}

export type UploadAnswer = UploadAnswerCommon & UploadBonusExtras

export function createEmptyAnswer(number: number): UploadAnswer {
	return {
		number,
		variants: [''],
		inSector: true,
		inBonus: true,
		bonusTime: createHms(),
		closedText: '',
		displayText: '',
	}
	// Доп. поля остаются необязательными
}

// Тип строки для пресета "100500" (вынесен сюда для переиспользования)
export interface Row100500 {
	number: number
	variants: string[]
	bonusTime: Hms
	delay: Hms
	relativeLimit: Hms
	sectorName: string
	bonusName: string
	bonusTask?: string
	bonusHint?: string
	inSector: boolean
	inBonus: boolean
	allLevels?: boolean
	targetLevels?: string[]
}


