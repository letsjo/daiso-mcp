/**
 * CGV 영화 목록 정규화 및 정렬 유틸리티
 */

import { formatTime, toNumber } from '../../utils/format.js';
import type { CgvMovie, CgvMovieItem, CgvMovieSort, CgvTheater, CgvTimetableItem } from './types.js';

interface RankedCgvMovie extends Omit<CgvMovie, 'showtimeCount' | 'firstStartTime'> {
  showtimeCount: number;
  firstStartTime: string;
  firstSeenIndex: number;
  sortOrder: number;
}

export const DEFAULT_CGV_MOVIE_SORT: CgvMovieSort = 'popularity-desc';

function normalizeTheaterSearchText(value: string): string {
  return value.replace(/\s+/g, '').replace(/cgv/gi, '').toLowerCase();
}

function normalizeTicketRate(value: CgvMovieItem['atktRate']): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function toComparableTime(value?: string): number {
  return value ? Number(value.replace(':', '')) : Number.MAX_SAFE_INTEGER;
}

function toComparableSortOrder(value: CgvTimetableItem['sortOseq']): number {
  if (value === null || value === undefined || value === '') {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = toNumber(value);
  return parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
}

function sortRankedMovies(movies: RankedCgvMovie[], sort: CgvMovieSort): RankedCgvMovie[] {
  return movies.sort((left, right) => {
    if (sort === 'popularity-desc') {
      const showtimeCountDiff = right.showtimeCount - left.showtimeCount;
      if (showtimeCountDiff !== 0) {
        return showtimeCountDiff;
      }
    }

    const sortOrderDiff = left.sortOrder - right.sortOrder;
    if (sortOrderDiff !== 0) {
      return sortOrderDiff;
    }

    const firstStartTimeDiff = toComparableTime(left.firstStartTime) - toComparableTime(right.firstStartTime);
    if (firstStartTimeDiff !== 0) {
      return firstStartTimeDiff;
    }

    return left.firstSeenIndex - right.firstSeenIndex;
  });
}

export function pickMatchingTheater(
  theaters: CgvTheater[],
  theaterQuery: string,
): CgvTheater | undefined {
  const normalizedQuery = normalizeTheaterSearchText(theaterQuery);

  return theaters
    .map((theater, index) => {
      const normalizedName = normalizeTheaterSearchText(theater.theaterName);
      let score = 0;

      if (theater.theaterCode.toLowerCase() === normalizedQuery) {
        score = 400;
      } else if (normalizedName === normalizedQuery) {
        score = 300;
      } else if (normalizedName.startsWith(normalizedQuery)) {
        score = 200;
      } else if (normalizedName.includes(normalizedQuery)) {
        score = 100;
      }

      return { theater, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.theater;
}

export function normalizeCgvMovieSort(sort?: string): CgvMovieSort {
  if (!sort) {
    return DEFAULT_CGV_MOVIE_SORT;
  }

  if (sort === 'popularity-desc' || sort === 'cgv-default') {
    return sort;
  }

  throw new Error('지원하지 않는 CGV 영화 정렬입니다. popularity-desc, cgv-default 중에서 선택해주세요.');
}

export function mapCgvMovieItem(item: CgvMovieItem): CgvMovie {
  return {
    movieCode: item.movNo as string,
    movieName: item.movNm as string,
    rating: item.cratgClsNm || undefined,
    ticketRate: normalizeTicketRate(item.atktRate),
  };
}

export function sortMoviesFromList(movies: CgvMovie[], sort: CgvMovieSort): CgvMovie[] {
  const withIndex = movies.map((movie, index) => ({ movie, index }));

  return withIndex
    .sort((left, right) => {
      if (sort === 'popularity-desc') {
        const ticketRateDiff = (right.movie.ticketRate || -1) - (left.movie.ticketRate || -1);
        if (ticketRateDiff !== 0) {
          return ticketRateDiff;
        }
      }

      return left.index - right.index;
    })
    .map((item) => item.movie);
}

export function buildMoviesFromTimetableItems(
  items: CgvTimetableItem[],
  sort: CgvMovieSort,
): CgvMovie[] {
  const movieMap = new Map<string, RankedCgvMovie>();

  items.forEach((item, index) => {
    const movieCode = item.movNo?.trim();
    const movieName = (item.movNm || item.prodNm || '').trim();

    if (!movieCode || !movieName) {
      return;
    }

    const firstStartTime = formatTime(item.scnsrtTm);
    const sortOrder = toComparableSortOrder(item.sortOseq);
    const current = movieMap.get(movieCode);

    if (current) {
      current.showtimeCount += 1;
      if (!current.rating && item.cratgClsNm) {
        current.rating = item.cratgClsNm;
      }
      current.sortOrder = Math.min(current.sortOrder, sortOrder);

      if (toComparableTime(firstStartTime) < toComparableTime(current.firstStartTime)) {
        current.firstStartTime = firstStartTime;
      }
      return;
    }

    movieMap.set(movieCode, {
      movieCode,
      movieName,
      rating: item.cratgClsNm || undefined,
      showtimeCount: 1,
      firstStartTime,
      firstSeenIndex: index,
      sortOrder,
    });
  });

  return sortRankedMovies([...movieMap.values()], sort).map(
    ({ firstSeenIndex: _firstSeenIndex, sortOrder: _sortOrder, ...movie }) => movie,
  );
}
