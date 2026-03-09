/**
 * CGV 영화 조회 클라이언트 테스트
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCgvMovies, toYyyymmdd } from '../../../src/services/cgv/client.js';
import { setupMockFetch } from './clientTestSupport.js';

const mockFetch = setupMockFetch();

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchCgvMovies', () => {
  it('극장 시간표 기준으로 전체 영화 목록을 인기순으로 정렬한다', async () => {
    mockFetch.mockResolvedValue(
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
              cratgClsNm: '12세',
              scnsrtTm: '1230',
              sortOseq: '5',
            },
            {
              siteNo: '0056',
              siteNm: 'CGV강남',
              scnYmd: '20260304',
              scnSseq: '2',
              movNo: 'M2',
              movNm: '영화B',
              cratgClsNm: '15세',
              scnsrtTm: '0930',
              sortOseq: '5',
            },
            {
              siteNo: '0056',
              siteNm: 'CGV강남',
              scnYmd: '20260304',
              scnSseq: '3',
              movNo: 'M2',
              movNm: '영화B',
              cratgClsNm: '15세',
              scnsrtTm: '1830',
              sortOseq: '5',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toEqual([
      {
        movieCode: 'M2',
        movieName: '영화B',
        rating: '15세',
        showtimeCount: 2,
        firstStartTime: '09:30',
      },
      {
        movieCode: 'M1',
        movieName: '영화A',
        rating: '12세',
        showtimeCount: 1,
        firstStartTime: '12:30',
      },
    ]);
  });

  it('극장명 검색어로 극장을 찾아 영화 목록을 조회한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [
              {
                regnGrpCd: '01',
                regnGrpNm: '서울',
                siteList: [
                  { siteNo: '0056', siteNm: '강남' },
                  { siteNo: '0366', siteNm: '고덕강일' },
                ],
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [
              {
                siteNo: '0366',
                siteNm: 'CGV 고덕강일',
                scnYmd: '20260304',
                scnSseq: '1',
                movNo: 'M1',
                movNm: '영화A',
                cratgClsNm: '전체관람가',
                scnsrtTm: '1010',
                sortOseq: '1',
              },
            ],
          }),
        ),
      );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterQuery: '고덕강일' });

    expect(result).toHaveLength(1);
    expect(result[0].movieCode).toBe('M1');
    expect(String(mockFetch.mock.calls[1][0])).toContain('siteNo=0366');
  });

  it('시간표가 비어 있으면 영화 목록 API로 fallback한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [
              { movNo: '30000985', movNm: '테스트 영화', cratgClsNm: '전체관람가', atktRate: '12.3' },
            ],
          }),
        ),
      );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toEqual([
      {
        movieCode: '30000985',
        movieName: '테스트 영화',
        rating: '전체관람가',
        ticketRate: 12.3,
      },
    ]);
  });

  it('극장 목록이 비어 있으면 기본 극장 코드로 fallback하고 잘못된 영화 항목은 제외한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [
              { movNo: '30000985', movNm: '테스트 영화' },
              { movNo: '30000986' },
            ],
          }),
        ),
      );

    const result = await fetchCgvMovies({ playDate: '20260304' });

    expect(String(mockFetch.mock.calls[2][0])).toContain('siteNo=0056');
    expect(result).toEqual([
      {
        movieCode: '30000985',
        movieName: '테스트 영화',
        rating: undefined,
        ticketRate: undefined,
      },
    ]);
  });

  it('시간표 요청이 실패해도 영화 목록 fallback이 성공하면 결과를 반환한다', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('timetable fail'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [{ movNo: '30000985', movNm: '테스트 영화', cratgClsNm: '전체관람가' }],
          }),
        ),
      );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toEqual([
      {
        movieCode: '30000985',
        movieName: '테스트 영화',
        rating: '전체관람가',
        ticketRate: undefined,
      },
    ]);
  });

  it('영화 목록 data가 없으면 빈 배열을 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
          }),
        ),
      );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' });
    expect(result).toEqual([]);
  });

  it('시간표와 영화 목록이 모두 실패하면 시간표 에러를 우선 던진다', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('timetable fail'))
      .mockRejectedValueOnce(new Error('movie list fail'));

    await expect(fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' })).rejects.toThrow(
      'timetable fail',
    );
  });

  it('시간표는 비어 있고 영화 목록만 실패하면 영화 목록 에러를 던진다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [],
          }),
        ),
      )
      .mockRejectedValueOnce(new Error('movie list fail'));

    await expect(fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' })).rejects.toThrow(
      'movie list fail',
    );
  });

  it('cgv-default 정렬이면 CGV 기본 노출 순서를 우선한다', async () => {
    mockFetch.mockResolvedValue(
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
              cratgClsNm: '12세',
              scnsrtTm: '1230',
              sortOseq: '9',
            },
            {
              siteNo: '0056',
              siteNm: 'CGV강남',
              scnYmd: '20260304',
              scnSseq: '2',
              movNo: 'M2',
              movNm: '영화B',
              cratgClsNm: '15세',
              scnsrtTm: '0930',
              sortOseq: '1',
            },
            {
              siteNo: '0056',
              siteNm: 'CGV강남',
              scnYmd: '20260304',
              scnSseq: '3',
              movNo: 'M1',
              movNm: '영화A',
              cratgClsNm: '12세',
              scnsrtTm: '1830',
              sortOseq: '9',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvMovies({
      playDate: '20260304',
      theaterCode: '0056',
      sort: 'cgv-default',
    });

    expect(result[0].movieCode).toBe('M2');
    expect(result[1].movieCode).toBe('M1');
  });

  it('playDate가 없으면 오늘 날짜를 사용한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T00:00:00.000Z'));
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [],
          }),
        ),
      ),
    );

    await fetchCgvMovies({ theaterCode: '0056' });

    const calledUrl = String(mockFetch.mock.calls[0][0]);
    expect(calledUrl).toContain('scnYmd=20260306');
  });

  it('극장명 검색어가 없으면 에러를 발생시킨다', async () => {
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

    await expect(fetchCgvMovies({ playDate: '20260304', theaterQuery: '없는극장' })).rejects.toThrow(
      'CGV 극장을 찾을 수 없습니다: 없는극장',
    );
  });
});

describe('toYyyymmdd', () => {
  it('Date를 YYYYMMDD로 변환한다', () => {
    const value = toYyyymmdd(new Date('2026-03-04T00:00:00.000Z'));
    expect(value).toBe('20260304');
  });
});
