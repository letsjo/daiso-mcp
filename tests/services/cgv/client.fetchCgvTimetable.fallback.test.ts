/**
 * CGV 시간표 fallback 클라이언트 테스트
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCgvTimetable } from '../../../src/services/cgv/client.js';
import { setupMockFetch } from './clientTestSupport.js';

const mockFetch = setupMockFetch();

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchCgvTimetable fallback', () => {
  it('theaterCode가 있고 사이트 시간표가 비면 같은 극장에서 fallback 탐색한다', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0, data: [] })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 0, data: [{ movNo: 'M1', movNm: '영화1' }] })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              {
                siteNo: '0056',
                siteNm: 'CGV 강남',
                scnYmd: '20260304',
                scnSseq: '8',
                movNo: 'M1',
                movNm: '영화1',
                scnsrtTm: '2100',
                scnendTm: '2300',
                stcnt: '90',
                frSeatCnt: '33',
              },
            ],
          }),
        ),
      );

    const result = await fetchCgvTimetable({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toHaveLength(1);
    expect(result[0].movieCode).toBe('M1');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('playDate가 없으면 오늘 날짜를 사용한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T00:00:00.000Z'));
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              scnYmd: '20260307',
            },
          ],
        }),
      ),
    );

    await fetchCgvTimetable({ theaterCode: '0056', movieCode: '30000985' });

    const calledUrl = String(mockFetch.mock.calls[0][0]);
    expect(calledUrl).toContain('scnYmd=20260307');
  });

  it('시간표 data가 없으면 빈 배열을 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0 })));

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toEqual([]);
  });

  it('movieCode가 있고 사이트 시간표가 비면 영화코드 조회로 fallback한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              {
                siteNo: '0056',
                siteNm: 'CGV 강남',
                scnYmd: '20260304',
                scnSseq: '3',
                movNo: '30000985',
                movNm: '테스트 영화',
                scnsrtTm: '1840',
                scnendTm: '2043',
                stcnt: '123',
                frSeatCnt: '77',
              },
            ],
          }),
        ),
      );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toHaveLength(1);
    expect(result[0].remainingSeats).toBe(77);
    expect(String(mockFetch.mock.calls[1][0])).toContain('/cnm/atkt/searchSchByMov');
  });

  it('사이트 시간표 data가 없으면 빈 배열로 처리 후 fallback한다', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0 })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              {
                siteNo: '0056',
                siteNm: 'CGV 강남',
                scnYmd: '20260304',
                scnSseq: '12',
                movNo: '30000985',
                movNm: '테스트 영화',
                scnsrtTm: '1600',
                scnendTm: '1800',
                stcnt: '123',
                frSeatCnt: '66',
              },
            ],
          }),
        ),
      );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toHaveLength(1);
    expect(result[0].remainingSeats).toBe(66);
  });

  it('theaterCode가 없고 사이트 시간표가 비면 극장/영화 fallback 탐색으로 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [{ regnGrpCd: '01', siteList: [{ siteNo: '0100', siteNm: '홍대' }] }],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0, data: [] })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [{ regnGrpCd: '01', siteList: [{ siteNo: '0100', siteNm: '홍대' }] }],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 0, data: [{ movNo: 'M1', movNm: '영화1' }] })),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0, data: [] })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 0, data: [{ movNo: 'M2', movNm: '영화2' }] })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              {
                siteNo: '0100',
                siteNm: 'CGV 홍대',
                scnYmd: '20260304',
                scnSseq: '7',
                movNo: 'M2',
                movNm: '영화2',
                scnsrtTm: '2010',
                scnendTm: '2200',
                stcnt: '100',
                frSeatCnt: '55',
              },
            ],
          }),
        ),
      );

    const result = await fetchCgvTimetable({ playDate: '20260304' });

    expect(result).toHaveLength(1);
    expect(result[0].movieCode).toBe('M2');
    expect(result[0].remainingSeats).toBe(55);
    expect(mockFetch).toHaveBeenCalledTimes(7);
  });

  it('fallback 탐색에도 시간표가 없으면 빈 배열을 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [{ regnGrpCd: '01', siteList: [{ siteNo: '0100', siteNm: '홍대' }] }],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0, data: [] })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [{ regnGrpCd: '01', siteList: [{ siteNo: '0100', siteNm: '홍대' }] }],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0, data: [] })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 0, data: [{ movNo: 'M2', movNm: '영화2' }] })),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0, data: [] })));

    const result = await fetchCgvTimetable({ playDate: '20260304' });
    expect(result).toEqual([]);
  });
});
