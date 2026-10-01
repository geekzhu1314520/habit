import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { mount } from "../../src/ui/app";
import { KEY } from "../../src/storage/local-store";
let dispose: () => void;
beforeEach(() => {
  localStorage.setItem(
    KEY,
    JSON.stringify({ schemaVersion: 1, startDate: "2026-10-01", runs: [] }),
  );
  document.body.innerHTML = '<main id="app"></main>';
  dispose = mount(document.querySelector("#app")!, () => "2026-10-08");
});
afterEach(() => {
  dispose();
  vi.restoreAllMocks();
});
function add(km: string) {
  document.querySelector<HTMLButtonElement>("[data-add]")!.click();
  document.querySelector<HTMLInputElement>("[name=distance]")!.value = km;
  document
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
}
it("同日相同距离真实保存为两次", () => {
  add("3");
  add("3");
  const { runs } = JSON.parse(localStorage.getItem(KEY)!);
  expect(runs).toHaveLength(2);
  expect(runs[0].id).not.toBe(runs[1].id);
});
it("无效距离保留输入", () => {
  add("1.0001");
  expect(document.body.textContent).toContain("最多三位小数");
  expect(
    document.querySelector<HTMLInputElement>("[name=distance]")!.value,
  ).toBe("1.0001");
});
it("取消不写入", () => {
  document.querySelector<HTMLButtonElement>("[data-add]")!.click();
  document.querySelector<HTMLButtonElement>("[data-cancel]")!.click();
  expect(JSON.parse(localStorage.getItem(KEY)!).runs).toHaveLength(0);
});
it("存储失败保留输入和旧数据", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("full");
  });
  add("3");
  expect(document.body.textContent).toContain("无法保存");
  expect(
    document.querySelector<HTMLInputElement>("[name=distance]")!.value,
  ).toBe("3");
  expect(JSON.parse(localStorage.getItem(KEY)!).runs).toHaveLength(0);
});
it("失败重试复用同一个记录 id", () => {
  const original = Storage.prototype.setItem;
  const attempts: string[] = [];
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
    this: Storage,
    key,
    value,
  ) {
    attempts.push(JSON.parse(value).runs[0].id);
    if (attempts.length === 1)
      throw new DOMException("full", "QuotaExceededError");
    original.call(this, key, value);
  });
  add("3");
  document
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
  expect(attempts).toHaveLength(2);
  expect(attempts[0]).toBe(attempts[1]);
});
it("验证失败标记输入字段，保存后焦点返回记录入口", () => {
  add("bad");
  expect(
    document.querySelector("[name=distance]")!.getAttribute("aria-invalid"),
  ).toBe("true");
  document.querySelector<HTMLInputElement>("[name=distance]")!.value = "3";
  document
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
  expect(document.activeElement).toBe(document.querySelector("[data-add]"));
});
