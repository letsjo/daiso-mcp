/**
 * 통합 검색 소매 adapter 구현
 */

import { buildDaisoOfficialProductUrls } from '../services/daiso/api.js';
import { fetchStores } from '../services/daiso/tools/findStores.js';
import { fetchProducts } from '../services/daiso/tools/searchProducts.js';
import { fetchOliveyoungProducts, fetchOliveyoungStores } from '../services/oliveyoung/client.js';
import {
  createBucketMeta,
  getSearchLocation,
} from './adapterHelpers.js';
import {
  encodeUnifiedSearchCursor,
  type UnifiedSearchContinuationCursorPayload,
  UNIFIED_SEARCH_CURSOR_VERSION,
} from './cursor.js';
import type {
  UnifiedSearchAdapter,
  UnifiedSearchAdapterResult,
  UnifiedSearchAdapterQuery,
} from './interfaces.js';

function getOliveyoungOfficialProductUrl(goodsNumber: string): string {
  return `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${encodeURIComponent(
    goodsNumber,
  )}`;
}

function getDaisoProductsContinuation(
  query: UnifiedSearchAdapterQuery,
): Extract<
  UnifiedSearchContinuationCursorPayload,
  { service: 'daiso'; bucket: 'products' }
> | undefined {
  const continuation = query.continuation;

  if (continuation?.service === 'daiso' && continuation.bucket === 'products') {
    return continuation;
  }

  return undefined;
}

function getOliveyoungProductsContinuation(
  query: UnifiedSearchAdapterQuery,
): Extract<
  UnifiedSearchContinuationCursorPayload,
  { service: 'oliveyoung'; bucket: 'products' }
> | undefined {
  const continuation = query.continuation;

  if (continuation?.service === 'oliveyoung' && continuation.bucket === 'products') {
    return continuation;
  }

  return undefined;
}

function getOliveyoungStoresContinuation(
  query: UnifiedSearchAdapterQuery,
): Extract<
  UnifiedSearchContinuationCursorPayload,
  { service: 'oliveyoung'; bucket: 'stores' }
> | undefined {
  const continuation = query.continuation;

  if (continuation?.service === 'oliveyoung' && continuation.bucket === 'stores') {
    return continuation;
  }

  return undefined;
}

export function createDaisoUnifiedSearchAdapter(): UnifiedSearchAdapter {
  return {
    service: 'daiso',
    supportedTypes: ['product', 'store'],
    async search(query) {
      const result: UnifiedSearchAdapterResult = {};

      if (query.types.includes('product')) {
        const continuation = getDaisoProductsContinuation(query);
        const page = continuation?.page ?? 1;
        const { products, totalCount } = await fetchProducts(
          query.query,
          page,
          query.limitPerService,
        );
        const hasNextPage = totalCount > page * query.limitPerService;
        const nextCursor = hasNextPage
          ? encodeUnifiedSearchCursor({
              v: UNIFIED_SEARCH_CURSOR_VERSION,
              service: 'daiso',
              bucket: 'products',
              query: query.query,
              limitPerService: query.limitPerService,
              page: page + 1,
            })
          : undefined;

        result.products = products.map((product) => ({
          id: product.id,
          title: product.name,
          service: 'daiso',
          type: 'product',
          price: product.price,
          originalPrice: product.originalPrice,
          category: product.category,
          imageUrl: product.imageUrl,
          stockStatus: product.soldOut ? 'out_of_stock' : 'unknown',
          links: buildDaisoOfficialProductUrls(product.id),
        }));
        result.meta = {
          ...result.meta,
          products: createBucketMeta(
            result.products.length,
            hasNextPage,
            'service-default',
            nextCursor,
          ),
        };
      }

      if (query.types.includes('store')) {
        const stores = await fetchStores(query.query);
        const limitedStores = stores.slice(0, query.limitPerService);

        result.stores = limitedStores.map((store) => ({
          id: `${store.name}:${store.address}`,
          title: store.name,
          service: 'daiso',
          type: 'store',
          address: store.address,
          phone: store.phone,
          latitude: store.lat,
          longitude: store.lng,
          pickupAvailable: store.options.pickup,
        }));
        result.meta = {
          ...result.meta,
          stores: createBucketMeta(result.stores.length, stores.length > limitedStores.length),
        };
      }

      return result;
    },
  };
}

export function createOliveyoungUnifiedSearchAdapter(zyteApiKey?: string): UnifiedSearchAdapter {
  return {
    service: 'oliveyoung',
    supportedTypes: ['product', 'store'],
    async search(query) {
      const result: UnifiedSearchAdapterResult = {};
      const location = getSearchLocation(query);

      if (query.types.includes('product')) {
        const continuation = getOliveyoungProductsContinuation(query);
        const page = continuation?.page ?? 1;
        const { products, nextPage } = await fetchOliveyoungProducts(
          {
            keyword: query.query,
            page,
            size: query.limitPerService,
            sort: '01',
            includeSoldOut: false,
          },
          {
            apiKey: zyteApiKey,
            timeout: query.timeoutMs,
          },
        );
        const nextCursor = nextPage
          ? encodeUnifiedSearchCursor({
              v: UNIFIED_SEARCH_CURSOR_VERSION,
              service: 'oliveyoung',
              bucket: 'products',
              query: query.query,
              limitPerService: query.limitPerService,
              page: page + 1,
            })
          : undefined;

        result.products = products.map((product) => ({
          id: product.goodsNumber,
          title: product.goodsName,
          service: 'oliveyoung',
          type: 'product',
          price: product.priceToPay,
          originalPrice: product.originalPrice,
          stockStatus: product.o2oStockFlag ? 'in_stock' : 'out_of_stock',
          links: {
            officialProductUrl: getOliveyoungOfficialProductUrl(product.goodsNumber),
          },
        }));
        result.meta = {
          ...result.meta,
          products: createBucketMeta(
            result.products.length,
            nextPage,
            'service-default',
            nextCursor,
          ),
        };
      }

      if (query.types.includes('store')) {
        const continuation = getOliveyoungStoresContinuation(query);
        const pageIdx = continuation?.pageIdx ?? 1;
        const offset = continuation?.offset ?? 0;
        const { stores, totalCount } = await fetchOliveyoungStores(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            pageIdx,
            searchWords: query.query,
          },
          {
            apiKey: zyteApiKey,
            timeout: query.timeoutMs,
          },
        );
        const pageSize = continuation?.pageSize ?? stores.length;
        const limitedStores = stores.slice(offset, offset + query.limitPerService);
        const nextOffset = offset + limitedStores.length;
        const hasMoreInCurrentPage = nextOffset < stores.length;
        const hasLaterPage = pageSize > 0 && totalCount > pageIdx * pageSize;
        const nextCursor =
          hasMoreInCurrentPage || hasLaterPage
            ? encodeUnifiedSearchCursor({
                v: UNIFIED_SEARCH_CURSOR_VERSION,
                service: 'oliveyoung',
                bucket: 'stores',
                query: query.query,
                limitPerService: query.limitPerService,
                pageIdx: hasMoreInCurrentPage ? pageIdx : pageIdx + 1,
                offset: hasMoreInCurrentPage ? nextOffset : 0,
                pageSize,
                latitude: location.latitude,
                longitude: location.longitude,
              })
            : undefined;

        result.stores = limitedStores.map((store) => ({
          id: store.storeCode,
          title: store.storeName,
          service: 'oliveyoung',
          type: 'store',
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          pickupAvailable: store.pickupYn,
        }));
        result.meta = {
          ...result.meta,
          stores: createBucketMeta(
            result.stores.length,
            Boolean(nextCursor),
            'service-default',
            nextCursor,
          ),
        };
      }

      return result;
    },
  };
}
