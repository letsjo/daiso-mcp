/**
 * 메가박스 계약 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchMegaboxBookingList,
  fetchMegaboxTheaterInfo,
} from '../../../src/services/megabox/client.js';
import { readJsonFixture, readTextFixture } from '../../testFixtures.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('megabox representative payload contracts', () => {
  it('상영 목록 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(readJsonFixture('megabox/booking-list.json'))),
    );

    const result = await fetchMegaboxBookingList({
      playDate: '20260304',
      theaterId: '1372',
      movieId: 'M1',
    });

    expect(result).toEqual({
      theaters: [{ theaterId: '1372', theaterName: 'Gangnam' }],
      movies: [{ movieId: 'M1', movieName: 'Movie A', movieStatus: 'Now Showing' }],
      showtimes: [
        {
          scheduleId: 'S1',
          movieId: 'M1',
          movieName: 'Movie A',
          theaterId: '1372',
          theaterName: 'Gangnam',
          playDate: '20260304',
          startTime: '09:30',
          endTime: '11:20',
          totalSeats: 100,
          remainingSeats: 12,
        },
      ],
    });
  });

  it('지점 상세 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(new Response(readTextFixture('megabox/theater-info.html')));

    const result = await fetchMegaboxTheaterInfo('1372');

    expect(result).toEqual({
      theaterId: '1372',
      address: 'Seoul Gangnam-daero',
      latitude: 37.4979,
      longitude: 127.0276,
    });
  });
});
