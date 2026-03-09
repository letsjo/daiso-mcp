/**
 * CGV 서비스 전용 타입 정의
 */

export interface CgvTheater {
  theaterCode: string;
  theaterName: string;
  regionCode?: string;
}

export const CGV_MOVIE_SORT_VALUES = ['popularity-desc', 'cgv-default'] as const;

export type CgvMovieSort = (typeof CGV_MOVIE_SORT_VALUES)[number];

export interface CgvMovie {
  movieCode: string;
  movieName: string;
  rating?: string;
  ticketRate?: number;
  showtimeCount?: number;
  firstStartTime?: string;
}

export interface CgvTimetable {
  scheduleId: string;
  movieCode: string;
  movieName: string;
  theaterCode: string;
  theaterName: string;
  playDate: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  remainingSeats: number;
}

interface CgvTheaterItem {
  siteNo?: string;
  siteNm?: string;
  coCd?: string;
  bzplcOperStusNm?: string;
}

export interface CgvMovieItem {
  movNo?: string;
  movNm?: string;
  cratgClsNm?: string | null;
  cratgClsCd?: string | null;
  atktRate?: number | string | null;
  scnBssTm?: string | null;
}

export interface CgvTimetableItem {
  siteNo?: string;
  siteNm?: string;
  scnYmd?: string;
  scnSseq?: string;
  movNo?: string;
  movNm?: string;
  prodNm?: string;
  scnsrtTm?: string;
  scnendTm?: string;
  stcnt?: number | string;
  frSeatCnt?: number | string;
  frtmpSeatCnt?: number | string;
  cratgClsNm?: string | null;
  sortOseq?: number | string | null;
}

export interface CgvTheaterListResponse {
  statusCode?: number;
  statusMessage?: string;
  data?: Array<{
    regnGrpCd?: string;
    regnGrpNm?: string;
    siteList?: CgvTheaterItem[];
  }>;
}

export interface CgvMovieListResponse {
  statusCode?: number;
  statusMessage?: string;
  data?: CgvMovieItem[];
}

export interface CgvTimetableResponse {
  statusCode?: number;
  statusMessage?: string;
  data?: CgvTimetableItem[];
}
