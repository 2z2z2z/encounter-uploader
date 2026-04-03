/**
 * Обработка содержимого картинки
 *
 * Определяет тип содержимого (URL, HTML с картинкой, текст/SVG) и оборачивает
 * голые URL в тег <img>. HTML и текст оставляет как есть.
 *
 * @param content - Содержимое closedPic или openPic
 * @returns Обработанное содержимое
 */
export const processPicContent = (content: string): string => {
	const trimmed = content.trim()

	// HTML с <a><img></a> - оставляем как есть
	if (/<a[^>]*>.*?<img[^>]*>.*?<\/a>/i.test(trimmed)) {
		return trimmed
	}

	// HTML с <img> - оставляем как есть
	if (/<img[^>]*>/i.test(trimmed)) {
		return trimmed
	}

	// URL (любой) - оборачиваем в <img>
	if (/^https?:\/\/.+/i.test(trimmed)) {
		return `<img src="${trimmed}" alt="" width="120" height="120" />`
	}

	// Текст/SVG - оставляем как есть
	return trimmed
}
