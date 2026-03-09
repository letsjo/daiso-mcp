/**
 * CGV 영화 조회 핸들러 추가 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleCgvSearchMovies, handleCgvSearchMoviesByTheater } from '../../src/api/cgvHandlers.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createMockContext(query: Record<string, string> = {}) {
  return {
    env: {},
    req: {
      query: (key: string) => query[key],
      param: () => undefined,
    },
    json: vi.fn().mockImplementation((data, status) => ({
      data,
      status: status || 200,
    })),
  } as unknown as Parameters<typeof handleCgvSearchMovies>[0];
}

describe('handleCgvSearchMovies movie-specific cases', () => {
  it('극장명 검색어와 정렬 기준을 응답 필터에 포함한다', async () => {
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
                siteList: [{ siteNo: '0366', siteNm: '고덕강일' }],
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
                cratgClsNm: '12세',
                scnsrtTm: '1010',
                sortOseq: '1',
              },
            ],
          }),
        ),
      );

    const ctx = createMockContext({
      playDate: '20260304',
      theaterQuery: '고덕강일',
      sort: 'popularity-desc',
    });
    await handleCgvSearchMovies(ctx);

    const payload = (ctx.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      data: {
        filters: { theaterCode: string | null; theaterQuery: string | null; sort: string };
      };
      meta: { sortApplied: string };
    };
    expect(payload.data.filters.theaterCode).toBeNull();
    expect(payload.data.filters.theaterQuery).toBe('고덕강일');
    expect(payload.data.filters.sort).toBe('popularity-desc');
    expect(payload.meta.sortApplied).toBe('popularity-desc');
  });

  it('잘못된 정렬 기준이면 400을 반환한다', async () => {
    const ctx = createMockContext({ sort: 'distance-asc' });
    await handleCgvSearchMovies(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INVALID_CGV_MOVIE_SORT',
          message: '지원하지 않는 CGV 영화 정렬입니다. popularity-desc, cgv-default 중에서 선택해주세요.',
        },
      }),
      400,
    );
  });

  it('극장명 검색어를 찾지 못하면 404를 반환한다', async () => {
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

    const ctx = createMockContext({ playDate: '20260304', theaterQuery: '없는극장' });
    await handleCgvSearchMovies(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'CGV_THEATER_NOT_FOUND',
          message: 'CGV 극장을 찾을 수 없습니다: 없는극장',
        },
      }),
      404,
    );
  });
});

describe('handleCgvSearchMoviesByTheater', () => {
  it('theaterQuery가 없으면 400을 반환한다', async () => {
    const ctx = createMockContext({ playDate: '20260304' }) as unknown as Parameters<
      typeof handleCgvSearchMoviesByTheater
    >[0];
    await handleCgvSearchMoviesByTheater(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'MISSING_THEATER_QUERY',
          message: 'theaterQuery 파라미터가 필요합니다.',
        },
      }),
      400,
    );
  });
});
