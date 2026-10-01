import { targetMeters } from '../domain/date';
import { schedule } from '../domain/schedule';
import type { TrackerData } from '../domain/model';
export function todayView(data: TrackerData, today: string): string {
  const state = schedule(data, today);
  const meters = state.days.get(today)?.meters ?? 0;
  const target = targetMeters(today);
  const title = {done:'今天已完成',partial:'今天尚未完成',overdue:'上次计划未完成',due:'今天该跑',upcoming:'即将开始',rest:'今天休息一下'}[state.status];
  return `<section class="card today"><p class="eyebrow">${today} · 跑步计划</p><h1>${title}</h1><p class="hero-distance"><strong>${meters/1000}</strong><span> / ${target/1000} 公里</span></p><p>今日累计 / 今日目标</p><progress max="${target}" value="${Math.min(meters,target)}" aria-label="今日跑量"></progress><p class="schedule">${state.dueDate < today ? `上次计划未完成 · ${state.dueDate}，今天可以补跑` : `下次计划 · ${state.dueDate}`}</p></section>`;
}
