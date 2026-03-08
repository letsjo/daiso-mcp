import { describe, expect, it, vi } from 'vitest';
import { handleUnifiedSearch } from '../../src/api/searchHandler.js';
import { createMockContext, createMockProductResponse, setupFetchMock } from './testHelpers.js';
import {
  LIMIT_PER_SERVICE_ERROR_MESSAGE,
  TIMEOUT_MS_ERROR_MESSAGE,
} from '../../src/unified-search/constants.js';
import { encodeUnifiedSearchCursor } from '../../src/unified-search/cursor.js';
import { createZyteSuccessResponse } from '../unified-search/testHelpers.js';
import * as cursorValidatorModule from '../../src/unified-search/cursorValidator.js';

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

  it('invalid cursor는 400 에러를 반환한다', async () => {
    const ctx = createMockContext({ cursor: '%%%invalid' });
    await handleUnifiedSearch(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INVALID_CURSOR',
          message: 'cursor를 디코딩할 수 없습니다.',
        },
      }),
      400,
    );
  });

  it('daiso product cursor가 들어오면 다음 페이지를 조회한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          createMockProductResponse([{ PD_NO: 'P6', PDNM: '정리함 6', PD_PRC: '1000' }], 11),
        ),
      ),
    );

    const ctx = createMockContext({
      cursor: 'eyJ2IjoxLCJzZXJ2aWNlIjoiZGFpc28iLCJidWNrZXQiOiJwcm9kdWN0cyIsInF1ZXJ5Ijoi7KCV66as7ZWoIiwibGltaXRQZXJTZXJ2aWNlIjo1LCJwYWdlIjoyfQ',
    });
    await handleUnifiedSearch(ctx);

    const payload = getJsonPayload(ctx) as {
      success: boolean;
      data: {
        query: string;
        results: {
          daiso: {
            products: Array<{ id: string }>;
          };
        };
      };
      meta: {
        requestedServices: string[];
        requestedTypes: string[];
        services: {
          daiso: {
            products: {
              nextCursor?: string;
            };
          };
        };
      };
    };

    expect(payload.success).toBe(true);
    expect(payload.data.query).toBe('정리함');
    expect(payload.data.results.daiso.products[0].id).toBe('P6');
    expect(payload.meta.requestedServices).toEqual(['daiso']);
    expect(payload.meta.requestedTypes).toEqual(['product']);
    expect(payload.meta.services.daiso.products.nextCursor).toBe(
      encodeUnifiedSearchCursor({
        v: 1,
        service: 'daiso',
        bucket: 'products',
        query: '정리함',
        limitPerService: 5,
        page: 3,
      }),
    );
    expect(mockFetch.mock.calls[0][0]).toContain('pageNum=2');
  });

  it('oliveyoung product cursor가 들어오면 다음 페이지를 조회한다', async () => {
    mockFetch.mockResolvedValueOnce(
      createZyteSuccessResponse({
        status: 'SUCCESS',
        data: {
          totalCount: 21,
          nextPage: true,
          searchList: [
            {
              goodsNumber: 'G6',
              goodsName: '선크림 6',
              priceToPay: 10000,
              originalPrice: 12000,
              o2oStockFlag: true,
            },
          ],
        },
      }),
    );

    const ctx = createMockContext({
      cursor: encodeUnifiedSearchCursor({
        v: 1,
        service: 'oliveyoung',
        bucket: 'products',
        query: '선크림',
        limitPerService: 5,
        page: 2,
      }),
    });
    await handleUnifiedSearch(ctx);

    const payload = getJsonPayload(ctx) as {
      success: boolean;
      data: {
        query: string;
        results: {
          oliveyoung: {
            products: Array<{ id: string }>;
          };
        };
      };
      meta: {
        requestedServices: string[];
        requestedTypes: string[];
        services: {
          oliveyoung: {
            products: {
              nextCursor?: string;
            };
          };
        },
      };
    };

    expect(payload.success).toBe(true);
    expect(payload.data.query).toBe('선크림');
    expect(payload.data.results.oliveyoung.products[0].id).toBe('G6');
    expect(payload.meta.requestedServices).toEqual(['oliveyoung']);
    expect(payload.meta.requestedTypes).toEqual(['product']);
    expect(payload.meta.services.oliveyoung.products.nextCursor).toBe(
      encodeUnifiedSearchCursor({
        v: 1,
        service: 'oliveyoung',
        bucket: 'products',
        query: '선크림',
        limitPerService: 5,
        page: 3,
      }),
    );
  });

  it('예상하지 못한 cursor validator 오류는 그대로 다시 던진다', async () => {
    vi.spyOn(cursorValidatorModule, 'validateUnifiedSearchCursorInput').mockImplementation(() => {
      throw new Error('unexpected validator failure');
    });

    const ctx = createMockContext({ q: '강남' });

    await expect(handleUnifiedSearch(ctx)).rejects.toThrow('unexpected validator failure');
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
      new Response(
        JSON.stringify(
          createMockProductResponse([{ PD_NO: 'P1', PDNM: '정리함', PD_PRC: '1000' }], 1),
        ),
      ),
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
      meta: {
        limitPerService: number;
        timeoutMs: number;
        services: {
          daiso: {
            products: {
              returnedCount: number;
              truncated: boolean;
              sortApplied: string;
            };
          };
        };
      };
    };

    expect(payload.success).toBe(true);
    expect(payload.meta).toEqual(
      expect.objectContaining({
        limitPerService: 3,
        timeoutMs: 2000,
        services: {
          daiso: {
            products: {
              returnedCount: 1,
              truncated: false,
              sortApplied: 'service-default',
            },
          },
        },
      }),
    );
  });
});
