import { localToday } from '../domain/date';
import type { Run, TrackerData } from '../domain/model';
import { historyView } from './history';
import { watchDate } from './clock';
import { todayView } from './today';
import { runForm } from './run-form';
import { read, write } from '../storage/local-store';

export function mount(root: HTMLElement, today = localToday): () => void {
  let data: TrackerData | null = null;
  root.innerHTML = `<header><span class="brand">一步 / RUNNING JOURNAL</span><p>跑出自己的节奏。</p></header><div id="notice" role="alert"></div><section id="content"></section><footer>数据仅保存在此设备的当前浏览器；清除网站数据、更换浏览器或使用隐私模式可能导致记录丢失。</footer>`;
  const content = root.querySelector<HTMLElement>('#content')!;
  const notice = root.querySelector<HTMLElement>('#notice')!;
  function render() {
    if (data) {
      content.innerHTML = '<div id="today">' + todayView(data, today()) + '</div>' + '<button data-add>记录跑步 ＋</button><div id="form-host"></div><div id="history-host">' + historyView(data,today()) + '</div>';  
      const edit = (original?: Run) => {
        runForm(content.querySelector('#form-host')!, data!.startDate, today(), run => {
          const runs = original ? data!.runs.map(item => item.id === original.id ? run : item) : [...data!.runs, run];
          try { data = write({...data!, runs}, today()); }
          catch { throw Error('无法保存，请检查浏览器的存储权限。'); }
          notice.textContent = '已保存'; render();
        }, render, original);
      };
      content.querySelector<HTMLButtonElement>('[data-add]')!.onclick = () => edit();
      content.querySelectorAll<HTMLElement>('[data-index]').forEach(host => {
        const run = data!.runs[Number(host.dataset.index)];
        const button = document.createElement('button');
        button.textContent = '编辑'; button.className = 'text-button'; button.dataset.edit = '';
        button.onclick = () => edit(run); host.append(button);
        const remove = document.createElement('button');
        remove.textContent = '删除'; remove.className = 'text-button danger'; remove.dataset.delete = '';
        remove.onclick = () => {
          if (!window.confirm(`删除 ${run.date} 的 ${run.distanceMeters/1000} 公里记录？日程与累计将重新计算。`)) return;
          try { data = write({...data!, runs:data!.runs.filter(item => item.id !== run.id)}, today()); notice.textContent = '已删除'; render(); }
          catch { notice.textContent = '无法保存，记录未删除。'; }
        };
        host.append(remove);
      });
      return;
    }
    content.innerHTML = `<section class="card setup"><p class="eyebrow">从这一天开始</p><h1>给跑步，留一点时间。</h1><p>隔天出发。工作日 5 公里，周末 10 公里。<br>每一步都记下，每次跑完再安排下一次。</p><form><label>开始日期<input name="startDate" type="date" required value="${today()}"></label><button type="submit">开始跑步计划 →</button></form></section>`;
    content.querySelector('form')!.onsubmit = event => {
      event.preventDefault();
      const startDate = content.querySelector<HTMLInputElement>('[name=startDate]')!.value;
      try { data = write({schemaVersion:1, startDate, runs:[]}, today()); notice.textContent = '已保存'; render(); }
      catch { notice.textContent = '无法保存，请检查日期及浏览器的存储权限。'; }
    };
  }
  try { data = read(today()); render(); }
  catch { notice.textContent = '无法读取本地数据，原始记录已保留。'; }
  return watchDate(today, () => {
    const view = content.querySelector('#today');
    if (data && view) view.innerHTML = todayView(data, today());
    const input = content.querySelector<HTMLInputElement>('[name=date]');
    if (input) input.max = today();
  });
}
