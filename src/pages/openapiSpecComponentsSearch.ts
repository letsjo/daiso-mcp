/**
 * OpenAPI 컴포넌트 스키마 정의 - 통합 검색
 */

export const OPENAPI_SEARCH_COMPONENT_SCHEMAS = {
  UnifiedSearchProductLinks: {
    type: 'object',
    properties: {
      officialProductUrl: {
        type: 'string',
        example: 'https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=1001&recmYn=N',
      },
      officialPurchaseUrl: {
        type: 'string',
        example: 'https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=1001&recmYn=N',
      },
    },
  },
  UnifiedSearchProduct: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '1001' },
      title: { type: 'string', example: '정리함' },
      service: { type: 'string', example: 'daiso' },
      type: { type: 'string', example: 'product' },
      price: { type: 'integer', example: 1000 },
      originalPrice: { type: 'integer', example: 1500 },
      category: { type: 'string', example: '수납' },
      imageUrl: { type: 'string', example: 'https://example.com/image.jpg' },
      stockStatus: { type: 'string', example: 'in_stock' },
      links: { $ref: '#/components/schemas/UnifiedSearchProductLinks' },
    },
  },
  UnifiedSearchStore: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'store-1' },
      title: { type: 'string', example: '다이소 강남역점' },
      service: { type: 'string', example: 'daiso' },
      type: { type: 'string', example: 'store' },
      address: { type: 'string', example: '서울특별시 강남구 강남대로 123' },
      phone: { type: 'string', example: '02-1234-5678' },
      latitude: { type: 'number', format: 'float', example: 37.4979 },
      longitude: { type: 'number', format: 'float', example: 127.0276 },
      distanceKm: { type: 'number', format: 'float', example: 0.5 },
      pickupAvailable: { type: 'boolean', example: true },
    },
  },
  UnifiedSearchMovie: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'movie-1' },
      title: { type: 'string', example: '영화A' },
      service: { type: 'string', example: 'cgv' },
      type: { type: 'string', example: 'movie' },
      rating: { type: 'string', example: '12세' },
      theaterName: { type: 'string', example: 'CGV 강남' },
      playDate: { type: 'string', example: '20260308' },
      startTime: { type: 'string', example: '14:00' },
    },
  },
  UnifiedSearchTheater: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '0056' },
      title: { type: 'string', example: 'CGV 강남' },
      service: { type: 'string', example: 'cgv' },
      type: { type: 'string', example: 'theater' },
      address: { type: 'string', example: '서울특별시 강남구 강남대로 438' },
      latitude: { type: 'number', format: 'float', example: 37.4982 },
      longitude: { type: 'number', format: 'float', example: 127.0264 },
      regionCode: { type: 'string', example: '01' },
      distanceKm: { type: 'number', format: 'float', example: 0.2 },
    },
  },
  UnifiedSearchResultBuckets: {
    type: 'object',
    properties: {
      products: {
        type: 'array',
        items: { $ref: '#/components/schemas/UnifiedSearchProduct' },
      },
      stores: {
        type: 'array',
        items: { $ref: '#/components/schemas/UnifiedSearchStore' },
      },
      movies: {
        type: 'array',
        items: { $ref: '#/components/schemas/UnifiedSearchMovie' },
      },
      theaters: {
        type: 'array',
        items: { $ref: '#/components/schemas/UnifiedSearchTheater' },
      },
    },
  },
  UnifiedSearchError: {
    type: 'object',
    properties: {
      service: { type: 'string', example: 'oliveyoung' },
      code: { type: 'string', example: 'TIMEOUT' },
      message: { type: 'string', example: '올리브영 API 요청 시간 초과' },
    },
  },
  UnifiedSearchBucketMeta: {
    type: 'object',
    properties: {
      returnedCount: { type: 'integer', example: 5 },
      truncated: { type: 'boolean', example: false },
      sortApplied: { type: 'string', example: 'service-default' },
      nextCursor: { type: 'string', example: 'opaque-token' },
    },
  },
  UnifiedSearchServiceMeta: {
    type: 'object',
    properties: {
      products: { $ref: '#/components/schemas/UnifiedSearchBucketMeta' },
      stores: { $ref: '#/components/schemas/UnifiedSearchBucketMeta' },
      movies: { $ref: '#/components/schemas/UnifiedSearchBucketMeta' },
      theaters: { $ref: '#/components/schemas/UnifiedSearchBucketMeta' },
    },
  },
  UnifiedSearchResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          query: { type: 'string', example: '강남' },
          results: {
            type: 'object',
            properties: {
              daiso: { $ref: '#/components/schemas/UnifiedSearchResultBuckets' },
              oliveyoung: { $ref: '#/components/schemas/UnifiedSearchResultBuckets' },
              megabox: { $ref: '#/components/schemas/UnifiedSearchResultBuckets' },
              cgv: { $ref: '#/components/schemas/UnifiedSearchResultBuckets' },
            },
          },
          errors: {
            type: 'array',
            items: { $ref: '#/components/schemas/UnifiedSearchError' },
          },
        },
      },
      meta: {
        type: 'object',
        properties: {
          partialFailure: { type: 'boolean', example: false },
          requestedServices: {
            type: 'array',
            items: { type: 'string' },
          },
          requestedTypes: {
            type: 'array',
            items: { type: 'string' },
          },
          limitPerService: { type: 'integer', example: 5 },
          timeoutMs: { type: 'integer', example: 15000 },
          services: {
            type: 'object',
            properties: {
              daiso: { $ref: '#/components/schemas/UnifiedSearchServiceMeta' },
              oliveyoung: { $ref: '#/components/schemas/UnifiedSearchServiceMeta' },
              megabox: { $ref: '#/components/schemas/UnifiedSearchServiceMeta' },
              cgv: { $ref: '#/components/schemas/UnifiedSearchServiceMeta' },
            },
          },
        },
      },
    },
  },
} as const;
