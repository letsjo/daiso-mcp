/**
 * CGV 영화 검색 도구 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchMoviesTool } from '../../../../src/services/cgv/tools/searchMovies.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createSearchMoviesTool', () => {
  it('올바른 도구 정의를 반환한다', () => {
    const tool = createSearchMoviesTool();

    expect(tool.name).toBe('cgv_search_movies');
    expect(tool.metadata.title).toBe('CGV 영화 검색');
  });

  it('영화 목록을 반환한다', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            statusCode: 0,
            statusMessage: '조회 되었습니다.',
            data: [{ movNo: '30000985', movNm: '테스트 영화', cratgClsNm: '전체관람가' }],
          }),
        ),
      ),
    );

    const tool = createSearchMoviesTool();
    const result = await tool.handler({ playDate: '20260304', theaterCode: '0056' });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(1);
    expect(parsed.movies[0].movieName).toBe('테스트 영화');
    expect(parsed.filters.theaterCode).toBe('0056');
  });

  it('극장명 검색어와 정렬 기준을 반영한다', async () => {
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              statusCode: 0,
              statusMessage: '조회 되었습니다.',
              data: [
                {
                  regnGrpCd: '01',
                  regnGrpNm: '서울',
                  siteList: [{ siteNo: '0366', siteNm: '고덕강일' }],
                },
              ],
            }),
          ),
        ),
      )
      .mockImplementationOnce(() =>
        Promise.resolve(
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
                  cratgClsNm: '12세',
                  scnsrtTm: '1010',
                  sortOseq: '1',
                },
              ],
            }),
          ),
        ),
      );

    const tool = createSearchMoviesTool();
    const result = await tool.handler({
      playDate: '20260304',
      theaterQuery: '고덕강일',
      sort: 'popularity-desc',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.filters.theaterCode).toBeNull();
    expect(parsed.filters.theaterQuery).toBe('고덕강일');
    expect(parsed.filters.sort).toBe('popularity-desc');
    expect(parsed.movies[0].showtimeCount).toBe(1);
  });

  it('필터가 없으면 null로 반환한다', async () => {
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve(
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
        ),
      )
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              statusCode: 0,
              statusMessage: '조회 되었습니다.',
              data: [
                {
                  siteNo: '0056',
                  siteNm: 'CGV 강남',
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
        ),
      );

    const tool = createSearchMoviesTool();
    const result = await tool.handler({ playDate: '20260304' });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.filters.theaterCode).toBeNull();
    expect(parsed.filters.theaterQuery).toBeNull();
    expect(parsed.filters.sort).toBe('popularity-desc');
  });
});
