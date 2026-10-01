import { validDate } from "./date";
export const MAX_RUNS = 10000;
function hasExactKeys(value: unknown, keys: string[]): boolean {
  if (
    !value ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    return false;
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
export interface Run {
  id: string;
  date: string;
  distanceMeters: number;
}
export interface TrackerData {
  schemaVersion: 1;
  startDate: string;
  runs: Run[];
}
export function parseKm(value: string): number {
  const text = value.trim();
  const meters = Math.round(Number(text) * 1000);
  if (
    !/^\d+(\.\d{1,3})?$/.test(text) ||
    !Number.isSafeInteger(meters) ||
    meters <= 0
  )
    throw new Error("请输入大于 0 的公里数，最多三位小数");
  return meters;
}
export function validate(value: unknown, today: string): TrackerData {
  const fail = (): never => {
    throw new Error("数据格式或版本无效，原始记录已保留");
  };
  if (!hasExactKeys(value, ["schemaVersion", "startDate", "runs"]))
    return fail();
  const data = value as TrackerData;
  if (
    data.schemaVersion !== 1 ||
    !validDate(data.startDate) ||
    !Array.isArray(data.runs) ||
    data.runs.length > MAX_RUNS
  )
    return fail();
  const ids = new Set<string>();
  let total = 0;
  for (const run of data.runs) {
    if (
      !hasExactKeys(run, ["id", "date", "distanceMeters"]) ||
      typeof run.id !== "string" ||
      !run.id.trim() ||
      run.id.length > 128 ||
      ids.has(run.id) ||
      !validDate(run.date) ||
      run.date < data.startDate ||
      run.date > today ||
      !Number.isSafeInteger(run.distanceMeters) ||
      run.distanceMeters <= 0
    )
      return fail();
    ids.add(run.id);
    total += run.distanceMeters;
    if (!Number.isSafeInteger(total)) return fail();
  }
  return {
    schemaVersion: 1,
    startDate: data.startDate,
    runs: data.runs.map(({ id, date, distanceMeters }) => ({
      id,
      date,
      distanceMeters,
    })),
  };
}
