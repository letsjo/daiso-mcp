/**
 * CGV GET API 핸들러
 */

import {
  fetchCgvMovies,
  fetchCgvTheaters,
  fetchCgvTimetable,
  normalizeCgvMovieSort,
  THEATER_NOT_FOUND_ERROR_NAME,
  toYyyymmdd,
} from '../services/cgv/client.js';
import { filterAndSortTimetable } from '../services/cgv/timetable.js';
import { normalizeTimeWindow } from '../utils/timeWindow.js';
import { normalizeMinRemainingSeats, normalizeShowtimeSort } from '../utils/showtimeQuery.js';
import { withCgvTimetableLinks } from './responseLinks.js';
import { type ApiContext, errorResponse, successResponse } from './response.js';

interface CgvMovieSearchInput {
  playDate: string;
  theaterCode?: string;
  theaterQuery?: string;
  sort?: string;
  timeoutMs: number;
}

function parseCgvMovieSearchInput(c: ApiContext): CgvMovieSearchInput {
  return {
    playDate: c.req.query('playDate') || toYyyymmdd(),
    theaterCode: c.req.query('theaterCode') || undefined,
    theaterQuery: c.req.query('theaterQuery') || undefined,
    sort: c.req.query('sort') || undefined,
    timeoutMs: parseInt(c.req.query('timeoutMs') || '15000'),
  };
}

async function runCgvMovieSearch(
  c: ApiContext,
  input: CgvMovieSearchInput,
  options: { requireTheaterQuery?: boolean } = {},
) {
  const { playDate, theaterCode, theaterQuery, sort, timeoutMs } = input;
  let normalizedSort;

  if (options.requireTheaterQuery && !theaterQuery) {
    return errorResponse(c, 'MISSING_THEATER_QUERY', 'theaterQuery 파라미터가 필요합니다.', 400);
  }

  try {
    normalizedSort = normalizeCgvMovieSort(sort);
  } catch (error) {
    return errorResponse(c, 'INVALID_CGV_MOVIE_SORT', (error as Error).message, 400);
  }

  try {
    const movies = await fetchCgvMovies({
      playDate,
      theaterCode,
      theaterQuery,
      sort: normalizedSort,
      timeout: timeoutMs,
      zyteApiKey: c.env?.ZYTE_API_KEY,
    });

    return successResponse(
      c,
      {
        playDate,
        filters: {
          theaterCode: theaterCode || null,
          theaterQuery: theaterQuery || null,
          sort: normalizedSort,
        },
        movies,
      },
      { total: movies.length, sortApplied: normalizedSort },
    );
  } catch (error) {
    if (error instanceof Error && error.name === THEATER_NOT_FOUND_ERROR_NAME) {
      return errorResponse(c, 'CGV_THEATER_NOT_FOUND', error.message, 404);
    }

    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return errorResponse(c, 'CGV_MOVIE_SEARCH_FAILED', message, 500);
  }
}

/**
 * CGV 극장 목록 조회 API 핸들러
 * GET /api/cgv/theaters?playDate={YYYYMMDD}&regionCode={지역코드}
 */
export async function handleCgvFindTheaters(c: ApiContext) {
  const playDate = c.req.query('playDate') || toYyyymmdd();
  const regionCode = c.req.query('regionCode') || undefined;
  const limit = parseInt(c.req.query('limit') || '30');
  const timeoutMs = parseInt(c.req.query('timeoutMs') || '15000');

  try {
    const theaters = await fetchCgvTheaters({
      playDate,
      regionCode,
      timeout: timeoutMs,
      zyteApiKey: c.env?.ZYTE_API_KEY,
    });

    const sliced = theaters.slice(0, limit);

    return successResponse(
      c,
      {
        playDate,
        filters: {
          regionCode: regionCode || null,
        },
        theaters: sliced,
      },
      { total: sliced.length, pageSize: limit },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return errorResponse(c, 'CGV_THEATER_SEARCH_FAILED', message, 500);
  }
}

/**
 * CGV 영화 목록 조회 API 핸들러
 * GET /api/cgv/movies?playDate={YYYYMMDD}&theaterCode={극장코드}
 */
export async function handleCgvSearchMovies(c: ApiContext) {
  return runCgvMovieSearch(c, parseCgvMovieSearchInput(c));
}

/**
 * CGV 극장명 기반 영화 목록 조회 API 핸들러
 * GET /api/cgv/movies/by-theater?playDate={YYYYMMDD}&theaterQuery={극장명}
 */
export async function handleCgvSearchMoviesByTheater(c: ApiContext) {
  const input = parseCgvMovieSearchInput(c);
  input.theaterCode = undefined;
  return runCgvMovieSearch(c, input, { requireTheaterQuery: true });
}

/**
 * CGV 시간표 조회 API 핸들러
 * GET /api/cgv/timetable?playDate={YYYYMMDD}&theaterCode={극장코드}&movieCode={영화코드}
 */
export async function handleCgvGetTimetable(c: ApiContext) {
  const playDate = c.req.query('playDate') || toYyyymmdd();
  const theaterCode = c.req.query('theaterCode') || undefined;
  const movieCode = c.req.query('movieCode') || undefined;
  const fromTime = c.req.query('fromTime') || undefined;
  const toTime = c.req.query('toTime') || undefined;
  const minRemainingSeatsQuery = c.req.query('minRemainingSeats');
  const sort = c.req.query('sort') || undefined;
  const limit = parseInt(c.req.query('limit') || '50');
  const timeoutMs = parseInt(c.req.query('timeoutMs') || '15000');
  let timeWindow;
  let minRemainingSeats;
  let normalizedSort;

  try {
    timeWindow = normalizeTimeWindow({ fromTime, toTime });
  } catch (error) {
    return errorResponse(c, 'INVALID_TIME_WINDOW', (error as Error).message, 400);
  }

  try {
    minRemainingSeats = normalizeMinRemainingSeats(
      minRemainingSeatsQuery ? Number(minRemainingSeatsQuery) : undefined,
    );
    normalizedSort = normalizeShowtimeSort(sort);
  } catch (error) {
    return errorResponse(c, 'INVALID_SHOWTIME_FILTER', (error as Error).message, 400);
  }

  try {
    const timetable = await fetchCgvTimetable({
      playDate,
      theaterCode,
      movieCode,
      timeout: timeoutMs,
      zyteApiKey: c.env?.ZYTE_API_KEY,
    });

    const filtered = filterAndSortTimetable(timetable, {
      theaterCode,
      movieCode,
      fromTime: timeWindow.fromTime,
      toTime: timeWindow.toTime,
      minRemainingSeats,
      sort: normalizedSort,
      limit,
    });

    return successResponse(
      c,
      {
        playDate,
        filters: {
          theaterCode: theaterCode || null,
          movieCode: movieCode || null,
          fromTime: timeWindow.fromTime || null,
          toTime: timeWindow.toTime || null,
          minRemainingSeats: minRemainingSeats ?? null,
          sort: normalizedSort,
        },
        timetable: filtered.map((item) => withCgvTimetableLinks(item, c.req.url)),
      },
      { total: filtered.length, pageSize: limit },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return errorResponse(c, 'CGV_TIMETABLE_FETCH_FAILED', message, 500);
  }
}
