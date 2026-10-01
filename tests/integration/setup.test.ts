import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mount } from '../../src/ui/app';
import { KEY } from '../../src/storage/local-store';
beforeEach(() => { localStorage.clear(); document.body.innerHTML = '<main id="app"></main>'; });
afterEach(() => vi.restoreAllMocks());
it('保存过去的开始日期并在重新打开后恢复', () => {
  const dispose = mount(document.querySelector('#app')!, () => '2026-10-08');
  (document.querySelector('[name=startDate]') as HTMLInputElement).value = '2026-10-01';
  document.querySelector('form')!.dispatchEvent(new Event('submit', {cancelable:true}));
  expect(JSON.parse(localStorage.getItem(KEY)!).startDate).toBe('2026-10-01');
  dispose(); mount(document.querySelector('#app')!, () => '2026-10-08')();
  expect(document.body.textContent).toContain('跑步计划');
});
it('写入失败保留选择且不显示成功', () => {
  const dispose = mount(document.querySelector('#app')!, () => '2026-10-08');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
  document.querySelector('form')!.dispatchEvent(new Event('submit', {cancelable:true}));
  expect(document.body.textContent).toContain('无法保存');
  expect(document.querySelector('[name=startDate]')).not.toBeNull(); dispose();
});
it.each(['broken', '{"schemaVersion":99}'])('原始损坏数据不被覆盖 %s', raw => {
  localStorage.setItem(KEY, raw);
  mount(document.querySelector('#app')!, () => '2026-10-08')();
  expect(localStorage.getItem(KEY)).toBe(raw);
  expect(document.body.textContent).toContain('无法读取');
});
