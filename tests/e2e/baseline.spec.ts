import { test, expect } from '@playwright/test'

async function goToUploadAndSelectType(page, type: 'olymp127' | '100500') {
	await page.goto('/login')
	await page.getByPlaceholder('Логин').fill('test')
	await page.getByPlaceholder('Пароль').fill('test')
	await page.getByRole('button', { name: 'Войти' }).click()

	await page.waitForURL('**/settings')
	await page.getByPlaceholder('Например, 126').fill('127')
	await page.getByPlaceholder('ID вашей игры').fill('1')
	await page.getByPlaceholder('№ уровня').fill('1')
	const typeSelect = page.locator('select')
	await typeSelect.selectOption(type === '100500' ? '100500' : 'olymp127')
	await page.getByRole('button', { name: 'Продолжить' }).click()
	await page.waitForURL('**/upload')
}

test.describe('Baseline UI snapshots', () => {
	test('login page', async ({ page }) => {
		await page.goto('/login')
		await expect(page).toHaveScreenshot('login.png')
	})

	test('settings page', async ({ page }) => {
		await page.goto('/settings')
		await expect(page).toHaveScreenshot('settings.png')
	})

	test('upload page - olymp127', async ({ page }) => {
		await goToUploadAndSelectType(page, 'olymp127')
		await expect(page).toHaveScreenshot('upload-olymp127.png')
		// Открываем предпросмотр
		const previewBtn = page.getByRole('button', { name: 'Предпросмотр' })
		if (await previewBtn.isVisible()) {
			await previewBtn.click()
			await expect(page).toHaveScreenshot('upload-olymp127-preview.png')
		}
	})

	test('upload page - 100500', async ({ page }) => {
		await goToUploadAndSelectType(page, '100500')
		await expect(page).toHaveScreenshot('upload-100500.png')
	})
})


