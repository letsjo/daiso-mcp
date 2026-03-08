/**
 * 통합 검색 adapter aggregator 초안
 *
 * 서비스별 opt-in adapter를 등록하고 그룹 응답 형태로 fan-out 결과를 모읍니다.
 */

import type {
  UnifiedSearchAdapter,
  UnifiedSearchError,
  UnifiedSearchQuery,
  UnifiedSearchResponse,
  UnifiedSearchResultBuckets,
  UnifiedSearchServiceId,
} from './interfaces.js';
import { ALL_ENTITY_TYPES, DEFAULT_LIMIT_PER_SERVICE } from './constants.js';

const SUPPORTED_ERROR_CODES = new Set<UnifiedSearchError['code']>([
  'UNSUPPORTED_SERVICE',
  'UPSTREAM_ERROR',
  'TIMEOUT',
  'BAD_RESPONSE',
]);

function createEmptyBuckets(): UnifiedSearchResultBuckets {
  return {
    products: [],
    stores: [],
    movies: [],
    theaters: [],
  };
}

function normalizeBuckets(
  buckets: Partial<UnifiedSearchResultBuckets> | undefined,
): UnifiedSearchResultBuckets {
  return {
    products: buckets?.products ?? [],
    stores: buckets?.stores ?? [],
    movies: buckets?.movies ?? [],
    theaters: buckets?.theaters ?? [],
  };
}

function normalizeErrorCode(code: string): UnifiedSearchError['code'] {
  if (SUPPORTED_ERROR_CODES.has(code as UnifiedSearchError['code'])) {
    return code as UnifiedSearchError['code'];
  }

  return 'UPSTREAM_ERROR';
}

function toUnifiedSearchError(
  service: UnifiedSearchServiceId,
  error: unknown,
): UnifiedSearchError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return {
      service,
      code: normalizeErrorCode(error.code),
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      service,
      code: 'UPSTREAM_ERROR',
      message: error.message,
    };
  }

  return {
    service,
    code: 'UPSTREAM_ERROR',
    message: '통합 검색 어댑터 실행 중 알 수 없는 오류가 발생했습니다.',
  };
}

export class UnifiedSearchAggregator {
  private adapters = new Map<UnifiedSearchServiceId, UnifiedSearchAdapter>();

  constructor(adapters: UnifiedSearchAdapter[] = []) {
    for (const adapter of adapters) {
      this.register(adapter);
    }
  }

  register(adapter: UnifiedSearchAdapter): void {
    if (this.adapters.has(adapter.service)) {
      throw new Error(`통합 검색 어댑터 '${adapter.service}'가 이미 등록되어 있습니다.`);
    }

    this.adapters.set(adapter.service, adapter);
  }

  getRegisteredServices(): UnifiedSearchServiceId[] {
    return Array.from(this.adapters.keys());
  }

  async search(query: UnifiedSearchQuery): Promise<UnifiedSearchResponse> {
    const requestedServices = query.services ?? this.getRegisteredServices();
    const requestedTypes = query.types ?? ALL_ENTITY_TYPES;
    const limitPerService = query.limitPerService ?? DEFAULT_LIMIT_PER_SERVICE;
    const results: Partial<Record<UnifiedSearchServiceId, UnifiedSearchResultBuckets>> = {};
    const errors: UnifiedSearchError[] = [];

    await Promise.all(
      requestedServices.map(async (service) => {
        const adapter = this.adapters.get(service);

        if (!adapter) {
          errors.push({
            service,
            code: 'UNSUPPORTED_SERVICE',
            message: `통합 검색 미지원 서비스입니다: ${service}`,
          });
          return;
        }

        const allowedTypes = requestedTypes.filter((type) => adapter.supportedTypes.includes(type));

        if (allowedTypes.length === 0) {
          results[service] = createEmptyBuckets();
          return;
        }

        try {
          const adapterResult = await adapter.search({
            ...query,
            service,
            types: allowedTypes,
            limitPerService,
          });

          results[service] = normalizeBuckets(adapterResult);
        } catch (error) {
          errors.push(toUnifiedSearchError(service, error));
          results[service] = createEmptyBuckets();
        }
      }),
    );

    return {
      success: errors.length === 0,
      data: {
        query: query.query,
        results,
        errors,
      },
      meta: {
        partialFailure: errors.length > 0,
        requestedServices,
        requestedTypes,
        limitPerService,
        timeoutMs: query.timeoutMs,
      },
    };
  }
}
