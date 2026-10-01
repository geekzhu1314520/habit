import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mount } from "../../src/ui/app";
import { KEY } from "../../src/storage/local-store";
let dispose = () => {};
const initial = { schemaVersion: 1, startDate: "2026-10-05", runs: [] };
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<main id="app"></main>';
});
afterEach(() => {
  dispose();
  vi.restoreAllMocks();
});
function open() {
  dispose = mount(document.querySelector("#app")!, () => "2026-10-06");
}
it("确认重置只清除自己的损坏数据", () => {
  localStorage.setItem(KEY, "broken");
  localStorage.setItem("other", "keep");
  open();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  document.querySelector<HTMLButtonElement>("[data-reset]")!.click();
  expect(localStorage.getItem(KEY)).toBeNull();
  expect(localStorage.getItem("other")).toBe("keep");
  expect(document.querySelector("[name=startDate]")).not.toBeNull();
});
it("取消恢复保留原值", () => {
  localStorage.setItem(KEY, "broken");
  open();
  vi.spyOn(window, "confirm").mockReturnValue(false);
  document.querySelector<HTMLButtonElement>("[data-reset]")!.click();
  expect(localStorage.getItem(KEY)).toBe("broken");
});
it("读取权限禁用显示错误", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw Error("denied");
  });
  open();
  expect(document.body.textContent).toContain("无法读取");
});
it("外部变更不静默覆盖，重新加载保留草稿", () => {
  localStorage.setItem(KEY, JSON.stringify(initial));
  open();
  document.querySelector<HTMLButtonElement>("[data-add]")!.click();
  document.querySelector<HTMLInputElement>("[name=distance]")!.value = "3";
  const changed = {
    ...initial,
    runs: [{ id: "external", date: "2026-10-06", distanceMeters: 2000 }],
  };
  localStorage.setItem(KEY, JSON.stringify(changed));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  document
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
  expect(JSON.parse(localStorage.getItem(KEY)!).runs).toHaveLength(1);
  expect(document.body.textContent).toContain("其他标签页");
  document.querySelector<HTMLButtonElement>("[data-reload]")!.click();
  expect(
    document.querySelector<HTMLInputElement>("[name=distance]")!.value,
  ).toBe("3");
  document
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
  expect(JSON.parse(localStorage.getItem(KEY)!).runs).toHaveLength(2);
});
it("重新加载损坏的外部数据时仍保留草稿", () => {
  localStorage.setItem(KEY, JSON.stringify(initial));
  open();
  document.querySelector<HTMLButtonElement>("[data-add]")!.click();
  document.querySelector<HTMLInputElement>("[name=distance]")!.value = "3";
  localStorage.setItem(KEY, "broken");
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  document.querySelector<HTMLButtonElement>("[data-reload]")!.click();
  expect(document.body.textContent).toContain("无法读取");
  expect(
    document.querySelector<HTMLInputElement>("[name=distance]")?.value,
  ).toBe("3");
  expect(localStorage.getItem(KEY)).toBe("broken");
});
it('其他标签页清空计划时保留输入，直到用户明确取消', () => {
  localStorage.setItem(KEY, JSON.stringify(initial)); open();
  document.querySelector<HTMLButtonElement>('[data-add]')!.click();
  document.querySelector<HTMLInputElement>('[name=distance]')!.value = '3';
  localStorage.removeItem(KEY); window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  document.querySelector<HTMLButtonElement>('[data-reload]')!.click();
  expect(document.querySelector<HTMLInputElement>('[name=distance]')?.value).toBe('3');
  expect(localStorage.getItem(KEY)).toBeNull();
});
