/**
 * 메가박스 서비스 전용 타입 정의
 */

export interface MegaboxTheater {
  theaterId: string;
  theaterName: string;
}

export interface MegaboxMovie {
  movieId: string;
  movieName: string;
  movieStatus?: string;
}

export interface MegaboxShowtime {
  scheduleId: string;
  movieId: string;
  movieName: string;
  theaterId: string;
  theaterName: string;
  playDate: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  remainingSeats: number;
}

export type MegaboxSeatAvailability = 'available' | 'unavailable';

export interface MegaboxSeatMapSeat {
  seatId: string;
  seatLabel: string;
  rowLabel: string;
  seatNumber: number;
  rowNumber: number;
  columnNumber: number;
  zoneCode: string | null;
  classCode: string | null;
  statusCode: string | null;
  availability: MegaboxSeatAvailability;
  exposed: boolean;
  coordinates: {
    x: number;
    y: number;
  };
  selectionGroupName: string | null;
  note: string | null;
}

export interface MegaboxSeatMapPrice {
  ticketKindCode: string;
  ticketTypeName: string;
  amounts: Record<string, number>;
}

export interface MegaboxSeatMapScheduleOption {
  scheduleId: string;
  startTime: string;
  endTime: string;
  remainingSeats: number;
}

export interface MegaboxSeatMap {
  scheduleId: string;
  playDate: string;
  movie: {
    movieId: string;
    movieName: string;
    playKindName: string | null;
    rating: string | null;
  };
  theater: {
    theaterId: string;
    theaterName: string;
    areaCode: string | null;
  };
  auditorium: {
    auditoriumId: string | null;
    auditoriumName: string | null;
    auditoriumKindCode: string | null;
  };
  time: {
    startTime: string;
    endTime: string;
  };
  summary: {
    totalSeats: number;
    exposedSeats: number;
    availableSeats: number;
    unavailableSeats: number;
    maxTicketCount: number;
  };
  seats: MegaboxSeatMapSeat[];
  ticketPrices: MegaboxSeatMapPrice[];
  scheduleOptions: MegaboxSeatMapScheduleOption[];
}

export interface MegaboxTheaterInfo {
  theaterId: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface MegaboxAreaBrchItem {
  brchNo?: string;
  brchNm?: string;
}

interface MegaboxMovieItem {
  movieNo?: string;
  movieNm?: string;
  movieStatCdNm?: string;
}

interface MegaboxMovieFormItem {
  playSchdlNo?: string;
  movieNo?: string;
  movieNm?: string;
  brchNo?: string;
  brchNm?: string;
  playDe?: string;
  playStartTime?: string;
  playEndTime?: string;
  restSeatCnt?: number | string;
  totSeatCnt?: number | string;
}

export interface MegaboxBookingListResponse {
  areaBrchList?: MegaboxAreaBrchItem[];
  movieList?: MegaboxMovieItem[];
  movieFormList?: MegaboxMovieFormItem[];
}

interface MegaboxSeatMapMovieDetailItem {
  playSchdlNo?: string;
  brchNo?: string;
  brchNm?: string;
  areaCd?: string;
  theabNo?: string;
  theabNm?: string;
  theabKindCd?: string;
  movieNo?: string;
  movieNm?: string;
  playDe?: string;
  playStartTime?: string;
  playEndTime?: string;
  playKindName?: string;
  admisClassName?: string;
}

interface MegaboxSeatMapSeatItem {
  seatUniqNo?: string;
  seatZoneCd?: string;
  seatClassCd?: string;
  rowNm?: string;
  seatNo?: number | string;
  rowNo?: number | string;
  colNo?: number | string;
  seatExpoAt?: string;
  horzCoorVal?: number | string;
  vertCoorVal?: number | string;
  seatNotiMsg?: string | null;
  seatChoiGrpNm?: string | null;
  seatStatCd?: string | null;
}

interface MegaboxSeatMapPriceItem {
  ticketKindCd?: string;
  ticketTypeName?: string;
  [key: string]: unknown;
}

interface MegaboxSeatMapPlaySeqItem {
  playSchdlNo?: string;
  playStartTime?: string;
  playEndTime?: string;
  choiCnt?: number | string;
}

export interface MegaboxSeatMapResponse {
  msg?: string;
  statCd?: number | string;
  movieDtlInfo?: MegaboxSeatMapMovieDetailItem | null;
  playSeqList?: MegaboxSeatMapPlaySeqItem[];
  seatListSD01?: MegaboxSeatMapSeatItem[];
  seatTicketAmtList?: MegaboxSeatMapPriceItem[];
  maxTicketCnt?: number | string;
}
