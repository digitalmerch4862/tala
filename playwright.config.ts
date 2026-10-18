import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: 'on-first-retry',
    permissions: ['microphone', 'clipboard-read', 'clipboard-write'],
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['microphone', 'clipboard-read', 'clipboard-write'],
        launchOptions: {
          executablePath: process.env.CHROMIUM_BIN || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 5173',
    port: 5173,
    reuseExistingServer: true,
  },
});
