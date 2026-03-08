import { describe, expect, it, vi } from 'vitest';
import { UnifiedSearchAggregator } from '../../src/unified-search/aggregator.js';
import type {
  UnifiedSearchAdapter,
  UnifiedSearchQuery,
  UnifiedSearchResultBuckets,
} from '../../src/unified-search/interfaces.js';

function createAdapter(
  adapter: Partial<UnifiedSearchAdapter> & Pick<UnifiedSearchAdapter, 'service' | 'supportedTypes'>,
) {
  return {
    search: vi.fn<UnifiedSearchAdapter['search']>(),
    ...adapter,
  } satisfies UnifiedSearchAdapter;
}

function getFirstCallQuery(adapter: UnifiedSearchAdapter): UnifiedSearchQuery {
  return vi.mocked(adapter.search).mock.calls[0][0];
}

describe('UnifiedSearchAggregator', () => {
  it('기본 등록 서비스 전체를 그룹 응답으로 반환한다', async () => {
    const daiso = createAdapter({
      service: 'daiso',
      supportedTypes: ['product', 'store'],
      search: vi.fn().mockResolvedValue({
        products: [{ id: 'p1', type: 'product', title: '정리함', service: 'daiso', price: 1000 }],
        meta: {
          products: {
            returnedCount: 1,
            truncated: false,
            sortApplied: 'service-default',
          },
        },
      }),
    });
    const cgv = createAdapter({
      service: 'cgv',
      supportedTypes: ['movie', 'theater'],
      search: vi.fn().mockResolvedValue({
        theaters: [{ id: 't1', type: 'theater', title: 'CGV 강남', service: 'cgv' }],
        meta: {
          theaters: {
            returnedCount: 1,
            truncated: false,
            sortApplied: 'service-default',
          },
        },
      }),
    });
    const aggregator = new UnifiedSearchAggregator([daiso, cgv]);

    const result = await aggregator.search({ query: '강남' });

    expect(result).toEqual({
      success: true,
      data: {
        query: '강남',
        results: {
          daiso: {
            products: [
              { id: 'p1', type: 'product', title: '정리함', service: 'daiso', price: 1000 },
            ],
            stores: [],
            movies: [],
            theaters: [],
          },
          cgv: {
            products: [],
            stores: [],
            movies: [],
            theaters: [{ id: 't1', type: 'theater', title: 'CGV 강남', service: 'cgv' }],
          },
        },
        errors: [],
      },
      meta: {
        partialFailure: false,
        requestedServices: ['daiso', 'cgv'],
        requestedTypes: ['product', 'store', 'movie', 'theater'],
        limitPerService: 5,
        timeoutMs: undefined,
        services: {
          daiso: {
            products: {
              returnedCount: 1,
              truncated: false,
              sortApplied: 'service-default',
            },
            stores: {
              returnedCount: 0,
              truncated: false,
              sortApplied: 'service-default',
            },
          },
          cgv: {
            movies: {
              returnedCount: 0,
              truncated: false,
              sortApplied: 'service-default',
            },
            theaters: {
              returnedCount: 1,
              truncated: false,
              sortApplied: 'service-default',
            },
          },
        },
      },
    });

    expect(getFirstCallQuery(daiso)).toMatchObject({
      service: 'daiso',
      types: ['product', 'store'],
      limitPerService: 5,
    });
    expect(getFirstCallQuery(cgv)).toMatchObject({
      service: 'cgv',
      types: ['movie', 'theater'],
      limitPerService: 5,
    });
  });

  it('services, types, limitPerService, timeoutMs 필터를 어댑터 호출에 반영한다', async () => {
    const cgv = createAdapter({
      service: 'cgv',
      supportedTypes: ['movie', 'theater'],
      search: vi.fn().mockResolvedValue({
        movies: [{ id: 'm1', type: 'movie', title: '영화', service: 'cgv' }],
      }),
    });
    const aggregator = new UnifiedSearchAggregator([cgv]);

    const result = await aggregator.search({
      query: '강남',
      services: ['cgv'],
      types: ['movie'],
      limitPerService: 3,
      timeoutMs: 1500,
    });

    expect(result.meta).toEqual({
      partialFailure: false,
      requestedServices: ['cgv'],
      requestedTypes: ['movie'],
      limitPerService: 3,
      timeoutMs: 1500,
      services: {
        cgv: {
          movies: {
            returnedCount: 1,
            truncated: false,
            sortApplied: 'service-default',
          },
        },
      },
    });
    expect(getFirstCallQuery(cgv)).toMatchObject({
      service: 'cgv',
      types: ['movie'],
      limitPerService: 3,
      timeoutMs: 1500,
    });
  });

  it('지원하지 않는 타입만 요청되면 어댑터 호출 없이 빈 그룹을 반환한다', async () => {
    const cgv = createAdapter({
      service: 'cgv',
      supportedTypes: ['movie'],
      search: vi.fn(),
    });
    const aggregator = new UnifiedSearchAggregator([cgv]);

    const result = await aggregator.search({
      query: '강남',
      services: ['cgv'],
      types: ['store'],
    });

    expect(cgv.search).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.results.cgv).toEqual({
      products: [],
      stores: [],
      movies: [],
      theaters: [],
    });
    expect(result.meta.services.cgv).toEqual({});
  });

  it('등록되지 않은 서비스를 요청하면 partial failure를 반환한다', async () => {
    const aggregator = new UnifiedSearchAggregator();

    const result = await aggregator.search({
      query: '강남',
      services: ['megabox'],
    });

    expect(result.success).toBe(false);
    expect(result.data.errors).toEqual([
      {
        service: 'megabox',
        code: 'UNSUPPORTED_SERVICE',
        message: '통합 검색 미지원 서비스입니다: megabox',
      },
    ]);
    expect(result.meta.partialFailure).toBe(true);
    expect(result.meta.services.megabox).toEqual({});
  });

  it('Error 인스턴스를 UPSTREAM_ERROR로 변환하고 빈 그룹을 남긴다', async () => {
    const adapter = createAdapter({
      service: 'oliveyoung',
      supportedTypes: ['product'],
      search: vi.fn().mockRejectedValue(new Error('boom')),
    });
    const aggregator = new UnifiedSearchAggregator([adapter]);

    const result = await aggregator.search({
      query: '선크림',
      services: ['oliveyoung'],
      types: ['product'],
    });

    expect(result.data.errors).toEqual([
      {
        service: 'oliveyoung',
        code: 'UPSTREAM_ERROR',
        message: 'boom',
      },
    ]);
    expect(result.data.results.oliveyoung).toEqual({
      products: [],
      stores: [],
      movies: [],
      theaters: [],
    });
    expect(result.meta.services.oliveyoung).toEqual({});
  });

  it('어댑터 메타가 없으면 기본 버킷 메타데이터를 채운다', async () => {
    const adapter = createAdapter({
      service: 'daiso',
      supportedTypes: ['product'],
      search: vi.fn().mockResolvedValue({
        products: [{ id: 'p1', type: 'product', title: '정리함', service: 'daiso' }],
      }),
    });
    const aggregator = new UnifiedSearchAggregator([adapter]);

    const result = await aggregator.search({
      query: '정리함',
      services: ['daiso'],
      types: ['product'],
    });

    expect(result.meta.services.daiso).toEqual({
      products: {
        returnedCount: 1,
        truncated: false,
        sortApplied: 'service-default',
      },
    });
  });

  it('code/message 객체 오류는 알려진 코드를 유지한다', async () => {
    const adapter = createAdapter({
      service: 'oliveyoung',
      supportedTypes: ['product'],
      search: vi.fn().mockRejectedValue({ code: 'TIMEOUT', message: 'timeout' }),
    });
    const aggregator = new UnifiedSearchAggregator([adapter]);

    const result = await aggregator.search({
      query: '선크림',
      services: ['oliveyoung'],
      types: ['product'],
    });

    expect(result.data.errors[0]).toEqual({
      service: 'oliveyoung',
      code: 'TIMEOUT',
      message: 'timeout',
    });
  });

  it('알 수 없는 code/message 객체 오류는 UPSTREAM_ERROR로 정규화한다', async () => {
    const adapter = createAdapter({
      service: 'oliveyoung',
      supportedTypes: ['product'],
      search: vi.fn().mockRejectedValue({ code: 'WEIRD', message: 'odd' }),
    });
    const aggregator = new UnifiedSearchAggregator([adapter]);

    const result = await aggregator.search({
      query: '선크림',
      services: ['oliveyoung'],
      types: ['product'],
    });

    expect(result.data.errors[0]).toEqual({
      service: 'oliveyoung',
      code: 'UPSTREAM_ERROR',
      message: 'odd',
    });
  });

  it('알 수 없는 예외 값은 기본 오류 메시지로 정규화한다', async () => {
    const adapter = createAdapter({
      service: 'oliveyoung',
      supportedTypes: ['product'],
      search: vi.fn().mockRejectedValue('string-error'),
    });
    const aggregator = new UnifiedSearchAggregator([adapter]);

    const result = await aggregator.search({
      query: '선크림',
      services: ['oliveyoung'],
      types: ['product'],
    });

    expect(result.data.errors[0]).toEqual({
      service: 'oliveyoung',
      code: 'UPSTREAM_ERROR',
      message: '통합 검색 어댑터 실행 중 알 수 없는 오류가 발생했습니다.',
    });
  });

  it('중복 서비스 어댑터 등록을 막는다', () => {
    const aggregator = new UnifiedSearchAggregator();
    const adapter = createAdapter({
      service: 'daiso',
      supportedTypes: ['product'],
      search: vi.fn<UnifiedSearchAdapter['search']>().mockResolvedValue(
        {} satisfies Partial<UnifiedSearchResultBuckets>,
      ),
    });

    aggregator.register(adapter);

    expect(() => aggregator.register(adapter)).toThrow(
      "통합 검색 어댑터 'daiso'가 이미 등록되어 있습니다.",
    );
    expect(aggregator.getRegisteredServices()).toEqual(['daiso']);
  });

  it('등록된 어댑터가 없어도 빈 성공 응답을 반환한다', async () => {
    const aggregator = new UnifiedSearchAggregator();

    const result = await aggregator.search({ query: '강남' });

    expect(result).toEqual({
      success: true,
      data: {
        query: '강남',
        results: {},
        errors: [],
      },
      meta: {
        partialFailure: false,
        requestedServices: [],
        requestedTypes: ['product', 'store', 'movie', 'theater'],
        limitPerService: 5,
        timeoutMs: undefined,
        services: {},
      },
    });
  });
});
