import { expect, it } from 'vitest';
import { mount } from '../../src/ui/app';
import { KEY } from '../../src/storage/local-store';
it('历史按日汇总但保留每条真实记录，漏跑不计次数', () => {
  localStorage.setItem(KEY, JSON.stringify({schemaVersion:1,startDate:'2026-10-05',runs:[{id:'a',date:'2026-10-05',distanceMeters:3000},{id:'b',date:'2026-10-05',distanceMeters:2000}]}));
  document.body.innerHTML='<main id="app"></main>'; mount(document.querySelector('#app')!,()=> '2026-10-08')();
  expect(document.querySelector('[data-count]')!.textContent).toBe('2');
  expect(document.querySelector('[data-meters]')!.textContent).toBe('5');
  expect(document.querySelectorAll('[data-run]')).toHaveLength(2);
  expect(document.querySelector('#history')!.textContent).toContain('漏跑');
});
