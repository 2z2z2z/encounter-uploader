import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:5173',
		viewport: { width: 1920, height: 1080 },
		screenshot: 'only-on-failure',
		video: 'off',
	},
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
		},
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
})


