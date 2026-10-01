import { test, expect } from "@playwright/test";
test("记录留在当前浏览器，重新打开保留，无外部请求", async ({
  page,
  context,
  browser,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:5173/")) external.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "开始跑步计划 →" }).click();
  await page.getByRole("button", { name: "记录跑步 ＋" }).click();
  await page.getByLabel("本次距离（公里）").fill("2");
  await page.getByRole("button", { name: "保存跑步" }).click();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.locator("[data-count]")).toHaveText("1");
  const separate = await browser.newContext();
  const fresh = await separate.newPage();
  await fresh.goto("http://127.0.0.1:5173/");
  await expect(
    fresh.getByRole("button", { name: "开始跑步计划 →" }),
  ).toBeVisible();
  await separate.close();
  expect(external).toEqual([]);
});
test("另一标签页写入后保留草稿并加载最新记录", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始跑步计划 →" }).click();
  const other = await context.newPage();
  await other.goto("/");
  await page.getByRole("button", { name: "记录跑步 ＋" }).click();
  await page.getByLabel("本次距离（公里）").fill("3");
  await other.getByRole("button", { name: "记录跑步 ＋" }).click();
  await other.getByLabel("本次距离（公里）").fill("2");
  await other.getByRole("button", { name: "保存跑步" }).click();
  await expect(
    page.getByRole("button", { name: "重新加载记录" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "重新加载记录" }).click();
  await expect(page.getByLabel("本次距离（公里）")).toHaveValue("3");
  await page.getByRole("button", { name: "保存跑步" }).click();
  await expect(page.locator("[data-count]")).toHaveText("2");
});
