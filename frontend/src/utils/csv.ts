// Простая утилита генерации и разбора CSV без внешних зависимостей.
// Поддерживает кавычки и запятые/переводы строк внутри значений.

export type CsvRow = Record<string, string>

export function serializeCsv(rows: CsvRow[], delimiter = ','): string {
	if (!rows.length) return ''
	const headers = Object.keys(rows[0])
	const esc = (val: unknown): string => {
		const s = val == null ? '' : String(val)
		const needsQuotes = s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(delimiter)
		const escaped = s.replace(/"/g, '""')
		return needsQuotes ? `"${escaped}"` : escaped
	}
	const headerLine = headers.map((h) => esc(h)).join(delimiter)
	const lines = rows.map((r) => headers.map((h) => esc(r[h])).join(delimiter))
	return [headerLine, ...lines].join('\r\n')
}

export function parseCsv(text: string, delimiter = ','): CsvRow[] {
	const rows: CsvRow[] = []
	const lines = splitCsvLines(text)
	if (!lines.length) return rows
	const headers = parseCsvLine(lines[0], delimiter)
	for (let i = 1; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i], delimiter)
		if (cols.length === 1 && cols[0] === '') continue
		const row: CsvRow = {}
		headers.forEach((h, idx) => {
			row[h] = cols[idx] ?? ''
		})
		rows.push(row)
	}
	return rows
}

function splitCsvLines(text: string): string[] {
	// Учитываем CRLF/LF и пустые строки в конце
	return text.replace(/\uFEFF/g, '').split(/\r?\n/)
}

function parseCsvLine(line: string, delimiter = ','): string[] {
	const result: string[] = []
	let current = ''
	let inQuotes = false
	for (let i = 0; i < line.length; i++) {
		const ch = line[i]
		if (inQuotes) {
			if (ch === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"'
					i++
				} else {
					inQuotes = false
				}
			} else {
				current += ch
			}
		} else {
			if (ch === '"') {
				inQuotes = true
			} else if (ch === delimiter) {
				result.push(current)
				current = ''
			} else {
				current += ch
			}
		}
	}
	result.push(current)
	return result
}

export function downloadBlob(content: string, filename: string, mime: string) {
	const blob = new Blob([content], { type: mime })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}


