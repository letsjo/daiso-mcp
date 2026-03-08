import { describe, expect, it, vi } from 'vitest';
import { handleUnifiedSearch } from '../../src/api/searchHandler.js';
import { createMockContext, createMockProductResponse, setupFetchMock } from './testHelpers.js';
import {
  LIMIT_PER_SERVICE_ERROR_MESSAGE,
  TIMEOUT_MS_ERROR_MESSAGE,
} from '../../src/unified-search/constants.js';

const mockFetch = vi.fn();
setupFetchMock(mockFetch);

function getJsonPayload(ctx: ReturnType<typeof createMockContext>) {
  return (ctx.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
}

describe('handleUnifiedSearch', () => {
  it('검색어가 없으면 에러를 반환한다', async () => {
    const ctx = createMockContext({});
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'MISSING_QUERY', message: '검색어(q)를 입력해주세요.' },
      }),
      400,
    );
  });

  it('지원하지 않는 services를 거부한다', async () => {
    const ctx = createMockContext({ q: '강남', services: 'daiso,unknown' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INVALID_SERVICES',
          message: '지원하지 않는 서비스입니다: unknown',
        },
      }),
      400,
    );
  });

  it('지원하지 않는 types를 거부한다', async () => {
    const ctx = createMockContext({ q: '강남', types: 'product,unknown' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INVALID_TYPES',
          message: '지원하지 않는 검색 타입입니다: unknown',
        },
      }),
      400,
    );
  });

  it('limitPerService가 잘못되면 에러를 반환한다', async () => {
    const ctx = createMockContext({ q: '강남', limitPerService: '0' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'INVALID_LIMIT', message: LIMIT_PER_SERVICE_ERROR_MESSAGE },
      }),
      400,
    );
  });

  it('limitPerService가 최대치를 넘으면 에러를 반환한다', async () => {
    const ctx = createMockContext({ q: '강남', limitPerService: '51' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'INVALID_LIMIT', message: LIMIT_PER_SERVICE_ERROR_MESSAGE },
      }),
      400,
    );
  });

  it('timeoutMs가 잘못되면 에러를 반환한다', async () => {
    const ctx = createMockContext({ q: '강남', timeoutMs: '0' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'INVALID_TIMEOUT', message: TIMEOUT_MS_ERROR_MESSAGE },
      }),
      400,
    );
  });

  it('timeoutMs가 최대치를 넘으면 에러를 반환한다', async () => {
    const ctx = createMockContext({ q: '강남', timeoutMs: '30001' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'INVALID_TIMEOUT', message: TIMEOUT_MS_ERROR_MESSAGE },
      }),
      400,
    );
  });

  it('좌표가 잘못되면 에러를 반환한다', async () => {
    const ctx = createMockContext({ q: '강남', lat: 'x', lng: '127.0' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'INVALID_LOCATION', message: 'lat, lng는 유효한 숫자여야 합니다.' },
      }),
      400,
    );
  });

  it('부분 실패가 발생해도 200 응답으로 그룹 결과를 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockProductResponse([{ PD_NO: 'P1', PDNM: '정리함', PD_PRC: '1000' }]))) )
      .mockRejectedValueOnce(new Error('olive fail'));

    const ctx = createMockContext({
      q: '정리함',
      services: 'daiso,oliveyoung',
      types: 'product',
    });

    await handleUnifiedSearch(ctx);

    const payload = getJsonPayload(ctx) as {
      success: boolean;
      data: { results: Record<string, unknown>; errors: Array<{ service: string }> };
      meta: { partialFailure: boolean; limitPerService: number };
    };

    expect(payload.success).toBe(false);
    expect(payload.meta.partialFailure).toBe(true);
    expect(payload.meta.limitPerService).toBe(5);
    expect(payload.data.results.daiso).toBeDefined();
    expect(payload.data.errors[0].service).toBe('oliveyoung');
  });

  it('유효한 limitPerService와 timeoutMs를 파싱해 전달한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(createMockProductResponse([{ PD_NO: 'P1', PDNM: '정리함', PD_PRC: '1000' }])))
    );

    const ctx = createMockContext({
      q: '정리함',
      services: 'daiso',
      types: 'product',
      limitPerService: '3',
      timeoutMs: '2000',
    });

    await handleUnifiedSearch(ctx);

    const payload = getJsonPayload(ctx) as {
      success: boolean;
      meta: { limitPerService: number; timeoutMs: number };
    };

    expect(payload.success).toBe(true);
    expect(payload.meta).toEqual(
      expect.objectContaining({
        limitPerService: 3,
        timeoutMs: 2000,
      }),
    );
  });
});
