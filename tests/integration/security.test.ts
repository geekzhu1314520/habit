import { expect, it } from "vitest";
import {
  createLocalStore,
  KEY,
  MAX_STORAGE_CHARS,
} from "../../src/storage/local-store";
import { validate, MAX_RUNS } from "../../src/domain/model";
import { mount } from "../../src/ui/app";
import { escapeHtml } from "../../src/ui/html";
const clean = {
  schemaVersion: 1,
  startDate: "2026-10-01",
  runs: [{ id: "a", date: "2026-10-01", distanceMeters: 5000 }],
};
const payload = '<img src=x onerror="alert(1)"><svg onload=alert(2)>';
it("HTML 样式的名称文本不能生成元素", () => {
  const host = document.createElement("div");
  host.innerHTML = escapeHtml(payload);
  expect(host.textContent).toBe(payload);
  expect(host.querySelector("img,svg,script")).toBeNull();
});
it.each([
  { ...clean, name: payload },
  { ...clean, runs: [{ ...clean.runs[0], name: payload }] },
  { ...clean, startDate: payload },
  { ...clean, runs: [{ ...clean.runs[0], date: payload }] },
  { ...clean, runs: [{ ...clean.runs[0], distanceMeters: payload }] },
])("篡改存储拒绝载入，保留原始数据 %#", (value) => {
  const raw = JSON.stringify(value);
  localStorage.setItem(KEY, raw);
  document.body.innerHTML = '<div id="app"></div>';
  const stop = mount(document.querySelector("#app")!, () => "2026-10-02");
  expect(document.body.textContent).toContain("无法读取");
  expect(document.querySelector("img,svg,script")).toBeNull();
  expect(localStorage.getItem(KEY)).toBe(raw);
  stop();
});
it("拒绝原型与额外字段", () => {
  expect(() =>
    validate(
      JSON.parse(
        '{"schemaVersion":1,"startDate":"2026-10-01","runs":[],"__proto__":{"polluted":true}}',
      ),
      "2026-10-02",
    ),
  ).toThrow();
  expect(() =>
    validate(Object.assign(Object.create(clean), {}), "2026-10-02"),
  ).toThrow();
});
it("拒绝超长 id", () =>
  expect(() =>
    validate(
      { ...clean, runs: [{ ...clean.runs[0], id: "a".repeat(129) }] },
      "2026-10-02",
    ),
  ).toThrow());
it("限制记录数量", () =>
  expect(() =>
    validate(
      {
        ...clean,
        runs: Array.from({ length: MAX_RUNS + 1 }, (_, i) => ({
          ...clean.runs[0],
          id: String(i),
        })),
      },
      "2026-10-02",
    ),
  ).toThrow());
it("过大的原始 JSON 在解析前拒绝且不覆盖", () => {
  const raw = " ".repeat(MAX_STORAGE_CHARS + 1);
  localStorage.setItem(KEY, raw);
  expect(createLocalStore().load()).toMatchObject({
    ok: false,
    error: { code: "INVALID_DATA" },
  });
  expect(localStorage.getItem(KEY)).toBe(raw);
});
