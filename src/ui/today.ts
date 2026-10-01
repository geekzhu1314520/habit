import { daily } from '../domain/daily';
import { targetMeters } from '../domain/date';
import type { TrackerData } from '../domain/model';
export function todayView(data: TrackerData, today: string): string {
  const day = daily(data.runs).get(today);
  return `<section class="card today"><p class="eyebrow">${today} · 跑步计划</p><h1>${day?.done ? '今天已完成' : '今天尚未完成'}</h1><p>今日累计 <strong>${(day?.meters ?? 0)/1000}</strong> 公里 / 目标 ${targetMeters(today)/1000} 公里</p></section>`;
}
