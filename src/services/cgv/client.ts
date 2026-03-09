/**
 * CGV API 클라이언트
 */

import { formatTime, toNumber, toYyyymmdd } from '../../utils/format.js';
import { CGV_API } from './api.js';
import {
  buildMoviesFromTimetableItems,
  DEFAULT_CGV_MOVIE_SORT,
  mapCgvMovieItem,
  normalizeCgvMovieSort,
  pickMatchingTheater,
  sortMoviesFromList,
} from './movieSearch.js';
import { requestCgv } from './transport.js';
import type {
  CgvMovie,
  CgvMovieListResponse,
  CgvMovieSort,
  CgvTheater,
  CgvTheaterListResponse,
  CgvTimetable,
  CgvTimetableItem,
  CgvTimetableResponse,
} from './types.js';

interface CommonFetchParams {
  playDate?: string;
  theaterCode?: string;
  theaterQuery?: string;
  movieCode?: string;
  regionCode?: string;
  sort?: CgvMovieSort;
  timeout?: number;
  zyteApiKey?: string;
}

const DEFAULT_THEATER_CODE = '0056';
const MAX_FALLBACK_THEATERS = 5;
const THEATER_NOT_FOUND_ERROR_NAME = 'CgvTheaterNotFoundError';

function createTheaterNotFoundError(theaterQuery: string): Error {
  const error = new Error(`CGV 극장을 찾을 수 없습니다: ${theaterQuery}`);
  error.name = THEATER_NOT_FOUND_ERROR_NAME;
  return error;
}

async function resolveTheater(playDate: string, params: CommonFetchParams): Promise<CgvTheater | null> {
  if (params.theaterCode && !params.theaterQuery) {
    return {
      theaterCode: params.theaterCode,
      theaterName: '',
      regionCode: params.regionCode,
    };
  }

  const theaters = await fetchCgvTheaters({
    playDate,
    regionCode: params.regionCode,
    timeout: params.timeout,
    zyteApiKey: params.zyteApiKey,
  });

  if (params.theaterQuery) {
    const matchedTheater = pickMatchingTheater(theaters, params.theaterQuery);
    if (!matchedTheater) {
      throw createTheaterNotFoundError(params.theaterQuery);
    }

    return matchedTheater;
  }

  return theaters[0] || null;
}

async function resolveTheaterCode(playDate: string, params: CommonFetchParams): Promise<string> {
  const theater = await resolveTheater(playDate, params);
  return theater?.theaterCode || DEFAULT_THEATER_CODE;
}

async function fetchMoviesByTheaterCode(
  playDate: string,
  theaterCode: string,
  params: CommonFetchParams,
): Promise<CgvMovie[]> {
  const searchParams = new URLSearchParams({
    coCd: CGV_API.COMPANY_CODE,
    siteNo: theaterCode,
    scnYmd: playDate,
  });

  const response = await requestCgv<CgvMovieListResponse>(
    CGV_API.MOVIE_LIST_PATH,
    searchParams,
    params.timeout,
    params.zyteApiKey,
  );

  return (response.data || [])
    .filter((item) => item.movNo && item.movNm)
    .map((item) => mapCgvMovieItem(item));
}

async function fetchTimetableByMovieCode(
  playDate: string,
  theaterCode: string,
  movieCode: string,
  params: CommonFetchParams,
): Promise<CgvTimetable[]> {
  const searchParams = new URLSearchParams({
    coCd: CGV_API.COMPANY_CODE,
    siteNo: theaterCode,
    scnYmd: playDate,
    movNo: movieCode,
    rtctlScopCd: CGV_API.TIMETABLE_SCOPE_CODE,
  });

  const response = await requestCgv<CgvTimetableResponse>(
    CGV_API.TIMETABLE_PATH,
    searchParams,
    params.timeout,
    params.zyteApiKey,
  );

  return (response.data || [])
    .filter((item) => item.siteNo && item.movNo && item.scnYmd)
    .map((item) => ({
      scheduleId: `${item.scnYmd}${item.siteNo}${item.scnSseq || ''}`,
      movieCode: item.movNo as string,
      movieName: item.movNm || '',
      theaterCode: item.siteNo as string,
      theaterName: item.siteNm || '',
      playDate: item.scnYmd as string,
      startTime: formatTime(item.scnsrtTm),
      endTime: formatTime(item.scnendTm),
      totalSeats: toNumber(item.stcnt),
      remainingSeats: toNumber(item.frSeatCnt || item.frtmpSeatCnt),
    }));
}

async function fetchTimetableItemsBySite(
  playDate: string,
  theaterCode: string,
  params: CommonFetchParams,
): Promise<CgvTimetableItem[]> {
  const searchParams = new URLSearchParams({
    coCd: CGV_API.COMPANY_CODE,
    siteNo: theaterCode,
    scnYmd: playDate,
    rtctlScopCd: CGV_API.TIMETABLE_SITE_SCOPE_CODE,
  });

  const response = await requestCgv<CgvTimetableResponse>(
    CGV_API.TIMETABLE_BY_SITE_PATH,
    searchParams,
    params.timeout,
    params.zyteApiKey,
  );

  return (response.data || []).filter((item) => item.siteNo && item.scnYmd);
}

async function fetchTimetableBySite(
  playDate: string,
  theaterCode: string,
  params: CommonFetchParams,
): Promise<CgvTimetable[]> {
  const items = await fetchTimetableItemsBySite(playDate, theaterCode, params);

  return items.map((item) => ({
    scheduleId: `${item.scnYmd}${item.siteNo}${item.scnSseq || ''}`,
    movieCode: (item.movNo || '') as string,
    movieName: item.movNm || item.prodNm || '',
    theaterCode: item.siteNo as string,
    theaterName: item.siteNm || '',
    playDate: item.scnYmd as string,
    startTime: formatTime(item.scnsrtTm),
    endTime: formatTime(item.scnendTm),
    totalSeats: toNumber(item.stcnt),
    remainingSeats: toNumber(item.frSeatCnt || item.frtmpSeatCnt),
  }));
}

export async function fetchCgvTheaters(params: CommonFetchParams): Promise<CgvTheater[]> {
  const searchParams = new URLSearchParams({
    coCd: CGV_API.COMPANY_CODE,
  });

  const response = await requestCgv<CgvTheaterListResponse>(
    CGV_API.THEATER_LIST_PATH,
    searchParams,
    params.timeout,
    params.zyteApiKey,
  );

  const list = (response.data || []).flatMap((region) =>
    (region.siteList || []).map((site) => ({
      theaterCode: site.siteNo || '',
      theaterName: site.siteNm || '',
      regionCode: region.regnGrpCd || undefined,
      regionName: region.regnGrpNm || '',
    })),
  );

  return list
    .filter((item) => item.theaterCode && item.theaterName)
    .filter((item) => (params.regionCode ? item.regionCode === params.regionCode : true))
    .map(({ theaterCode, theaterName, regionCode }) => ({ theaterCode, theaterName, regionCode }));
}

export async function fetchCgvMovies(params: CommonFetchParams): Promise<CgvMovie[]> {
  const playDate = params.playDate || toYyyymmdd();
  const sort = normalizeCgvMovieSort(params.sort);
  const theaterCode = await resolveTheaterCode(playDate, params);
  let timetableError: unknown;

  try {
    const timetableItems = await fetchTimetableItemsBySite(playDate, theaterCode, params);
    if (timetableItems.length > 0) {
      return buildMoviesFromTimetableItems(timetableItems, sort);
    }
  } catch (error) {
    timetableError = error;
  }

  try {
    const movies = await fetchMoviesByTheaterCode(playDate, theaterCode, params);
    return sortMoviesFromList(movies, sort);
  } catch (error) {
    if (timetableError) {
      throw timetableError;
    }

    throw error;
  }
}

function pickFallbackTheaterCodes(theaters: CgvTheater[]): string[] {
  const uniqueCodes = theaters
    .map((theater) => theater.theaterCode)
    .filter((code, index, array) => code && array.indexOf(code) === index);

  return [DEFAULT_THEATER_CODE, ...uniqueCodes.filter((code) => code !== DEFAULT_THEATER_CODE)].slice(
    0,
    MAX_FALLBACK_THEATERS,
  );
}

export async function fetchCgvTimetable(params: CommonFetchParams): Promise<CgvTimetable[]> {
  const playDate = params.playDate || toYyyymmdd();
  const theaterCode = await resolveTheaterCode(playDate, params);
  const timetableBySite = await fetchTimetableBySite(playDate, theaterCode, params);

  if (timetableBySite.length > 0) {
    if (params.movieCode) {
      return timetableBySite.filter((item) => item.movieCode === params.movieCode);
    }
    return timetableBySite;
  }

  if (params.movieCode) {
    return fetchTimetableByMovieCode(playDate, theaterCode, params.movieCode, params);
  }

  const theaterCodes = params.theaterCode || params.theaterQuery
    ? [theaterCode]
    : pickFallbackTheaterCodes(
        await fetchCgvTheaters({
          playDate,
          regionCode: params.regionCode,
          timeout: params.timeout,
          zyteApiKey: params.zyteApiKey,
        }),
      );

  for (const fallbackTheaterCode of theaterCodes) {
    const movies = await fetchMoviesByTheaterCode(playDate, fallbackTheaterCode, params);
    const timetableByTheater: CgvTimetable[] = [];

    for (const movie of movies) {
      const timetable = await fetchTimetableByMovieCode(
        playDate,
        fallbackTheaterCode,
        movie.movieCode,
        params,
      );
      if (timetable.length > 0) {
        timetableByTheater.push(...timetable);
      }
    }

    if (timetableByTheater.length > 0) {
      return timetableByTheater;
    }
  }

  return [];
}

export { DEFAULT_CGV_MOVIE_SORT, normalizeCgvMovieSort, THEATER_NOT_FOUND_ERROR_NAME, toYyyymmdd };
