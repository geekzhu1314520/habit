import { expect, it } from "vitest";
import {
  addDays,
  validDate,
  targetMeters,
  localToday,
} from "../../src/domain/date";
it.each([
  ["2026-12-31", "2027-01-02"],
  ["2024-02-28", "2024-03-01"],
  ["2026-03-07", "2026-03-09"],
])("日历加两天 %s", (date, result) => expect(addDays(date, 2)).toBe(result));
it.each(["bad", "2026-02-29", "2026-13-01", "0000-01-01"])(
  "拒绝无效日期 %s",
  (date) => expect(validDate(date)).toBe(false),
);
it("周末门槛为十公里", () => {
  expect(targetMeters("2026-10-10")).toBe(10000);
  expect(targetMeters("2026-10-11")).toBe(10000);
  expect(targetMeters("2026-10-09")).toBe(5000);
});
it("使用本地日期", () =>
  expect(localToday(new Date(2026, 9, 1, 23, 59))).toBe("2026-10-01"));
