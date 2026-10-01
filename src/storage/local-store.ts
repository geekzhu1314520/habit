import { validate, type TrackerData } from "../domain/model";
export const KEY = "running-tracker:v1";
export function read(today: string): TrackerData | null {
  const raw = localStorage.getItem(KEY);
  return raw === null ? null : validate(JSON.parse(raw), today);
}
export function write(data: TrackerData, today: string): TrackerData {
  const checked = validate(data, today);
  localStorage.setItem(KEY, JSON.stringify(checked));
  return checked;
}
