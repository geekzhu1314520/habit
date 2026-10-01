import { beforeEach, afterEach, expect, it } from "vitest";
import { mount } from "../../src/ui/app";
import { KEY } from "../../src/storage/local-store";
let dispose: () => void;
beforeEach(() => {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      schemaVersion: 1,
      startDate: "2026-10-05",
      runs: [
        { id: "a", date: "2026-10-05", distanceMeters: 3000 },
        { id: "b", date: "2026-10-05", distanceMeters: 2000 },
      ],
    }),
  );
  document.body.innerHTML = '<main id="app"></main>';
  dispose = mount(document.querySelector("#app")!, () => "2026-10-06");
});
afterEach(() => dispose());
it("跨日期编辑保留 id，重算原日与次日", () => {
  document.querySelectorAll<HTMLButtonElement>("[data-edit]")[1].click();
  document.querySelector<HTMLInputElement>("[name=date]")!.value = "2026-10-06";
  document
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
  const data = JSON.parse(localStorage.getItem(KEY)!);
  expect(data.runs[1]).toEqual({
    id: "b",
    date: "2026-10-06",
    distanceMeters: 2000,
  });
  expect(document.body.textContent).toContain("上次计划未完成");
  expect(document.querySelectorAll("[data-run]")).toHaveLength(2);
});
it("取消编辑保持原记录", () => {
  const before = localStorage.getItem(KEY);
  document.querySelector<HTMLButtonElement>("[data-edit]")!.click();
  document.querySelector<HTMLInputElement>("[name=distance]")!.value = "8";
  document.querySelector<HTMLButtonElement>("[data-cancel]")!.click();
  expect(localStorage.getItem(KEY)).toBe(before);
});
