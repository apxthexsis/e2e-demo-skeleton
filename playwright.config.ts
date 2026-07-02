import { defineConfig, devices } from '@playwright/test';
import {
  EMPTY_STORAGE_STATE_PATH,
  STORAGE_STATE_PATH
} from './e2e/constants/demo.constants';

const APP_PORT = Number(process.env.APP_PORT || 4173);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${APP_PORT}`;
const IS_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  timeout: 60_000,
  fullyParallel: true,
  workers: IS_CI ? 1 : undefined,
  retries: IS_CI ? 1 : 0,
  forbidOnly: IS_CI,
  reporter: [
    ['line'],
    ['json', { outputFile: './e2e/results/results.json' }],
    ['html', { outputFolder: './e2e/test-reports', open: 'never' }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome']
  },
  projects: [
    {
      name: 'setup',
      testMatch: /setup\/.*\.spec\.ts/,
      use: {
        storageState: EMPTY_STORAGE_STATE_PATH
      },
      timeout: 120_000
    },
    {
      name: 'chromium',
      testIgnore: /setup\//,
      dependencies: ['setup'],
      use: {
        storageState: STORAGE_STATE_PATH
      }
    }
  ],
  webServer: {
    command: 'node app/server.js',
    url: `${BASE_URL}/health`,
    reuseExistingServer: !IS_CI,
    env: {
      PORT: String(APP_PORT)
    }
  }
});
