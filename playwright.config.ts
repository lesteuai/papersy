import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testMatch: '**/*.e2e.{ts,js}',
	// Use the system Chrome instead of a downloaded chromium build
	use: { channel: 'chrome' }
});
