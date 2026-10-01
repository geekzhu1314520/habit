import { describe, expect, it } from 'vitest';
import { validate, parseKm } from '../../src/domain/model';
const data = () => ({ schemaVersion: 1, startDate: '2026-10-01', runs: [{ id: 'a', date: '2026-10-01', distanceMeters: 3000 }] });
describe('保存真实跑步记录', () => {
  it('接受同日同距离的独立记录', () => { const d = data(); d.runs.push({ ...d.runs[0], id: 'b' }); expect(validate(d, '2026-10-02')).toEqual(d); });
  it.each(['', '0', '-1', 'Infinity', 'NaN', '1.0001', '9007199254740992'])('拒绝无效公里数 %s', value => expect(() => parseKm(value)).toThrow());
  it('精确转换小数公里', () => expect(parseKm('1.001')).toBe(1001));
  it.each([null, {}, { ...data(), schemaVersion: 2 }, { ...data(), runs: null }, { ...data(), startDate: '2026-02-30' }, { ...data(), runs: [null] }])('拒绝损坏的文档 %#', value => expect(() => validate(value, '2026-10-02')).toThrow());
  it.each([{ id: '' }, { date: '2026-09-30' }, { date: '2026-10-03' }, { date: 'bad' }, { distanceMeters: 0 }, { distanceMeters: 1.1 }, { distanceMeters: Infinity }])('拒绝无效记录 %#', patch => { const d = data(); Object.assign(d.runs[0], patch); expect(() => validate(d, '2026-10-02')).toThrow(); });
  it('拒绝重复 id', () => { const d = data(); d.runs.push(d.runs[0]); expect(() => validate(d, '2026-10-02')).toThrow(); });
  it('拒绝总距离溢出', () => { const d = data(); d.runs[0].distanceMeters = Number.MAX_SAFE_INTEGER; d.runs.push({ id: 'b', date: '2026-10-02', distanceMeters: 1 }); expect(() => validate(d, '2026-10-02')).toThrow(); });
  it('允许未来计划但没有未来跑步', () => expect(validate({ schemaVersion: 1, startDate: '2027-01-01', runs: [] }, '2026-10-02').runs).toEqual([]));
});
