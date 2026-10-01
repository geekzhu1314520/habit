import { addDays } from "./date";
import { daily } from "./daily";
import type { TrackerData } from "./model";
export function schedule(data: TrackerData, today: string) {
  const days = daily(data.runs.filter((run) => run.date <= today));
  let dueDate = data.startDate;
  const missed = new Set<string>();
  for (const [date, day] of [...days].sort(([a], [b]) => a.localeCompare(b))) {
    if (date > dueDate) missed.add(dueDate);
    if (day.done) dueDate = addDays(date, 2);
  }
  if (today > dueDate) missed.add(dueDate);
  const current = days.get(today);
  const status = current?.done
    ? "done"
    : current
      ? "partial"
      : today > dueDate
        ? "overdue"
        : today === dueDate
          ? "due"
          : today < data.startDate
            ? "upcoming"
            : "rest";
  return { dueDate, missed: [...missed].sort(), status, days };
}
