import { test, expect } from "@playwright/test";
test("记录、补录、漏跑、编辑和删除完整流程", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      errors.push(message.text());
  });
  await page.clock.install({ time: new Date("2026-10-05T12:00:00+08:00") });
  await page.goto("/");
  await page.getByRole("button", { name: "开始跑步计划 →" }).click();
  await expect(
    page.getByRole("heading", { name: "今天该跑", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#history")).not.toContainText("漏跑");
  for (const km of ["3", "2"]) {
    await page.getByRole("button", { name: "记录跑步 ＋" }).click();
    await page.getByLabel("本次距离（公里）").fill(km);
    await page.getByRole("button", { name: "保存跑步" }).click();
  }
  await expect(page.locator("[data-count]")).toHaveText("2");
  await expect(page.locator("[data-meters]")).toHaveText("5");
  await expect(page.locator(".schedule")).toContainText("2026-10-07");
  await page.reload();
  await expect(page.locator("[data-run]")).toHaveCount(2);
  await page.clock.fastForward(3 * 24 * 60 * 60 * 1000);
  await expect(
    page.getByRole("heading", { name: "上次计划未完成", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#history")).toContainText("2026-10-07");
  await page.getByRole("button", { name: "记录跑步 ＋" }).click();
  await page.getByLabel("本次距离（公里）").fill("5");
  await page.getByRole("button", { name: "保存跑步" }).click();
  await expect(page.locator(".schedule")).toContainText("2026-10-10");
  await page.getByRole("button", { name: "编辑", exact: true }).first().click();
  await page.getByLabel("本次距离（公里）").fill("4");
  await page.getByRole("button", { name: "保存跑步" }).click();
  await expect(
    page.getByRole("heading", { name: "今天尚未完成", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".schedule")).toContainText("2026-10-07");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "删除", exact: true }).first().click();
  await expect(page.locator("[data-count]")).toHaveText("2");
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("周末门槛按当天累计十公里", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-10T12:00:00+08:00") });
  await page.goto("/");
  await page.getByRole("button", { name: "开始跑步计划 →" }).click();
  for (const km of ["6", "4"]) {
    await page.getByRole("button", { name: "记录跑步 ＋" }).click();
    await page.getByLabel("本次距离（公里）").fill(km);
    await page.getByRole("button", { name: "保存跑步" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "今天已完成", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".schedule")).toContainText("2026-10-12");
});
