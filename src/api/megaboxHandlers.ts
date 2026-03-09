/**
 * 메가박스 GET API 핸들러
 */

import {
  fetchMegaboxBookingList,
  toYyyymmdd,
} from '../services/megabox/client.js';
import {
  DEFAULT_MEGABOX_LATITUDE,
  DEFAULT_MEGABOX_LONGITUDE,
  findNearbyMegaboxTheaters,
} from '../services/megabox/theaterLocator.js';
import { matchesTimeWindow, normalizeTimeWindow } from '../utils/timeWindow.js';
import { type ApiContext, errorResponse, successResponse } from './response.js';

/**
 * 메가박스 주변 지점 조회 API 핸들러
 * GET /api/megabox/theaters?lat={위도}&lng={경도}&playDate={YYYYMMDD}&areaCode={지역코드}
 */
export async function handleMegaboxFindNearbyTheaters(c: ApiContext) {
  const lat = parseFloat(c.req.query('lat') || `${DEFAULT_MEGABOX_LATITUDE}`);
  const lng = parseFloat(c.req.query('lng') || `${DEFAULT_MEGABOX_LONGITUDE}`);
  const playDate = c.req.query('playDate') || toYyyymmdd();
  const areaCode = c.req.query('areaCode') || '11';
  const limit = parseInt(c.req.query('limit') || '10');
  const timeoutMs = parseInt(c.req.query('timeoutMs') || '15000');

  try {
    const theaters = await findNearbyMegaboxTheaters({
      latitude: lat,
      longitude: lng,
      playDate,
      areaCode,
      limit,
      timeoutMs,
    });

    return successResponse(
      c,
      {
        location: { latitude: lat, longitude: lng },
        playDate,
        areaCode,
        theaters,
      },
      { total: theaters.length, pageSize: limit }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return errorResponse(c, 'MEGABOX_THEATER_SEARCH_FAILED', message, 500);
  }
}

/**
 * 메가박스 영화/회차 목록 조회 API 핸들러
 * GET /api/megabox/movies?playDate={YYYYMMDD}&theaterId={지점ID}&movieId={영화ID}
 */
export async function handleMegaboxListNowShowing(c: ApiContext) {
  const playDate = c.req.query('playDate') || toYyyymmdd();
  const theaterId = c.req.query('theaterId') || undefined;
  const movieId = c.req.query('movieId') || undefined;
  const areaCode = c.req.query('areaCode') || '11';
  const timeoutMs = parseInt(c.req.query('timeoutMs') || '15000');

  try {
    const result = await fetchMegaboxBookingList({
      playDate,
      theaterId,
      movieId,
      areaCode,
      timeout: timeoutMs,
    });

    return successResponse(
      c,
      {
        playDate,
        filters: {
          theaterId: theaterId || null,
          movieId: movieId || null,
          areaCode,
        },
        theaters: result.theaters,
        movies: result.movies,
        showtimes: result.showtimes,
      },
      { total: result.showtimes.length },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return errorResponse(c, 'MEGABOX_MOVIE_LIST_FAILED', message, 500);
  }
}

/**
 * 메가박스 잔여 좌석 조회 API 핸들러
 * GET /api/megabox/seats?playDate={YYYYMMDD}&theaterId={지점ID}&movieId={영화ID}
 */
export async function handleMegaboxGetRemainingSeats(c: ApiContext) {
  const playDate = c.req.query('playDate') || toYyyymmdd();
  const theaterId = c.req.query('theaterId') || undefined;
  const movieId = c.req.query('movieId') || undefined;
  const areaCode = c.req.query('areaCode') || '11';
  const fromTime = c.req.query('fromTime') || undefined;
  const toTime = c.req.query('toTime') || undefined;
  const limit = parseInt(c.req.query('limit') || '50');
  const timeoutMs = parseInt(c.req.query('timeoutMs') || '15000');
  let timeWindow;

  try {
    timeWindow = normalizeTimeWindow({ fromTime, toTime });
  } catch (error) {
    return errorResponse(c, 'INVALID_TIME_WINDOW', (error as Error).message, 400);
  }

  try {
    const { showtimes } = await fetchMegaboxBookingList({
      playDate,
      theaterId,
      movieId,
      areaCode,
      timeout: timeoutMs,
    });

    const seats = showtimes
      .filter((item) => (theaterId ? item.theaterId === theaterId : true))
      .filter((item) => (movieId ? item.movieId === movieId : true))
      .filter((item) => matchesTimeWindow(item.startTime, timeWindow))
      .sort((a, b) => {
        if (a.startTime === b.startTime) {
          return a.theaterName.localeCompare(b.theaterName);
        }
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, limit);

    return successResponse(
      c,
      {
        playDate,
        filters: {
          theaterId: theaterId || null,
          movieId: movieId || null,
          areaCode,
          fromTime: timeWindow.fromTime || null,
          toTime: timeWindow.toTime || null,
        },
        seats,
      },
      { total: seats.length, pageSize: limit },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return errorResponse(c, 'MEGABOX_SEAT_LIST_FAILED', message, 500);
  }
}
