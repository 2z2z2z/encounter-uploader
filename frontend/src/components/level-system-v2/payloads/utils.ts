/**
 * Утилиты для работы с пейлоадами
 * 
 * Содержит переиспользуемые функции для всех типов пейлоадов.
 * Соблюдает DRY принцип.
 */

/**
 * Форматирование текста закрытого сектора
 * 
 * Если текст является URL (начинается с http/https), 
 * преобразует его в ссылку с изображением.
 * 
 * @param text - Исходный текст
 * @returns Отформатированный текст (может содержать HTML)
 */
export const formatClosedText = (text: string): string => {
	const trimmed = text.trim()
	if (/^https?:\/\//i.test(trimmed)) {
		return `<a href="${trimmed}" target="_blank"><img src="${trimmed}" style="max-width: 150px; max-height: 150px;"></a>`
	}
	return text
}

/**
 * Генерация стилей для HTML таблицы Олимпийки
 * 
 * @returns CSS стили в виде строки
 */
export const generateOlympTableStyles = (): string => {
	return `
    <style>
      .olymp {max-width: 1100px; width: 100%;margin: 10px 0;}
      .olymp td {
        border:1px solid #414141;
        padding:10px;
        width:120px!important;
        text-align:center;
        vertical-align:middle;
      }
      .up {color:#0F0;font-weight:bold;}
      .cols-wrapper {display: none;}
      h3 {display: none !important;}
      .timer, .bonus_count, .color_bonus, .color_correct {display: block !important;}
    </style>`
}