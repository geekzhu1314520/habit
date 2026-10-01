import { expect, it } from "vitest";
import { schedule } from "../../src/domain/schedule";
import type { Run } from "../../src/domain/model";
function state(
  today: string,
  entries: [string, number][] = [],
  startDate = "2026-10-05",
) {
  const runs: Run[] = entries.map(([date, distanceMeters], i) => ({
    id: String(i),
    date,
    distanceMeters,
  }));
  return schedule({ schemaVersion: 1, startDate, runs }, today);
}
it("今天尚未完成不算漏跑", () => {
  expect(state("2026-10-05")).toMatchObject({
    dueDate: "2026-10-05",
    missed: [],
    status: "due",
  });
});
it("漏跑只标一次，不积累欠账", () => {
  expect(state("2026-10-09")).toMatchObject({
    dueDate: "2026-10-05",
    missed: ["2026-10-05"],
    status: "overdue",
  });
});
it("今天跑了三公里仍未完成但不提前漏跑", () => {
  expect(state("2026-10-05", [["2026-10-05", 3000]])).toMatchObject({
    status: "partial",
    missed: [],
    dueDate: "2026-10-05",
  });
});
it("周三漏跑周四达标，下次周六", () => {
  expect(
    state("2026-10-08", [
      ["2026-10-05", 5000],
      ["2026-10-08", 5000],
    ]),
  ).toMatchObject({
    dueDate: "2026-10-10",
    missed: ["2026-10-07"],
    status: "done",
  });
});
it("周六九公里未达标，周日十公里补跑后周二跑", () => {
  expect(
    state(
      "2026-10-11",
      [
        ["2026-10-10", 9000],
        ["2026-10-11", 10000],
      ],
      "2026-10-10",
    ),
  ).toMatchObject({ dueDate: "2026-10-13", missed: ["2026-10-10"] });
});
it("同日多次达标不重复顺延", () => {
  expect(
    state("2026-10-05", [
      ["2026-10-05", 3000],
      ["2026-10-05", 2000],
      ["2026-10-05", 5000],
    ]).dueDate,
  ).toBe("2026-10-07");
});
it("休息日达标按实际日期重排", () => {
  expect(
    state("2026-10-06", [
      ["2026-10-05", 5000],
      ["2026-10-06", 5000],
    ]).dueDate,
  ).toBe("2026-10-08");
});
it("未达标不改变过期计划", () => {
  expect(
    state("2026-10-08", [
      ["2026-10-06", 1000],
      ["2026-10-07", 1000],
      ["2026-10-08", 1000],
    ]),
  ).toMatchObject({
    dueDate: "2026-10-05",
    missed: ["2026-10-05"],
    status: "partial",
  });
});
it("乱序记录按日期处理", () => {
  expect(
    state("2026-10-08", [
      ["2026-10-08", 5000],
      ["2026-10-05", 5000],
    ]).dueDate,
  ).toBe("2026-10-10");
});
it("忽略今天之后的记录进行历史推演", () => {
  expect(state("2026-10-05", [["2026-10-08", 5000]]).dueDate).toBe(
    "2026-10-05",
  );
});
it("将来的计划尚未开始", () =>
  expect(state("2026-10-04").status).toBe("upcoming"));
it("达标次日是休息日", () =>
  expect(state("2026-10-06", [["2026-10-05", 5000]]).status).toBe("rest"));
it("删除达标记录后重算", () => {
  expect(state("2026-10-06", [["2026-10-05", 3000]])).toMatchObject({
    dueDate: "2026-10-05",
    missed: ["2026-10-05"],
  });
});
