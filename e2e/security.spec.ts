import { test, expect } from "@playwright/test";
const attack =
  '<img src="https://invalid.example/x" onerror="alert(1)"><svg onload="alert(2)">';
for (const field of ["name", "date", "id"]) {
  test(`篡改 ${field} 不执行 HTML，原始存储保持不变`, async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-05T12:00:00+08:00") });
    const document = {
      schemaVersion: 1,
      startDate: "2026-10-05",
      runs: [
        { id: "a", date: "2026-10-05", distanceMeters: 5000, [field]: attack },
      ],
    };
    const raw = JSON.stringify(document);
    await page.addInitScript(
      (raw) => localStorage.setItem("running-tracker:v1", raw),
      raw,
    );
    const dialogs: string[] = [];
    const external: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    page.on("request", (request) => {
      if (request.url().startsWith("https://invalid.example"))
        external.push(request.url());
    });
    await page.goto("/");
    if (field === "id")
      await expect(
        page.getByRole("heading", { name: "今天已完成", exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("heading", { name: "记录暂时无法打开", exact: true }),
      ).toBeVisible();
    expect(await page.locator("img,svg").count()).toBe(0);
    expect(
      await page.evaluate(() => localStorage.getItem("running-tracker:v1")),
    ).toBe(raw);
    expect(dialogs).toEqual([]);
    expect(external).toEqual([]);
  });
}
test("响应包含基本安全头", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("script-src 'self'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
});
