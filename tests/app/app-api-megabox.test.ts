/**
 * 앱 통합 테스트 - 메가박스 API
 */

import { describe, it, expect, vi } from 'vitest';
import app from '../../src/index.js';
import { setupFetchMock } from './testHelpers.js';

const mockFetch = vi.fn();
setupFetchMock(mockFetch);

describe('GET /api/megabox/theaters', () => {
  it('메가박스 주변 지점을 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ areaBrchList: [{ brchNo: '1372', brchNm: '강남' }] })),
      )
      .mockResolvedValueOnce(
        new Response(
          '<dt>도로명주소</dt><dd>서울 강남구 강남대로</dd><a href="?lng=127.0&lat=37.5">지도</a>',
        ),
      );

    const res = await app.request('/api/megabox/theaters?lat=37.5&lng=127.0');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.theaters)).toBe(true);
  });
});

describe('GET /api/megabox/movies', () => {
  it('메가박스 영화/회차 목록을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          areaBrchList: [{ brchNo: '1372', brchNm: '강남' }],
          movieList: [{ movieNo: '25104500', movieNm: '영화A' }],
          movieFormList: [
            {
              playSchdlNo: 'S1',
              movieNo: '25104500',
              movieNm: '영화A',
              brchNo: '1372',
              brchNm: '강남',
              playStartTime: '0930',
              playEndTime: '1120',
              restSeatCnt: 10,
              totSeatCnt: 100,
            },
          ],
        }),
      ),
    );

    const res = await app.request('/api/megabox/movies?playDate=20260304');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.movies).toHaveLength(1);
    expect(data.data.showtimes).toHaveLength(1);
  });
});

describe('GET /api/megabox/seats', () => {
  it('메가박스 잔여 좌석 목록을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          movieFormList: [
            {
              playSchdlNo: 'S1',
              movieNo: 'M1',
              movieNm: '영화A',
              brchNo: '1372',
              brchNm: '강남',
              playStartTime: '0930',
              playEndTime: '1120',
              restSeatCnt: 12,
              totSeatCnt: 100,
            },
          ],
        }),
      ),
    );

    const res = await app.request('/api/megabox/seats?playDate=20260304');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.seats).toHaveLength(1);
  });

  it('시간대, 최소 잔여 좌석, 정렬 기준으로 회차를 좁힌다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          movieFormList: [
            {
              playSchdlNo: 'S1',
              movieNo: 'M1',
              movieNm: '영화A',
              brchNo: '1372',
              brchNm: '강남',
              playStartTime: '1730',
              playEndTime: '1920',
              restSeatCnt: 12,
              totSeatCnt: 100,
            },
            {
              playSchdlNo: 'S2',
              movieNo: 'M1',
              movieNm: '영화A',
              brchNo: '1372',
              brchNm: '강남',
              playStartTime: '1830',
              playEndTime: '2020',
              restSeatCnt: 8,
              totSeatCnt: 100,
            },
          ],
        }),
      ),
    );

    const res = await app.request(
      '/api/megabox/seats?playDate=20260304&fromTime=1700&toTime=1900&minRemainingSeats=10&sort=remainingSeats-desc',
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data.filters.fromTime).toBe('1700');
    expect(data.data.filters.toTime).toBe('1900');
    expect(data.data.filters.minRemainingSeats).toBe(10);
    expect(data.data.filters.sort).toBe('remainingSeats-desc');
    expect(data.data.seats).toHaveLength(1);
    expect(data.data.seats[0].scheduleId).toBe('S1');
  });

  it('잘못된 시간대는 400을 반환한다', async () => {
    const res = await app.request('/api/megabox/seats?playDate=20260304&fromTime=2500');
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_TIME_WINDOW');
  });

  it('잘못된 좌석 필터는 400을 반환한다', async () => {
    const res = await app.request('/api/megabox/seats?playDate=20260304&sort=distance-asc');
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_SHOWTIME_FILTER');
  });
});

describe('GET /api/megabox/seat-map', () => {
  it('메가박스 좌석맵을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          movieDtlInfo: {
            playSchdlNo: '2603101372011',
            brchNo: '1372',
            brchNm: '강남',
            movieNo: '25104501',
            movieNm: '왕과 사는 남자',
            playDe: '20260310',
            playStartTime: '1800',
            playEndTime: '2007',
          },
          maxTicketCnt: '8',
          seatListSD01: [
            {
              seatUniqNo: '00100101',
              rowNm: 'A',
              seatNo: 1,
              rowNo: 1,
              colNo: 1,
              seatExpoAt: 'Y',
              horzCoorVal: 1,
              vertCoorVal: 1,
              seatStatCd: 'GERN_SELL',
            },
          ],
          seatTicketAmtList: [],
        }),
      ),
    );

    const res = await app.request('/api/megabox/seat-map?playSchdlNo=2603101372011');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.playSchdlNo).toBe('2603101372011');
    expect(data.data.seatMap.summary.totalSeats).toBe(1);
  });

  it('회차 ID가 없으면 400을 반환한다', async () => {
    const res = await app.request('/api/megabox/seat-map');
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('MISSING_PLAY_SCHEDULE_ID');
  });
});
