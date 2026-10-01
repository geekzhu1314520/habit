import { expect, it } from 'vitest';
import { mount } from '../../src/ui/app';
import { KEY } from '../../src/storage/local-store';
it('今天记录 3+2 公里显示已完成', () => {
  localStorage.setItem(KEY,JSON.stringify({schemaVersion:1,startDate:'2026-10-05',runs:[{id:'a',date:'2026-10-05',distanceMeters:3000},{id:'b',date:'2026-10-05',distanceMeters:2000}]}));
  document.body.innerHTML='<main id="app"></main>';
  mount(document.querySelector('#app')!,()=> '2026-10-05')();
  expect(document.body.textContent).toContain('今天已完成');
});
