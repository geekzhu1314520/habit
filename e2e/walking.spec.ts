import { test, expect } from "@playwright/test";
test("步行开关按构建配置生效并独立持久化", async ({ page }) => {
  await page.goto("/");
  const title = page.getByRole("heading", {
    name: "步行 · 实验功能",
    exact: true,
  });
  if (process.env.VITE_WALKING_ENABLED !== "true") {
    await expect(title).toHaveCount(0);
    return;
  }
  await expect(title).toBeVisible();
  await page
    .getByRole("button", { name: "标记今天步行完成", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "今天已完成", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "今天已完成", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "开始跑步计划 →" }),
  ).toBeVisible();
});
