import { localToday } from '../domain/date';
import type { TrackerData } from '../domain/model';
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
      content.innerHTML = todayView(data, today()) + '<button data-add>记录跑步 ＋</button><div id="form-host"></div>'; 
      content.querySelector<HTMLButtonElement>('[data-add]')!.onclick = () => {
        runForm(content.querySelector('#form-host')!, data!.startDate, today(), run => {
          try { data = write({...data!, runs:[...data!.runs, run]}, today()); }
          catch { throw Error('无法保存，请检查浏览器的存储权限。'); }
          notice.textContent = '已保存'; render();
        }, render);
      };
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
  return () => { /* No event subscriptions yet. */ };
}
