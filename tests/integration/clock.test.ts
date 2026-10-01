import { afterEach, expect, it, vi } from "vitest";
import { mount } from "../../src/ui/app";
import { KEY } from "../../src/storage/local-store";
afterEach(() => vi.useRealTimers());
it("跨午夜后从今天待完成变为漏跑，不清除草稿", () => {
  vi.useFakeTimers();
  let today = "2026-10-05";
  localStorage.setItem(
    KEY,
    JSON.stringify({ schemaVersion: 1, startDate: today, runs: [] }),
  );
  document.body.innerHTML = '<main id="app"></main>';
  const dispose = mount(document.querySelector("#app")!, () => today);
  expect(document.body.textContent).toContain("今天该跑");
  document.querySelector<HTMLButtonElement>("[data-add]")!.click();
  document.querySelector<HTMLInputElement>("[name=distance]")!.value = "3";
  today = "2026-10-06";
  vi.advanceTimersByTime(60000);
  expect(document.body.textContent).toContain("上次计划未完成");
  expect(
    document.querySelector<HTMLInputElement>("[name=distance]")!.value,
  ).toBe("3");
  dispose();
});
it("恢复前台更新今天", () => {
  let today = "2026-10-05";
  localStorage.setItem(
    KEY,
    JSON.stringify({ schemaVersion: 1, startDate: today, runs: [] }),
  );
  document.body.innerHTML = '<main id="app"></main>';
  const dispose = mount(document.querySelector("#app")!, () => today);
  today = "2026-10-06";
  window.dispatchEvent(new Event("focus"));
  expect(document.body.textContent).toContain("上次计划未完成");
  dispose();
});
it("跨午夜同步历史漏跑且可保存新一天的日期", () => {
  vi.useFakeTimers();
  let today = "2026-10-05";
  localStorage.setItem(
    KEY,
    JSON.stringify({ schemaVersion: 1, startDate: today, runs: [] }),
  );
  document.body.innerHTML = '<main id="app"></main>';
  const dispose = mount(document.querySelector("#app")!, () => today);
  document.querySelector<HTMLButtonElement>("[data-add]")!.click();
  today = "2026-10-06";
  vi.advanceTimersByTime(1000);
  expect(document.querySelector("#history")!.textContent).toContain("漏跑");
  document.querySelector<HTMLInputElement>("[name=date]")!.value = today;
  document.querySelector<HTMLInputElement>("[name=distance]")!.value = "5";
  document
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
  expect(JSON.parse(localStorage.getItem(KEY)!).runs).toHaveLength(1);
  dispose();
});
