/**
 * 통합 검색 전용 타입 정의
 *
 * 기존 ServiceProvider 계약과 분리된 opt-in adapter 계층에서 사용합니다.
 */

export type UnifiedSearchServiceId = 'daiso' | 'oliveyoung' | 'megabox' | 'cgv';

export type UnifiedSearchEntityType = 'product' | 'store' | 'movie' | 'theater';

export interface UnifiedSearchBaseItem {
  id: string;
  title: string;
  service: UnifiedSearchServiceId;
}

export interface UnifiedSearchProductResult extends UnifiedSearchBaseItem {
  type: 'product';
  price?: number;
  originalPrice?: number;
  category?: string;
  imageUrl?: string;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'unknown';
}

export interface UnifiedSearchStoreResult extends UnifiedSearchBaseItem {
  type: 'store';
  address?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number;
  pickupAvailable?: boolean;
}

export interface UnifiedSearchMovieResult extends UnifiedSearchBaseItem {
  type: 'movie';
  rating?: string;
  theaterName?: string;
  playDate?: string;
  startTime?: string;
}

export interface UnifiedSearchTheaterResult extends UnifiedSearchBaseItem {
  type: 'theater';
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  regionCode?: string;
  distanceKm?: number;
}

export interface UnifiedSearchResultBuckets {
  products: UnifiedSearchProductResult[];
  stores: UnifiedSearchStoreResult[];
  movies: UnifiedSearchMovieResult[];
  theaters: UnifiedSearchTheaterResult[];
}

export interface UnifiedSearchError {
  service: UnifiedSearchServiceId;
  code: 'UNSUPPORTED_SERVICE' | 'UPSTREAM_ERROR' | 'TIMEOUT' | 'BAD_RESPONSE';
  message: string;
}

export interface UnifiedSearchQuery {
  query: string;
  services?: UnifiedSearchServiceId[];
  types?: UnifiedSearchEntityType[];
  latitude?: number;
  longitude?: number;
  limitPerService?: number;
  timeoutMs?: number;
}

export interface UnifiedSearchAdapterQuery extends UnifiedSearchQuery {
  service: UnifiedSearchServiceId;
  types: UnifiedSearchEntityType[];
  limitPerService: number;
}

export interface UnifiedSearchAdapter {
  readonly service: UnifiedSearchServiceId;
  readonly supportedTypes: UnifiedSearchEntityType[];
  search(query: UnifiedSearchAdapterQuery): Promise<Partial<UnifiedSearchResultBuckets>>;
}

export interface UnifiedSearchResponse {
  success: boolean;
  data: {
    query: string;
    results: Partial<Record<UnifiedSearchServiceId, UnifiedSearchResultBuckets>>;
    errors: UnifiedSearchError[];
  };
  meta: {
    partialFailure: boolean;
    requestedServices: UnifiedSearchServiceId[];
    requestedTypes: UnifiedSearchEntityType[];
    limitPerService: number;
    timeoutMs?: number;
  };
}
