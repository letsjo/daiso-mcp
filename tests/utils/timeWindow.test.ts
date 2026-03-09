import { describe, expect, it } from 'vitest';
import { matchesTimeWindow, normalizeTimeWindow } from '../../src/utils/timeWindow.js';

describe('normalizeTimeWindow', () => {
  it('공백을 제거하고 반환한다', () => {
    expect(normalizeTimeWindow({ fromTime: ' 1800 ', toTime: ' 2100 ' })).toEqual({
      fromTime: '1800',
      toTime: '2100',
    });
  });

  it('잘못된 시각 형식을 거부한다', () => {
    expect(() => normalizeTimeWindow({ fromTime: '2500' })).toThrow('fromTime은 HHMM 형식이어야 합니다.');
    expect(() => normalizeTimeWindow({ toTime: '9pm' })).toThrow('toTime은 HHMM 형식이어야 합니다.');
  });

  it('역순 범위를 거부한다', () => {
    expect(() => normalizeTimeWindow({ fromTime: '2100', toTime: '1800' })).toThrow(
      'fromTime은 toTime보다 늦을 수 없습니다.',
    );
  });
});

describe('matchesTimeWindow', () => {
  it('시작 시각이 범위 안에 있으면 true를 반환한다', () => {
    expect(matchesTimeWindow('1830', { fromTime: '1800', toTime: '1900' })).toBe(true);
  });

  it('시작 시각이 범위 밖이면 false를 반환한다', () => {
    expect(matchesTimeWindow('1730', { fromTime: '1800', toTime: '1900' })).toBe(false);
    expect(matchesTimeWindow('1930', { fromTime: '1800', toTime: '1900' })).toBe(false);
  });
});
