import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './e2e', use: { baseURL: 'http://127.0.0.1:5173', timezoneId: 'Asia/Shanghai', trace: 'retain-on-failure' }, projects: [{ name: 'chromium', use: { browserName: 'chromium' } }], webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI } });
