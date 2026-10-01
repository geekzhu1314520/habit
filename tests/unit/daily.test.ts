import { expect, it } from 'vitest';
import { daily } from '../../src/domain/daily';
it.each([['2026-10-05',3000,2000,true],['2026-10-10',6000,4000,true],['2026-10-05',4000,999,false]])('当天累计达标 %s', (date,a,b,done) => { expect(daily([{id:'a',date,distanceMeters:a},{id:'b',date,distanceMeters:b}]).get(date)?.done).toBe(done); });
it('不同日期不合并', () => { const days = daily([{id:'a',date:'2026-10-05',distanceMeters:3000},{id:'b',date:'2026-10-06',distanceMeters:2000}]); expect([...days.values()].every(day => !day.done)).toBe(true); });
