/**
 * 앱 통합 테스트 - CGV API
 */

import { describe, expect, it, vi } from 'vitest';
import app from '../../src/index.js';
import { setupFetchMock } from './testHelpers.js';

const mockFetch = vi.fn();
setupFetchMock(mockFetch);

describe('GET /api/cgv/theaters', () => {
  it('CGV 극장 목록을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              regnGrpCd: '01',
              regnGrpNm: '서울',
              siteList: [{ siteNo: '0056', siteNm: '강남' }],
            },
          ],
        }),
      ),
    );

    const res = await app.request('/api/cgv/theaters?playDate=20260304&regionCode=01');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.theaters).toHaveLength(1);
  });
});

describe('GET /api/cgv/movies', () => {
  it('CGV 영화 목록을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [{ movNo: '30000985', movNm: '영화A', cratgClsNm: '12세' }],
        }),
      ),
    );

    const res = await app.request('/api/cgv/movies?playDate=20260304&theaterCode=0056');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.movies).toHaveLength(1);
  });
});

describe('GET /api/cgv/timetable', () => {
  it('CGV 시간표를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV강남',
              scnYmd: '20260304',
              scnSseq: '1',
              movNo: 'M1',
              movNm: '영화A',
              scnsrtTm: '0930',
              scnendTm: '1130',
              stcnt: 100,
              frSeatCnt: 30,
            },
          ],
        }),
      ),
    );

    const res = await app.request('/api/cgv/timetable?playDate=20260304&theaterCode=0056');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.timetable).toHaveLength(1);
  });

  it('시간대, 최소 잔여 좌석, 정렬 기준으로 회차를 좁힌다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV강남',
              scnYmd: '20260304',
              scnSseq: '1',
              movNo: 'M1',
              movNm: '영화A',
              scnsrtTm: '1730',
              scnendTm: '1930',
              stcnt: 100,
              frSeatCnt: 30,
            },
            {
              siteNo: '0056',
              siteNm: 'CGV강남',
              scnYmd: '20260304',
              scnSseq: '2',
              movNo: 'M1',
              movNm: '영화A',
              scnsrtTm: '1830',
              scnendTm: '2030',
              stcnt: 100,
              frSeatCnt: 20,
            },
          ],
        }),
      ),
    );

    const res = await app.request(
      '/api/cgv/timetable?playDate=20260304&theaterCode=0056&fromTime=1700&toTime=1900&minRemainingSeats=25&sort=remainingSeats-desc',
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data.filters.fromTime).toBe('1700');
    expect(data.data.filters.toTime).toBe('1900');
    expect(data.data.filters.minRemainingSeats).toBe(25);
    expect(data.data.filters.sort).toBe('remainingSeats-desc');
    expect(data.data.timetable).toHaveLength(1);
    expect(data.data.timetable[0].scheduleId).toBe('2026030400561');
  });

  it('잘못된 시간대는 400을 반환한다', async () => {
    const res = await app.request('/api/cgv/timetable?playDate=20260304&fromTime=2500');
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_TIME_WINDOW');
  });

  it('잘못된 좌석 필터는 400을 반환한다', async () => {
    const res = await app.request('/api/cgv/timetable?playDate=20260304&sort=distance-asc');
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_SHOWTIME_FILTER');
  });
});
