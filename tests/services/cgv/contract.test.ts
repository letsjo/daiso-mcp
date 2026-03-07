/**
 * CGV 계약 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCgvMovies,
  fetchCgvTheaters,
  fetchCgvTimetable,
} from '../../../src/services/cgv/client.js';
import { readJsonFixture } from '../../testFixtures.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('cgv representative payload contracts', () => {
  it('극장 목록 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(readJsonFixture('cgv/theaters.json'))),
    );

    const result = await fetchCgvTheaters({ playDate: '20260304', regionCode: '01' });

    expect(result).toEqual([
      { theaterCode: '0056', theaterName: 'Gangnam', regionCode: '01' },
      { theaterCode: '0001', theaterName: 'Gangbyeon', regionCode: '01' },
    ]);
  });

  it('영화 목록 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(readJsonFixture('cgv/movies.json'))),
    );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toEqual([
      { movieCode: '30000985', movieName: 'Movie A', rating: 'All' },
      { movieCode: '30000986', movieName: 'Movie B', rating: undefined },
    ]);
  });

  it('시간표 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(readJsonFixture('cgv/timetable-by-site.json'))),
    );

    const result = await fetchCgvTimetable({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toEqual([
      {
        scheduleId: '2026030400562',
        movieCode: '30000985',
        movieName: 'Movie A',
        theaterCode: '0056',
        theaterName: 'CGV Gangnam',
        playDate: '20260304',
        startTime: '12:30',
        endTime: '14:43',
        totalSeats: 123,
        remainingSeats: 99,
      },
    ]);
  });
});
