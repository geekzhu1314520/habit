import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { mount } from '../../src/ui/app';
import { KEY } from '../../src/storage/local-store';
let dispose: () => void;
beforeEach(() => { localStorage.setItem(KEY,JSON.stringify({schemaVersion:1,startDate:'2026-10-05',runs:[{id:'a',date:'2026-10-05',distanceMeters:3000},{id:'b',date:'2026-10-05',distanceMeters:2000}]})); document.body.innerHTML='<main id="app"></main>'; dispose=mount(document.querySelector('#app')!,()=> '2026-10-06'); });
afterEach(()=> {dispose();vi.restoreAllMocks();});
it('确认后只删除指定记录并重算',()=> {vi.spyOn(window,'confirm').mockReturnValue(true); document.querySelectorAll<HTMLButtonElement>('[data-delete]')[1].click(); expect(JSON.parse(localStorage.getItem(KEY)!).runs).toEqual([{id:'a',date:'2026-10-05',distanceMeters:3000}]); expect(document.body.textContent).toContain('上次计划未完成');});
it('取消删除不改变记录',()=> {vi.spyOn(window,'confirm').mockReturnValue(false); const before=localStorage.getItem(KEY); document.querySelector<HTMLButtonElement>('[data-delete]')!.click(); expect(localStorage.getItem(KEY)).toBe(before);});
it('删除保存失败不移除记录',()=> {vi.spyOn(window,'confirm').mockReturnValue(true); vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('full');}); document.querySelector<HTMLButtonElement>('[data-delete]')!.click(); expect(document.querySelectorAll('[data-run]')).toHaveLength(2); expect(document.body.textContent).toContain('无法保存');});
