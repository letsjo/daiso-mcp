/**
 * 통합 검색 adapter 공통 헬퍼
 */

import type {
  UnifiedSearchAdapterQuery,
  UnifiedSearchBucketMeta,
  UnifiedSearchMovieResult,
  UnifiedSearchTheaterResult,
} from './interfaces.js';

const DEFAULT_LATITUDE = 37.5665;
const DEFAULT_LONGITUDE = 126.978;

export function createBucketMeta(
  returnedCount: number,
  truncated: boolean,
  sortApplied: UnifiedSearchBucketMeta['sortApplied'] = 'service-default',
  nextCursor?: string,
): UnifiedSearchBucketMeta {
  const meta: UnifiedSearchBucketMeta = {
    returnedCount,
    truncated,
    sortApplied,
  };

  if (nextCursor) {
    meta.nextCursor = nextCursor;
  }

  return meta;
}

export function matchesQuery(value: string | undefined, query: string): boolean {
  if (!value) {
    return false;
  }

  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export function getSearchLocation(query: UnifiedSearchAdapterQuery) {
  return {
    latitude: query.latitude ?? DEFAULT_LATITUDE,
    longitude: query.longitude ?? DEFAULT_LONGITUDE,
  };
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export function sortTheatersByDistance(
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

export function dedupeMovies(movies: UnifiedSearchMovieResult[]): UnifiedSearchMovieResult[] {
  const uniqueMovies = new Map<string, UnifiedSearchMovieResult>();

  for (const movie of movies) {
    if (!uniqueMovies.has(movie.id)) {
      uniqueMovies.set(movie.id, movie);
    }
  }

  return Array.from(uniqueMovies.values());
}
