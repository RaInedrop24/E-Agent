import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  retries: 0,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: 'line',
  webServer: {
    command: 'npm run dev:3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120 * 1000
  }
});

