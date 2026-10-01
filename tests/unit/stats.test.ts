import { expect, it } from 'vitest';
import { stats } from '../../src/domain/stats';
it('空记录为零', () => expect(stats([])).toEqual({count:0,meters:0}));
it('含未达标的每次真实跑步', () => expect(stats([{id:'a',date:'2026-10-05',distanceMeters:3000},{id:'b',date:'2026-10-05',distanceMeters:2000},{id:'c',date:'2026-10-06',distanceMeters:1000}])).toEqual({count:3,meters:6000}));
