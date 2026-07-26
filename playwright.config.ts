import { defineConfig } from '@playwright/test';

export default defineConfig({
	// Port 5173 matches ORIGIN in .env; better-auth rejects requests from any other origin
	webServer: {
		command: 'npm run build && npm run preview -- --port 5173',
		port: 5173,
		reuseExistingServer: false,
		timeout: 180_000
	},
	testMatch: '**/*.e2e.{ts,js}',
	// Use the system Chrome instead of a downloaded chromium build
	use: { channel: 'chrome' }
});
