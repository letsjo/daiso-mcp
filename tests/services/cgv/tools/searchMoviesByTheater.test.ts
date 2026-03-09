/**
 * CGV 극장별 영화 검색 도구 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchMoviesByTheaterTool } from '../../../../src/services/cgv/tools/searchMoviesByTheater.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createSearchMoviesByTheaterTool', () => {
  it('올바른 도구 정의를 반환한다', () => {
    const tool = createSearchMoviesByTheaterTool();

    expect(tool.name).toBe('cgv_search_movies_by_theater');
    expect(tool.metadata.title).toBe('CGV 극장별 영화 검색');
  });

  it('극장명으로 영화 목록을 반환한다', async () => {
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

    const tool = createSearchMoviesByTheaterTool();
    const result = await tool.handler({
      playDate: '20260304',
      theaterQuery: '고덕강일',
      sort: 'popularity-desc',
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(1);
    expect(parsed.filters.theaterCode).toBeNull();
    expect(parsed.filters.theaterQuery).toBe('고덕강일');
    expect(parsed.filters.sort).toBe('popularity-desc');
  });
});
