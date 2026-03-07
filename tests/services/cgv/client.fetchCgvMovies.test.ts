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
  it('영화 목록을 정규화한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            { movNo: '30000985', movNm: '테스트 영화', cratgClsNm: '전체관람가' },
            { movNo: '30000986', movNm: '테스트 영화2', cratgClsNm: null },
          ],
        }),
      ),
    );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toHaveLength(2);
    expect(result[0].movieCode).toBe('30000985');
    expect(result[0].rating).toBe('전체관람가');
    expect(result[1].rating).toBeUndefined();
  });

  it('극장 코드가 없으면 극장 목록에서 첫 극장을 사용한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [{ regnGrpCd: '01', siteList: [{ siteNo: '0056', siteNm: '강남' }] }],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [{ movNo: '30000985', movNm: '테스트 영화' }],
          }),
        ),
      );

    const result = await fetchCgvMovies({ playDate: '20260304' });

    expect(result).toHaveLength(1);
    expect(result[0].movieCode).toBe('30000985');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('극장 목록이 비어 있으면 기본 극장 코드(0056)를 사용한다', async () => {
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
      );

    await fetchCgvMovies({ playDate: '20260304' });

    const calledUrl = String(mockFetch.mock.calls[1][0]);
    expect(calledUrl).toContain('siteNo=0056');
  });

  it('playDate가 없으면 오늘 날짜를 사용한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T00:00:00.000Z'));
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [],
        }),
      ),
    );

    await fetchCgvMovies({ theaterCode: '0056' });

    const calledUrl = String(mockFetch.mock.calls[0][0]);
    expect(calledUrl).toContain('scnYmd=20260306');
  });

  it('영화 목록 data가 없으면 빈 배열을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
        }),
      ),
    );

    const result = await fetchCgvMovies({ playDate: '20260304', theaterCode: '0056' });
    expect(result).toEqual([]);
  });
});

describe('toYyyymmdd', () => {
  it('Date를 YYYYMMDD로 변환한다', () => {
    const value = toYyyymmdd(new Date('2026-03-04T00:00:00.000Z'));
    expect(value).toBe('20260304');
  });
});
