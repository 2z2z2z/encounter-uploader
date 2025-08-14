import { serializeCsv, parseCsv, downloadBlob } from '../../../utils/csv'
import type { Row100500 } from '../../../types/upload'

// Row100500 импортирован из единого типа

export interface TabData100500 {
	sectorPattern: string
	bonusPattern: string
	bonusTaskPattern?: string
	bonusHintPattern?: string
	quickTime: { hours: number; minutes: number; seconds: number; negative: boolean }
	rows: Row100500[]
}

export function export100500(tabs: TabData100500[], format: 'json' | 'csv') {
	if (format === 'csv') {
		const rows: Array<Record<string, string>> = []
		tabs.forEach((t, tabIdx) => {
			t.rows.forEach((r) => {
				rows.push({
					tab: String(tabIdx + 1),
					number: String(r.number || ''),
					variants: (Array.isArray(r.variants) ? r.variants : []).join(' | '),
					inSector: r.inSector ? '1' : '0',
					inBonus: r.inBonus ? '1' : '0',
					bonusHours: String(r.bonusTime?.hours ?? ''),
					bonusMinutes: String(r.bonusTime?.minutes ?? ''),
					bonusSeconds: String(r.bonusTime?.seconds ?? ''),
					bonusNegative: r.bonusTime?.negative ? '1' : '0',
					delayHours: String(r.delay?.hours ?? ''),
					delayMinutes: String(r.delay?.minutes ?? ''),
					delaySeconds: String(r.delay?.seconds ?? ''),
					validHours: String(r.relativeLimit?.hours ?? ''),
					validMinutes: String(r.relativeLimit?.minutes ?? ''),
					validSeconds: String(r.relativeLimit?.seconds ?? ''),
					sectorName: r.sectorName || '',
					bonusName: r.bonusName || '',
					bonusTask: r.bonusTask || '',
					bonusHint: r.bonusHint || '',
					allLevels: r.allLevels ? '1' : '0',
					targetLevels: Array.isArray(r.targetLevels) ? r.targetLevels.join(';') : '',
				})
			})
		})
		const csv = serializeCsv(rows)
		downloadBlob(csv, '100500.csv', 'text/csv')
	} else {
		const plain = tabs.map((t) => ({
			sectorPattern: t.sectorPattern,
			bonusPattern: t.bonusPattern,
			bonusTaskPattern: t.bonusTaskPattern || '',
			bonusHintPattern: t.bonusHintPattern || '',
			quickTime: { ...t.quickTime },
			rows: t.rows,
		}))
		const blob = new Blob([JSON.stringify(plain, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = '100500.json'
		a.click()
		URL.revokeObjectURL(url)
	}
}

export function import100500(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0]
	if (!file) return Promise.resolve<TabData100500[] | null>(null)
	return new Promise((resolve) => {
		const reader = new FileReader()
		reader.onload = () => {
			try {
				const text = String(reader.result || '')
				const trimmed = text.trim()
				if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
					const arr = JSON.parse(text)
					if (Array.isArray(arr)) {
						resolve(arr as TabData100500[])
					} else {
						alert('Неверный формат JSON')
						resolve(null)
					}
				} else {
					const rows = parseCsv(text)
					if (!rows.length) {
						alert('CSV пустой')
						resolve(null)
						return
					}
					const byTab = new Map<number, Array<Record<string, string>>>()
					for (const r of rows) {
						const t = Math.max(1, Number(r.tab) || 1)
						if (!byTab.has(t)) byTab.set(t, [])
						byTab.get(t)!.push(r)
					}
					const maxTab = Math.max(...Array.from(byTab.keys()))
					const newTabs: TabData100500[] = []
					for (let t = 1; t <= maxTab; t++) {
						const list = (byTab.get(t) || [])
						const mapped = list.map((r: Record<string, string>) => ({
							number: Number(r.number) || 0,
							variants: (r.variants || '')
								.split('|')
								.map((s: string) => s.trim())
								.filter(Boolean),
							bonusTime: {
								hours: Number(r.bonusHours) || 0,
								minutes: Number(r.bonusMinutes) || 0,
								seconds: Number(r.bonusSeconds) || 0,
								negative: r.bonusNegative === '1' || /true|-/i.test(r.bonusNegative || ''),
							},
							delay: {
								hours: Number(r.delayHours) || 0,
								minutes: Number(r.delayMinutes) || 0,
								seconds: Number(r.delaySeconds) || 0,
							},
							relativeLimit: {
								hours: Number(r.validHours) || 0,
								minutes: Number(r.validMinutes) || 0,
								seconds: Number(r.validSeconds) || 0,
							},
							sectorName: r.sectorName || '',
							bonusName: r.bonusName || '',
							bonusTask: r.bonusTask || '',
							bonusHint: r.bonusHint || '',
							inSector: r.inSector === '1' || /true/i.test(r.inSector || ''),
							inBonus: r.inBonus === '1' || /true/i.test(r.inBonus || ''),
							targetLevels: (r.targetLevels || '')
								.split(';')
								.map((s: string) => s.trim())
								.filter(Boolean),
							allLevels: r.allLevels === '1' || /true/i.test(r.allLevels || ''),
						}))
						mapped.sort((a, b) => a.number - b.number)
						const normalized = mapped.map((a: any, idx: number) => ({ ...a, number: idx + 1 }))
						newTabs.push({
							sectorPattern: '',
							bonusPattern: '',
							quickTime: { hours: 0, minutes: 0, seconds: 0, negative: false },
							rows: normalized,
						})
					}
					resolve(newTabs)
				}
			} catch (err) {
				alert('Ошибка при импорте: ' + (err as any)?.message)
				resolve(null)
			}
		}
		reader.readAsText(file)
	})
}


