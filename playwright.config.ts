import { existsSync } from "node:fs";
import { chromium, defineConfig } from "@playwright/test";
const port = process.env.HABIT_TEST_PORT ?? "5173";
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    timezoneId: "Asia/Shanghai",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel:
          process.env.PLAYWRIGHT_CHANNEL ??
          (existsSync(chromium.executablePath()) ? undefined : "chrome"),
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
