import { escapeHtml } from "./html";
import { schedule } from "../domain/schedule";
import { stats } from "../domain/stats";
import { targetMeters } from "../domain/date";
import type { TrackerData } from "../domain/model";
export function historyView(data: TrackerData, today: string): string {
  const total = stats(data.runs);
  const state = schedule(data, today);
  const dates = [...new Set([...state.days.keys(), ...state.missed])]
    .sort()
    .reverse();
  const rowsByDate = new Map<string, string[]>();
  data.runs.forEach((run, index) => {
    const rows = rowsByDate.get(run.date) ?? [];
    rows.push(
      `<li data-run><span>${run.distanceMeters / 1000} 公里</span><span class="run-actions" data-index="${index}"></span></li>`,
    );
    rowsByDate.set(run.date, rows);
  });
  const missed = new Set(state.missed);
  return `<section class="stats" aria-label="累计统计"><div><span>跑步次数</span><strong data-count>${total.count}</strong><small>含未达标日的记录</small></div><div><span>累计公里</span><strong data-meters>${total.meters / 1000}</strong><small>每一步都算数</small></div></section><section class="card" id="history"><h2>跑过的日子</h2>${
    dates.length
      ? dates
          .map((date) => {
            const day = state.days.get(date);
            return `<article class="day"><div class="day-heading"><h3>${escapeHtml(date)}</h3><span class="badge">${day?.done ? "已达标" : "未达标"}${missed.has(date) ? " · 漏跑" : ""}</span></div><p>累计 ${(day?.meters ?? 0) / 1000} / ${targetMeters(date) / 1000} 公里</p><ul>${(rowsByDate.get(date) ?? []).join("")}</ul></article>`;
          })
          .join("")
      : '<p class="empty">还没有跑步记录。用上方“记录跑步”记下第一步。</p>'
  }</section>`;
}
