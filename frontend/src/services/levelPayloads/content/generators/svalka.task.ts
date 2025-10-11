/**
 * Генератор контента Task пейлоада для типа "Свалка картинками"
 *
 * Создает HTML с блоком-враппером и квадратными блоками на основе closedPic.
 */

import type { ContentGeneratorContext } from "@/entities/level/types"

interface PicBlock {
	index: number          // Исходный индекс (для id)
	content: string        // Содержимое closedPic или openPic
	tabName: string        // Имя таба (для отладки)
	answerNumber: number   // Номер ответа (для отладки)
}

/**
 * Генератор HTML контента для Task пейлоада типа svalka
 *
 * Собирает все closedPic или openPic со всех табов (в зависимости от fields),
 * перемешивает их случайным образом и создает сетку квадратных блоков.
 *
 * @param context - Контекст генерации с данными и настройками
 * @returns HTML строка с блоком-враппером и квадратными блоками
 */
export const svalkaTaskGenerator = (context: ContentGeneratorContext): string => {
	const { answers, levelId, fields } = context

	// Валидация обязательных параметров
	if (!levelId) {
		throw new Error('Level ID is required for svalka task generator')
	}

	// Определяем какое поле использовать - openPic или closedPic (по умолчанию closedPic)
	const useOpenPic = fields && fields.includes('openPic')

	// Сбор всех картинок со всех ответов
	const allBlocks: PicBlock[] = []
	let globalIndex = 1

	answers.forEach(answer => {
		const pics = useOpenPic ? (answer.openPic || []) : (answer.closedPic || [])
		pics.forEach(pic => {
			if (pic.trim()) {
				allBlocks.push({
					index: globalIndex++,
					content: pic,
					tabName: '', // Можно добавить если нужно
					answerNumber: answer.number
				})
			}
		})
	})

	if (allBlocks.length === 0) {
		return '<div style="max-width: 1080px; margin: 0 auto; padding: 20px;">Нет данных для отображения</div>'
	}

	// Применение порядка блоков из context (если задан)
	let orderedBlocks: PicBlock[]
	if (context.blockOrder && context.blockOrder.length === allBlocks.length) {
		// Используем фиксированный порядок из context
		orderedBlocks = context.blockOrder.map(idx => allBlocks[idx])
	} else {
		// Используем естественный порядок (без перемешивания)
		orderedBlocks = allBlocks
	}

	// Генерация HTML
	const styles = generateStyles()
	const showIds = context.showBlockIds || false
	const blocksHtml = orderedBlocks.map(block => generateBlock(block, levelId, showIds)).join('\n')

	return `${styles}
<div class="svalka-wrapper">
${blocksHtml}
</div>`
}

/**
 * Генерация CSS стилей для блока-враппера и квадратных блоков
 */
const generateStyles = (): string => {
	return `<style>
.svalka-wrapper {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px;
}

.svalka-block {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.svalka-block-id {
  position: absolute;
  top: 2px;
  left: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 4px;
  font-size: 10px;
  font-family: monospace;
  border-radius: 2px;
  z-index: 10;
}

.svalka-block img {
  max-width: 120px;
  max-height: 120px;
  object-fit: contain;
}

@media (max-width: 768px) {
  .svalka-wrapper {
    max-width: 100%;
    padding: 10px;
  }

  .svalka-block {
    width: calc(50% - 5px);
    height: auto;
    aspect-ratio: 1;
  }
}

@media (max-width: 480px) {
  .svalka-block {
    width: 100%;
  }
}
</style>`
}

/**
 * Генерация HTML для одного квадратного блока
 *
 * @param block - Данные блока
 * @param levelId - ID уровня
 * @returns HTML строка блока
 */
const generateBlock = (block: PicBlock, levelId: string | number, showId: boolean = false): string => {
	const blockId = `${levelId}_${String(block.index).padStart(2, '0')}`
	const processedContent = processContent(block.content)

	// Визуальная метка ID только для preview режима
	const idLabel = showId ? `<div class="svalka-block-id">${blockId}</div>` : ''

	return `  <div id="${blockId}" class="svalka-block">
    ${idLabel}
    ${processedContent}
  </div>`
}

/**
 * Обработка содержимого картинки
 *
 * Определяет тип содержимого (URL, HTML с картинкой, текст/SVG) и обрабатывает соответственно.
 *
 * @param content - Содержимое closedPic или openPic
 * @returns Обработанное содержимое
 */
const processContent = (content: string): string => {
	const trimmed = content.trim()

	// Проверка на HTML с <a><img></a>
	if (/<a[^>]*>.*?<img[^>]*>.*?<\/a>/i.test(trimmed)) {
		return trimmed // Оставляем как есть
	}

	// Проверка на HTML с <img>
	if (/<img[^>]*>/i.test(trimmed)) {
		return trimmed // Оставляем как есть
	}

	// Проверка на URL картинки (простая регулярка)
	if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmed)) {
		return `<img src="${trimmed}" alt="" width="120" height="120" />`
	}

	// Проверка на просто URL
	if (/^https?:\/\/.+/i.test(trimmed)) {
		return `<img src="${trimmed}" alt="" width="120" height="120" />`
	}

	// Иначе вставляем как текст
	return trimmed
}

