import { escapeHtml } from "./html";
import { localToday } from "../domain/date";
import type { Run, TrackerData } from "../domain/model";
import { historyView } from "./history";
import { watchDate } from "./clock";
import { todayView } from "./today";
import { runForm } from "./run-form";
import {
  KEY,
  createLocalStore,
  type SnapshotToken,
} from "../storage/local-store";

export function mount(root: HTMLElement, today = localToday): () => void {
  let data: TrackerData | null = null;
  const store = createLocalStore({ today });
  let baseline: SnapshotToken | null = null;
  let conflict = false;
  let editing: Run | undefined;
  let openEditor: (run?: Run) => void = () => {};
  root.innerHTML = `<header><span class="brand">一步 / RUNNING JOURNAL</span><p>跑出自己的节奏。</p></header><div id="notice" role="status" aria-live="polite" aria-atomic="true"></div><main id="content"></main><footer>数据仅保存在此设备的当前浏览器；清除网站数据、更换浏览器或使用隐私模式可能导致记录丢失。</footer>`;
  const content = root.querySelector<HTMLElement>("#content")!;
  const notice = root.querySelector<HTMLElement>("#notice")!;
  function save(candidate: TrackerData) {
    if (conflict || baseline === null) {
      onExternal();
      throw Error("其他标签页已更改记录，请先重新加载。");
    }
    const result = store.save({ data: candidate, expectedToken: baseline });
    if (!result.ok) {
      if (result.error.code === "CONFLICT") onExternal();
      throw Error(result.error.message);
    }
    baseline = result.value.token;
    return result.value.data;
  }
  function load() {
    try {
      const result = store.load();
      if (!result.ok) throw Error(result.error.message);
      data = result.value.state === "missing" ? null : result.value.data;
      baseline = result.value.token;
      conflict = false;
      notice.textContent = "";
      render();
    } catch (error) {
      notice.textContent =
        "无法读取本地数据：" +
        (error instanceof Error ? error.message : "请重试");
      content.innerHTML =
        '<section class="card"><h1>记录暂时无法打开</h1><p>请检查浏览器存储权限。你可以重试；重新开始会清除本应用记录。</p><button data-reload>重试读取</button><button class="secondary" data-reset>清除本应用数据并重新开始</button></section>';
      content.querySelector<HTMLButtonElement>("[data-reload]")!.onclick = load;
      content.querySelector<HTMLButtonElement>("[data-reset]")!.onclick =
        () => {
          if (
            !window.confirm("清除本应用的全部记录并重新开始？此操作不可撤销。")
          )
            return;
          try {
            const result = store.reset();
            if (!result.ok) throw Error(result.error.message);
            load();
          } catch {
            notice.textContent = "无法清除，请检查浏览器的存储权限。";
          }
        };
    }
  }
  function onExternal() {
    conflict = true;
    notice.textContent =
      "其他标签页已更改记录，请重新加载后再保存。当前输入会保留。";
    const button = document.createElement("button");
    button.textContent = "重新加载记录";
    button.dataset.reload = "";
    button.onclick = () => {
      const date =
        content.querySelector<HTMLInputElement>("[name=date]")?.value;
      const distance =
        content.querySelector<HTMLInputElement>("[name=distance]")?.value;
      const previous = editing;
      try {
        const result = store.load();
        if (!result.ok) throw Error(result.error.message);
        if (result.value.state === "missing" && date !== undefined) {
          notice.textContent =
            "其他标签页已清除计划。草稿已保留，请先取消本次输入，再重新加载。";
          notice.append(button);
          return;
        }
      } catch {
        notice.textContent =
          "无法读取其他标签页的数据，当前草稿与原始数据已保留。请修复数据后重试。";
        notice.append(button);
        return;
      }
      load();
      if (data && !conflict && date !== undefined) {
        if (previous && !data.runs.some((run) => run.id === previous.id)) {
          // Keep the draft visible but require an explicit new record after a remote deletion.
          openEditor(previous);
          notice.textContent =
            "该记录已被其他标签页删除。草稿已保留，请取消后按需新增。";
        } else
          openEditor(
            previous
              ? data.runs.find((run) => run.id === previous.id)
              : undefined,
          );
        content.querySelector<HTMLInputElement>("[name=date]")!.value = date;
        content.querySelector<HTMLInputElement>("[name=distance]")!.value =
          distance ?? "";
      }
    };
    notice.append(button);
  }
  function bindHistory() {
    content.querySelectorAll<HTMLElement>("[data-index]").forEach((host) => {
      const run = data!.runs[Number(host.dataset.index)];
      const button = document.createElement("button");
      button.textContent = "编辑";
      button.className = "text-button";
      button.dataset.edit = "";
      button.onclick = () => openEditor(run);
      host.append(button);
      const remove = document.createElement("button");
      remove.textContent = "删除";
      remove.className = "text-button danger";
      remove.dataset.delete = "";
      remove.onclick = () => {
        if (
          !window.confirm(
            `删除 ${run.date} 的 ${run.distanceMeters / 1000} 公里记录？日程与累计将重新计算。`,
          )
        )
          return;
        try {
          data = save({
            ...data!,
            runs: data!.runs.filter((item) => item.id !== run.id),
          });
          notice.textContent = "已删除";
          render();
        } catch {
          if (!conflict) notice.textContent = "无法保存，记录未删除。";
        }
      };
      host.append(remove);
    });
  }
  function render() {
    if (data) {
      content.innerHTML =
        '<div id="today">' +
        todayView(data, today()) +
        "</div>" +
        '<button data-add>记录跑步 ＋</button><div id="form-host"></div><div id="history-host">' +
        historyView(data, today()) +
        "</div>";
      const edit = (original?: Run) => {
        editing = original;
        runForm(
          content.querySelector("#form-host")!,
          data!.startDate,
          today,
          (run) => {
            if (original && !data!.runs.some((item) => item.id === original.id))
              throw Error("该记录已删除，请取消后重新记录。");
            const runs = original
              ? data!.runs.map((item) => (item.id === original.id ? run : item))
              : [...data!.runs, run];
            data = save({ ...data!, runs });
            notice.textContent = "已保存";
            render();
            content.querySelector<HTMLButtonElement>("[data-add]")?.focus();
          },
          () => {
            render();
            content.querySelector<HTMLButtonElement>("[data-add]")?.focus();
          },
          original,
        );
      };
      openEditor = edit;
      content.querySelector<HTMLButtonElement>("[data-add]")!.onclick = () =>
        edit();
      bindHistory();
      return;
    }
    content.innerHTML = `<section class="card setup"><p class="eyebrow">从这一天开始</p><h1>给跑步，留一点时间。</h1><p>隔天出发。工作日 5 公里，周末 10 公里。<br>每一步都记下，每次跑完再安排下一次。</p><form><label>开始日期<input name="startDate" type="date" required value="${escapeHtml(today())}"></label><button type="submit">开始跑步计划 →</button></form></section>`;
    content.querySelector("form")!.onsubmit = (event) => {
      event.preventDefault();
      const startDate =
        content.querySelector<HTMLInputElement>("[name=startDate]")!.value;
      try {
        data = save({ schemaVersion: 1, startDate, runs: [] });
        notice.textContent = "已保存";
        render();
      } catch {
        if (!conflict)
          notice.textContent = "无法保存，请检查日期及浏览器的存储权限。";
      }
    };
  }
  load();
  const storageChanged = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onExternal();
  };
  window.addEventListener("storage", storageChanged);
  const stopClock = watchDate(today, () => {
    const view = content.querySelector("#today");
    if (data && view) view.innerHTML = todayView(data, today());
    const history = content.querySelector("#history-host");
    if (data && history) {
      history.innerHTML = historyView(data, today());
      bindHistory();
    }
    const input = content.querySelector<HTMLInputElement>("[name=date]");
    if (input) input.max = today();
  });
  return () => {
    stopClock();
    window.removeEventListener("storage", storageChanged);
  };
}
