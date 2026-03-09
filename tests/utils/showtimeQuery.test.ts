/**
 * 상영 회차 필터/정렬 유틸리티 테스트
 */

import { describe, expect, it } from 'vitest';
import {
  filterAndSortShowtimes,
  normalizeMinRemainingSeats,
  normalizeShowtimeSort,
} from '../../src/utils/showtimeQuery.js';

describe('normalizeMinRemainingSeats', () => {
  it('값이 없으면 undefined를 반환한다', () => {
    expect(normalizeMinRemainingSeats()).toBeUndefined();
  });

  it('0 이상의 정수만 허용한다', () => {
    expect(normalizeMinRemainingSeats(12)).toBe(12);
    expect(() => normalizeMinRemainingSeats(-1)).toThrow(
      'minRemainingSeats는 0 이상의 정수여야 합니다.',
    );
    expect(() => normalizeMinRemainingSeats(1.5)).toThrow(
      'minRemainingSeats는 0 이상의 정수여야 합니다.',
    );
  });
});

describe('normalizeShowtimeSort', () => {
  it('값이 없으면 시작 시각 오름차순을 기본값으로 사용한다', () => {
    expect(normalizeShowtimeSort()).toBe('startTime-asc');
  });

  it('지원하지 않는 정렬 기준이면 예외를 던진다', () => {
    expect(() => normalizeShowtimeSort('distance-asc')).toThrow(
      'sort는 startTime-asc, remainingSeats-desc, remainingSeats-asc 중 하나여야 합니다.',
    );
  });
});

describe('filterAndSortShowtimes', () => {
  const showtimes = [
    { scheduleId: 'S1', startTime: '1800', remainingSeats: 12, theaterName: '강남' },
    { scheduleId: 'S2', startTime: '1730', remainingSeats: 18, theaterName: '홍대' },
    { scheduleId: 'S3', startTime: '1730', remainingSeats: 18, theaterName: '건대' },
    { scheduleId: 'S4', startTime: '1900', remainingSeats: 4, theaterName: '목동' },
  ];

  it('최소 잔여 좌석과 잔여 좌석 내림차순을 함께 적용한다', () => {
    const filtered = filterAndSortShowtimes(showtimes, {
      minRemainingSeats: 10,
      sort: 'remainingSeats-desc',
      limit: 10,
    });

    expect(filtered.map((item) => item.scheduleId)).toEqual(['S3', 'S2', 'S1']);
  });

  it('잔여 좌석 오름차순에서도 시작 시각과 지점명으로 tie-break 한다', () => {
    const filtered = filterAndSortShowtimes(showtimes, {
      sort: 'remainingSeats-asc',
      limit: 3,
    });

    expect(filtered.map((item) => item.scheduleId)).toEqual(['S4', 'S1', 'S3']);
  });
});
