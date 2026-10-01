import { test, expect } from "@playwright/test";
test("窄屏键盘记录与可读布局", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.install({ time: new Date("2026-10-05T12:00:00+08:00") });
  await page.goto("/");
  await page.getByLabel("开始日期").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "今天该跑", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "记录跑步 ＋" }).click();
  await page.getByLabel("本次距离（公里）").fill("5");
  await page.getByRole("button", { name: "保存跑步" }).click();
  await expect(
    page.getByRole("heading", { name: "今天已完成", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .getByRole("button", { name: "记录跑步 ＋" })
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
