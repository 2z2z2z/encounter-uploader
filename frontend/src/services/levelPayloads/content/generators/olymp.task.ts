/**
 * Генератор контента Task пейлоада для Олимпийки
 * 
 * Создает HTML таблицу на основе размерности и данных ответов.
 * Поддерживает любые поля из реестра полей через конфигурацию.
 */

import type { ContentGeneratorContext } from "@/entities/level/types"
import type { FieldId } from "@/entities/level/types"
import { formatClosedText, generateOlympTableStyles } from '../../utils'
import { generateOlympLayout } from '@/utils/olymp'

/**
 * Генератор HTML контента для Task пейлоада Олимпийки
 * 
 * Создает HTML таблицу с размерностью из контекста и данными из указанных полей.
 * Поля настраиваются через конфиг - можно использовать closedText, displayText или другие.
 * 
 * @param context - Контекст генерации с данными и настройками
 * @returns HTML строка с таблицей Олимпийки
 */
export const olympTaskGenerator = (context: ContentGeneratorContext): string => {
	const { answers, fields, dimension, levelId } = context
	
	// Валидация обязательных параметров
	if (!dimension) {
		throw new Error('Dimension is required for Olymp task generator')
	}
	
	if (!levelId) {
		throw new Error('Level ID is required for Olymp task generator')
	}
	
	// CSS стили для таблицы
	const styles = generateOlympTableStyles()
	
	// Генерация структуры таблицы на основе размерности
	const layout = generateOlympLayout(dimension, levelId)
	
	// Построение HTML таблицы
	let html = styles + '<table class="olymp">'
	
	layout.forEach((row) => {
		html += '<tr>'
		row.forEach((cell) => {
			if (!cell.id) return
			
			// Извлечение номера ячейки из ID (формат: "levelId_01", "levelId_02", etc.)
			const num = parseInt(cell.id.split('_')[1], 10)
			const answerIndex = num - 1
			
			// Получение данных ответа (с проверкой границ массива)
			const answer = answers[answerIndex]
			if (!answer) {
				// Если ответа нет, создаем пустую ячейку
				const rsAttr = cell.rs ? `rowspan="${cell.rs}"` : ''
				html += `<td id="${cell.id}" ${rsAttr}></td>`
				return
			}
			
			// Получение контента из полей (универсальная логика)
			const content = getContentFromFields(answer, fields)
			
			// Добавление ячейки в таблицу
			const rsAttr = cell.rs ? `rowspan="${cell.rs}"` : ''
			html += `<td id="${cell.id}" ${rsAttr}>${content}</td>`
		})
		html += '</tr>'
	})
	
	html += '</table>'
	return html
}

/**
 * Извлечение контента из ответа на основе указанных полей
 * 
 * Функция читает поля из fields массива и формирует контент.
 * Поддерживает несколько полей - объединяет их через пробел.
 * 
 * @param answer - Данные ответа
 * @param fields - Поля для извлечения (например: ['closedText', 'displayText'])
 * @returns Отформатированный контент для ячейки
 */
const getContentFromFields = (
	answer: ContentGeneratorContext['answers'][0],
	fields: FieldId[]
): string => {
	const contents: string[] = []
	
	// Обрабатываем каждое поле из конфигурации
	for (const fieldId of fields) {
		let fieldContent = ''
		
		switch (fieldId) {
			case 'closedText':
				fieldContent = answer.closedText || ''
				break
				
			case 'displayText':
				fieldContent = answer.displayText || ''
				break
				
			case 'sectorName':
				fieldContent = answer.sectorName || ''
				break
				
			case 'bonusName':
				fieldContent = answer.bonusName || ''
				break
				
			case 'bonusTask':
				fieldContent = answer.bonusTask || ''
				break
				
			case 'hint':
				fieldContent = answer.hint || ''
				break
				
			// Сложные поля
			case 'answer':
				// Первый вариант ответа или пустая строка
				fieldContent = answer.variants[0] || ''
				break
				
			case 'bonusTime': {
				// Форматированное время
				const bt = answer.bonusTime
				if (bt && (bt.hours || bt.minutes || bt.seconds)) {
					const sign = bt.negative ? '-' : ''
					fieldContent = `${sign}${bt.hours}:${bt.minutes.toString().padStart(2, '0')}:${bt.seconds.toString().padStart(2, '0')}`
				}
				break
			}
				
			case 'delay': {
				// Форматированное время задержки
				const delay = answer.delay
				if (delay && (delay.hours || delay.minutes || delay.seconds)) {
					fieldContent = `${delay.hours}:${delay.minutes.toString().padStart(2, '0')}:${delay.seconds.toString().padStart(2, '0')}`
				}
				break
			}
				
			case 'limit': {
				// Форматированное время ограничения
				const limit = answer.limit
				if (limit && (limit.hours || limit.minutes || limit.seconds)) {
					fieldContent = `${limit.hours}:${limit.minutes.toString().padStart(2, '0')}:${limit.seconds.toString().padStart(2, '0')}`
				}
				break
			}
				
			case 'bonusLevels':
				// Список уровней бонуса
				if (answer.bonusLevels?.length) {
					fieldContent = answer.bonusLevels.join(', ')
				}
				break
				
			// Булевы поля
			case 'sector':
				fieldContent = answer.sector ? '✓' : ''
				break
				
			case 'bonus':
				fieldContent = answer.bonus ? '✓' : ''
				break
				
			default:
				console.warn(`[olympTaskGenerator] Unknown field: ${fieldId}`)
		}
		
		if (fieldContent) {
			contents.push(fieldContent)
		}
	}
	
	// Объединяем все содержимое и применяем formatClosedText для обработки изображений
	const rawContent = contents.join(' ').trim()
	return formatClosedText(rawContent)
}