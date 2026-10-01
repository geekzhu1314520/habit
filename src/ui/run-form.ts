import { escapeHtml } from "./html";
import { parseKm, type Run } from "../domain/model";
export function runForm(
  host: HTMLElement,
  start: string,
  today: () => string,
  save: (run: Run) => void,
  cancel: () => void,
  run?: Run,
) {
  const intentId = run?.id ?? crypto.randomUUID();
  host.innerHTML = `<section class="card"><h2>${run ? "编辑跑步" : "记下这一次"}</h2><p>每次单独记录，当天距离自动累计。</p><form novalidate><label>跑步日期<input name="date" type="date" required aria-describedby="form-error" min="${escapeHtml(start)}" max="${escapeHtml(today())}"></label><label>本次距离（公里）<input name="distance" inputmode="decimal" placeholder="例如 5.2" required aria-describedby="form-error"></label><p id="form-error" role="alert"></p><div class="actions"><button type="submit">保存跑步</button><button type="button" class="secondary" data-cancel>取消</button></div></form></section>`;
  const date = host.querySelector<HTMLInputElement>("[name=date]")!;
  const distance = host.querySelector<HTMLInputElement>("[name=distance]")!;
  const error = host.querySelector<HTMLElement>("#form-error")!;
  const button = host.querySelector<HTMLButtonElement>("[type=submit]")!;
  date.value = run?.date ?? today();
  distance.value = run ? String(run.distanceMeters / 1000) : "";
  host.querySelector<HTMLButtonElement>("[data-cancel]")!.onclick = cancel;
  host.querySelector("form")!.onsubmit = (event) => {
    event.preventDefault();
    if (button.disabled) return;
    button.disabled = true;
    date.removeAttribute("aria-invalid");
    distance.removeAttribute("aria-invalid");
    error.textContent = "";
    try {
      if (!date.value || date.value < start || date.value > today()) {
        date.setAttribute("aria-invalid", "true");
        date.focus();
        throw Error("请选择开始日期至今天之间的跑步日期");
      }
      let meters: number;
      try {
        meters = parseKm(distance.value);
      } catch (reason) {
        distance.setAttribute("aria-invalid", "true");
        distance.focus();
        throw reason;
      }
      save({
        id: intentId,
        date: date.value,
        distanceMeters: meters,
      });
    } catch (reason) {
      error.textContent = reason instanceof Error ? reason.message : "无法保存";
    } finally {
      button.disabled = false;
    }
  };
  date.focus();
}
