import { targetMeters } from "./date";
import type { Run } from "./model";
export function daily(runs: Run[]) {
  const days = new Map<string, { meters: number; done: boolean }>();
  for (const run of runs) {
    const meters = (days.get(run.date)?.meters ?? 0) + run.distanceMeters;
    days.set(run.date, { meters, done: meters >= targetMeters(run.date) });
  }
  return days;
}
