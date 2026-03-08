/**
 * 통합 검색 서비스별 adapter 구현
 */

import { fetchStores } from '../services/daiso/tools/findStores.js';
import { fetchProducts } from '../services/daiso/tools/searchProducts.js';
import { fetchOliveyoungProducts, fetchOliveyoungStores } from '../services/oliveyoung/client.js';
import { fetchMegaboxBookingList, fetchMegaboxTheaterInfo, toYyyymmdd as toMegaboxDate } from '../services/megabox/client.js';
import { fetchCgvMovies, fetchCgvTheaters, toYyyymmdd as toCgvDate } from '../services/cgv/client.js';
import type {
  UnifiedSearchAdapter,
  UnifiedSearchAdapterQuery,
  UnifiedSearchMovieResult,
  UnifiedSearchResultBuckets,
  UnifiedSearchTheaterResult,
} from './interfaces.js';

const DEFAULT_LATITUDE = 37.5665;
const DEFAULT_LONGITUDE = 126.978;
const DEFAULT_MEGABOX_AREA_CODE = '11';
const MAX_CGV_MOVIE_SEARCH_THEATERS = 5;

function matchesQuery(value: string | undefined, query: string): boolean {
  if (!value) {
    return false;
  }

  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function getSearchLocation(query: UnifiedSearchAdapterQuery) {
  return {
    latitude: query.latitude ?? DEFAULT_LATITUDE,
    longitude: query.longitude ?? DEFAULT_LONGITUDE,
  };
}

function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const deltaLatitude = toRadians(lat2 - lat1);
  const deltaLongitude = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((6371 * c).toFixed(2));
}

function sortTheatersByDistance(
  theaters: UnifiedSearchTheaterResult[],
): UnifiedSearchTheaterResult[] {
  return theaters.sort((left, right) => {
    const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY;
    const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY;

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return left.title.localeCompare(right.title, 'ko');
  });
}

function dedupeMovies(movies: UnifiedSearchMovieResult[]): UnifiedSearchMovieResult[] {
  const uniqueMovies = new Map<string, UnifiedSearchMovieResult>();

  for (const movie of movies) {
    if (!uniqueMovies.has(movie.id)) {
      uniqueMovies.set(movie.id, movie);
    }
  }

  return Array.from(uniqueMovies.values());
}

export function createDaisoUnifiedSearchAdapter(): UnifiedSearchAdapter {
  return {
    service: 'daiso',
    supportedTypes: ['product', 'store'],
    async search(query) {
      const result: Partial<UnifiedSearchResultBuckets> = {};

      if (query.types.includes('product')) {
        const { products } = await fetchProducts(query.query, 1, query.limitPerService);

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
        }));
      }

      if (query.types.includes('store')) {
        const stores = await fetchStores(query.query);

        result.stores = stores.slice(0, query.limitPerService).map((store) => ({
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
      const result: Partial<UnifiedSearchResultBuckets> = {};
      const location = getSearchLocation(query);

      if (query.types.includes('product')) {
        const { products } = await fetchOliveyoungProducts(
          {
            keyword: query.query,
            page: 1,
            size: query.limitPerService,
            sort: '01',
            includeSoldOut: false,
          },
          {
            apiKey: zyteApiKey,
            timeout: query.timeoutMs,
          },
        );

        result.products = products.map((product) => ({
          id: product.goodsNumber,
          title: product.goodsName,
          service: 'oliveyoung',
          type: 'product',
          price: product.priceToPay,
          originalPrice: product.originalPrice,
          stockStatus: product.o2oStockFlag ? 'in_stock' : 'out_of_stock',
        }));
      }

      if (query.types.includes('store')) {
        const { stores } = await fetchOliveyoungStores(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            pageIdx: 1,
            searchWords: query.query,
          },
          {
            apiKey: zyteApiKey,
            timeout: query.timeoutMs,
          },
        );

        result.stores = stores.slice(0, query.limitPerService).map((store) => ({
          id: store.storeCode,
          title: store.storeName,
          service: 'oliveyoung',
          type: 'store',
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          pickupAvailable: store.pickupYn,
        }));
      }

      return result;
    },
  };
}

export function createMegaboxUnifiedSearchAdapter(): UnifiedSearchAdapter {
  return {
    service: 'megabox',
    supportedTypes: ['movie', 'theater'],
    async search(query) {
      const result: Partial<UnifiedSearchResultBuckets> = {};
      const playDate = toMegaboxDate();
      const location = getSearchLocation(query);
      const { theaters, movies } = await fetchMegaboxBookingList({
        playDate,
        areaCode: DEFAULT_MEGABOX_AREA_CODE,
        timeout: query.timeoutMs,
      });

      if (query.types.includes('movie')) {
        result.movies = movies
          .filter((movie) => matchesQuery(movie.movieName, query.query))
          .slice(0, query.limitPerService)
          .map((movie) => ({
            id: movie.movieId,
            title: movie.movieName,
            service: 'megabox',
            type: 'movie',
            rating: movie.movieStatus,
          }));
      }

      if (query.types.includes('theater')) {
        const infoResults = await Promise.allSettled(
          theaters.map((theater) => fetchMegaboxTheaterInfo(theater.theaterId, query.timeoutMs)),
        );

        const matchedTheaters = theaters
          .map<UnifiedSearchTheaterResult | null>((theater, index) => {
            const info = infoResults[index];
            const address = info.status === 'fulfilled' ? info.value.address : '';
            const latitude = info.status === 'fulfilled' ? info.value.latitude : null;
            const longitude = info.status === 'fulfilled' ? info.value.longitude : null;

            if (!matchesQuery(theater.theaterName, query.query) && !matchesQuery(address, query.query)) {
              return null;
            }

            return {
              id: theater.theaterId,
              title: theater.theaterName,
              service: 'megabox',
              type: 'theater' as const,
              address,
              latitude,
              longitude,
              distanceKm:
                latitude !== null && longitude !== null
                  ? calculateDistanceKm(location.latitude, location.longitude, latitude, longitude)
                  : undefined,
            };
          })
          .filter((theater): theater is UnifiedSearchTheaterResult => theater !== null);

        result.theaters = sortTheatersByDistance(matchedTheaters).slice(0, query.limitPerService);
      }

      return result;
    },
  };
}

export function createCgvUnifiedSearchAdapter(zyteApiKey?: string): UnifiedSearchAdapter {
  return {
    service: 'cgv',
    supportedTypes: ['movie', 'theater'],
    async search(query) {
      const result: Partial<UnifiedSearchResultBuckets> = {};
      const playDate = toCgvDate();
      const theaters = await fetchCgvTheaters({
        playDate,
        timeout: query.timeoutMs,
        zyteApiKey,
      });

      if (query.types.includes('theater')) {
        result.theaters = theaters
          .filter((theater) => matchesQuery(theater.theaterName, query.query))
          .slice(0, query.limitPerService)
          .map((theater) => ({
            id: theater.theaterCode,
            title: theater.theaterName,
            service: 'cgv',
            type: 'theater',
            regionCode: theater.regionCode,
          }));
      }

      if (query.types.includes('movie')) {
        const preferredTheaters = theaters.filter((theater) => matchesQuery(theater.theaterName, query.query));
        const candidateTheaters =
          preferredTheaters.length > 0 ? preferredTheaters : theaters.slice(0, MAX_CGV_MOVIE_SEARCH_THEATERS);

        const movieLists = await Promise.all(
          candidateTheaters.map((theater) =>
            fetchCgvMovies({
              playDate,
              theaterCode: theater.theaterCode,
              timeout: query.timeoutMs,
              zyteApiKey,
            }),
          ),
        );

        const matchedMovies = dedupeMovies(
          movieLists.flatMap((movies, index) =>
            movies
              .filter((movie) => matchesQuery(movie.movieName, query.query))
              .map((movie) => ({
                id: movie.movieCode,
                title: movie.movieName,
                service: 'cgv',
                type: 'movie' as const,
                rating: movie.rating,
                theaterName: candidateTheaters[index]?.theaterName,
              })),
          ),
        );

        result.movies = matchedMovies.slice(0, query.limitPerService);
      }

      return result;
    },
  };
}
