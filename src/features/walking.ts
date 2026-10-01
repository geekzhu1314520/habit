import { localToday, validDate } from "../domain/date";
export const WALK_KEY = "walking-experiment:v1";
export const walkingEnabled = (value: string | undefined) => value === "true";
// Release owner: repository maintainer. Review by 2026-10-15; default OFF.
export function mountWalking(
  host: HTMLElement,
  enabled: boolean,
  today = localToday,
) {
  host.replaceChildren();
  if (!enabled) return;
  const section = document.createElement("section");
  section.className = "card";
  const title = document.createElement("h2");
  title.textContent = "步行 · 实验功能";
  const description = document.createElement("p");
  description.textContent = "每天步行一次，自行确认完成；独立于跑步计划。";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const button = document.createElement("button");
  section.append(title, description, status, button);
  host.append(section);
  function read(): string[] {
    const raw = localStorage.getItem(WALK_KEY);
    if (raw === null) return [];
    if (raw.length > 200000) throw Error();
    const value = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      Object.keys(value).sort().join(",") !== "days,schemaVersion" ||
      value.schemaVersion !== 1 ||
      !Array.isArray(value.days) ||
      value.days.length > 10000 ||
      !value.days.every((day: unknown) => validDate(day) && day <= today()) ||
      new Set(value.days).size !== value.days.length
    )
      throw Error();
    return value.days;
  }
  function refresh() {
    try {
      const done = read().includes(today());
      button.textContent = done ? "今天已完成" : "标记今天步行完成";
      button.disabled = done;
    } catch {
      status.textContent = "无法读取步行记录，原始数据已保留。";
      button.textContent = "记录不可用";
      button.disabled = true;
    }
  }
  button.onclick = () => {
    try {
      const days = read();
      if (!days.includes(today())) {
        if (days.length >= 10000) throw Error();
        localStorage.setItem(
          WALK_KEY,
          JSON.stringify({ schemaVersion: 1, days: [...days, today()] }),
        );
      }
      status.textContent = "已保存到本机";
      refresh();
    } catch {
      status.textContent = "无法保存，原始数据已保留，请重试。";
    }
  };
  refresh();
}
