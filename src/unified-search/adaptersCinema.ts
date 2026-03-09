/**
 * 통합 검색 영화 adapter 구현
 */

import { fetchCgvMovies, fetchCgvTheaters, toYyyymmdd as toCgvDate } from '../services/cgv/client.js';
import { fetchMegaboxBookingList, fetchMegaboxTheaterInfo, toYyyymmdd as toMegaboxDate } from '../services/megabox/client.js';
import { getMegaboxTheaterDetailRequestLimit } from '../services/megabox/theaterLocator.js';
import {
  calculateDistanceKm,
  createBucketMeta,
  dedupeMovies,
  getSearchLocation,
  matchesQuery,
  sortTheatersByDistance,
} from './adapterHelpers.js';
import type {
  UnifiedSearchAdapter,
  UnifiedSearchAdapterResult,
  UnifiedSearchTheaterResult,
} from './interfaces.js';

const DEFAULT_MEGABOX_AREA_CODE = '11';
const MAX_CGV_MOVIE_SEARCH_THEATERS = 5;

export function createMegaboxUnifiedSearchAdapter(): UnifiedSearchAdapter {
  return {
    service: 'megabox',
    supportedTypes: ['movie', 'theater'],
    async search(query) {
      const result: UnifiedSearchAdapterResult = {};
      const playDate = toMegaboxDate();
      const location = getSearchLocation(query);
      const { theaters, movies } = await fetchMegaboxBookingList({
        playDate,
        areaCode: DEFAULT_MEGABOX_AREA_CODE,
        timeout: query.timeoutMs,
      });

      if (query.types.includes('movie')) {
        const matchedMovies = movies.filter((movie) => matchesQuery(movie.movieName, query.query));

        result.movies = matchedMovies
          .slice(0, query.limitPerService)
          .map((movie) => ({
            id: movie.movieId,
            title: movie.movieName,
            service: 'megabox',
            type: 'movie',
            rating: movie.movieStatus,
          }));
        result.meta = {
          ...result.meta,
          movies: createBucketMeta(result.movies.length, matchedMovies.length > result.movies.length),
        };
      }

      if (query.types.includes('theater')) {
        const preferredTheaters = theaters.filter((theater) =>
          matchesQuery(theater.theaterName, query.query),
        );
        const detailCandidates = (preferredTheaters.length > 0 ? preferredTheaters : theaters).slice(
          0,
          getMegaboxTheaterDetailRequestLimit(query.limitPerService),
        );
        const infoResults = await Promise.allSettled(
          detailCandidates.map((theater) => fetchMegaboxTheaterInfo(theater.theaterId, query.timeoutMs)),
        );

        const matchedTheaters = detailCandidates
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

        const sortedTheaters = sortTheatersByDistance(matchedTheaters);
        result.theaters = sortedTheaters.slice(0, query.limitPerService);
        result.meta = {
          ...result.meta,
          theaters: createBucketMeta(
            result.theaters.length,
            sortedTheaters.length > result.theaters.length,
            'distance-asc',
          ),
        };
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
      const result: UnifiedSearchAdapterResult = {};
      const playDate = toCgvDate();
      const theaters = await fetchCgvTheaters({
        playDate,
        timeout: query.timeoutMs,
        zyteApiKey,
      });

      if (query.types.includes('theater')) {
        const matchedTheaters = theaters.filter((theater) =>
          matchesQuery(theater.theaterName, query.query),
        );

        result.theaters = matchedTheaters
          .slice(0, query.limitPerService)
          .map((theater) => ({
            id: theater.theaterCode,
            title: theater.theaterName,
            service: 'cgv',
            type: 'theater',
            regionCode: theater.regionCode,
          }));
        result.meta = {
          ...result.meta,
          theaters: createBucketMeta(
            result.theaters.length,
            matchedTheaters.length > result.theaters.length,
          ),
        };
      }

      if (query.types.includes('movie')) {
        const preferredTheaters = theaters.filter((theater) =>
          matchesQuery(theater.theaterName, query.query),
        );
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
        result.meta = {
          ...result.meta,
          movies: createBucketMeta(result.movies.length, matchedMovies.length > result.movies.length),
        };
      }

      return result;
    },
  };
}
