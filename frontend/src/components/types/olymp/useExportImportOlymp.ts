import type { Ref } from 'vue'
import { serializeCsv, downloadBlob, parseCsv } from '../../../utils/csv'

// Тип минимального интерфейса стора, который нам нужен из useUploadStore
interface UploadStoreLike {
	$config?: unknown
	$state: any
	$patch: (payload: any) => void
	answers: Array<{
		number: number
		variants: string[]
		inSector: boolean
		inBonus: boolean
		bonusTime?: { hours: number; minutes: number; seconds: number; negative: boolean }
		closedText?: string
		displayText?: string
	}>
}

export function exportOlympDataAs(store: UploadStoreLike, format: 'json' | 'csv'): void {
	const { levelId, ...state } = store.$state as any
	if (format === 'csv') {
		const rows = store.answers.map((r) => ({
			number: String(r.number || ''),
			variants: (Array.isArray(r.variants) ? r.variants : []).join(' | '),
			inSector: r.inSector ? '1' : '0',
			inBonus: r.inBonus ? '1' : '0',
			bonusHours: String(r.bonusTime?.hours ?? ''),
			bonusMinutes: String(r.bonusTime?.minutes ?? ''),
			bonusSeconds: String(r.bonusTime?.seconds ?? ''),
			bonusNegative: r.bonusTime?.negative ? '1' : '0',
			closedText: r.closedText || '',
			displayText: r.displayText || '',
		}))
		const csv = serializeCsv(rows)
		downloadBlob(csv, 'encounter-olymp.csv', 'text/csv')
	} else {
		const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'encounter-olymp.json'
		a.click()
		URL.revokeObjectURL(url)
	}
}

export function importOlympData(e: Event, store: UploadStoreLike): void {
	const file = (e.target as HTMLInputElement).files?.[0]
	if (!file) return
	const reader = new FileReader()
	reader.onload = () => {
		try {
			const text = String(reader.result || '')
			const trimmed = text.trim()
			if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
				const obj = JSON.parse(text)
				if (Array.isArray(obj.answers) && obj.config) {
					const { levelId, ...rest } = obj
					store.$patch(rest)
				} else {
					alert('Неверный формат JSON')
				}
			} else {
				const rows = parseCsv(text)
				if (!rows.length) {
					alert('CSV пустой')
					return
				}
				const answers = rows.map((r) => ({
					number: Number(r.number) || 0,
					variants: (r.variants || '')
						.split('|')
						.map((s: string) => s.trim())
						.filter(Boolean),
					inSector: r.inSector === '1' || /true/i.test(r.inSector || ''),
					inBonus: r.inBonus === '1' || /true/i.test(r.inBonus || ''),
					bonusTime: {
						hours: Number(r.bonusHours) || 0,
						minutes: Number(r.bonusMinutes) || 0,
						seconds: Number(r.bonusSeconds) || 0,
						negative: r.bonusNegative === '1' || /true|-/i.test(r.bonusNegative || ''),
					},
					closedText: r.closedText || '',
					displayText: r.displayText || '',
				}))
				answers.sort((a, b) => a.number - b.number)
				const normalized = answers.map((a, idx) => ({ ...a, number: idx + 1 }))
				store.$patch({ answers: normalized })
			}
		} catch (err) {
			alert('Ошибка при импорте: ' + (err as any)?.message)
		}
	}
	reader.readAsText(file)
}


