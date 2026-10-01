import { beforeEach, expect, it, vi } from "vitest";
import {
  mountWalking,
  walkingEnabled,
  WALK_KEY,
} from "../../src/features/walking";
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="walk"></div>';
});
it.each([undefined, "", "false", "1", "TRUE"])("默认关闭 %s", (value) =>
  expect(walkingEnabled(value)).toBe(false),
);
it("开启时可记录今天，刷新保持，关闭时不读取数据", () => {
  expect(walkingEnabled("true")).toBe(true);
  const host = document.querySelector<HTMLElement>("#walk")!;
  mountWalking(host, true, () => "2026-10-01");
  host.querySelector("button")!.click();
  expect(host.textContent).toContain("今天已完成");
  expect(JSON.parse(localStorage.getItem(WALK_KEY)!).days).toEqual([
    "2026-10-01",
  ]);
  mountWalking(host, true, () => "2026-10-01");
  expect(host.textContent).toContain("今天已完成");
  const spy = vi.spyOn(Storage.prototype, "getItem");
  mountWalking(host, false, () => "2026-10-01");
  expect(host.textContent).toBe("");
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});
it("损坏数据不覆盖，不冒充完成", () => {
  localStorage.setItem(WALK_KEY, "bad");
  const host = document.querySelector<HTMLElement>("#walk")!;
  mountWalking(host, true, () => "2026-10-01");
  expect(host.textContent).toContain("无法读取");
  expect(localStorage.getItem(WALK_KEY)).toBe("bad");
});
it("失败不显示成功", () => {
  const host = document.querySelector<HTMLElement>("#walk")!;
  mountWalking(host, true, () => "2026-10-01");
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error();
  });
  host.querySelector("button")!.click();
  expect(host.textContent).toContain("无法保存");
  expect(host.textContent).not.toContain("今天已完成");
  spy.mockRestore();
});
