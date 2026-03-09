/**
 * 메가박스 API 클라이언트
 */

import { MEGABOX_API } from './api.js';
import type {
  MegaboxBookingListResponse,
  MegaboxMovie,
  MegaboxSeatAvailability,
  MegaboxSeatMap,
  MegaboxSeatMapPrice,
  MegaboxSeatMapResponse,
  MegaboxSeatMapScheduleOption,
  MegaboxSeatMapSeat,
  MegaboxShowtime,
  MegaboxTheater,
  MegaboxTheaterInfo,
} from './types.js';
import { formatTime, toNumber, toYyyymmdd } from '../../utils/format.js';
import { fetchWithTimeout, rethrowAsTimeout, throwIfResponseNotOk } from '../../utils/http.js';

interface FetchBookingListParams {
  playDate: string;
  movieId?: string;
  theaterId?: string;
  areaCode?: string;
  timeout?: number;
}

export async function fetchMegaboxBookingList(
  params: FetchBookingListParams,
): Promise<{ theaters: MegaboxTheater[]; movies: MegaboxMovie[]; showtimes: MegaboxShowtime[] }> {
  const { timeout = 15000 } = params;
  const form = new URLSearchParams({
    playDe: params.playDate,
    sellChnlCd: 'ONLINE',
    brchNoListCnt: '1',
    areaCd1: params.areaCode || '11',
    spclbYn1: 'N',
    theabKindCd1: '',
  });

  if (params.movieId) {
    form.set('arrMovieNo', params.movieId);
  }

  if (params.theaterId) {
    form.set('brchNo1', params.theaterId);
  }

  try {
    const response = await fetchWithTimeout(
      `${MEGABOX_API.BASE_URL}${MEGABOX_API.SELECT_BOOKING_LIST_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: form.toString(),
        timeout,
      },
    );

    throwIfResponseNotOk(response, '메가박스 상영 목록 조회 실패');

    const body = (await response.json()) as MegaboxBookingListResponse;

    const theaters = (body.areaBrchList || [])
      .filter((item) => item.brchNo && item.brchNm)
      .map((item) => ({
        theaterId: item.brchNo as string,
        theaterName: item.brchNm as string,
      }));

    const movies = (body.movieList || [])
      .filter((item) => item.movieNo && item.movieNm)
      .map((item) => ({
        movieId: item.movieNo as string,
        movieName: item.movieNm as string,
        movieStatus: item.movieStatCdNm || undefined,
      }));

    const showtimes = (body.movieFormList || [])
      .filter((item) => item.playSchdlNo && item.movieNo && item.brchNo)
      .map((item) => ({
        scheduleId: item.playSchdlNo as string,
        movieId: item.movieNo as string,
        movieName: item.movieNm || '',
        theaterId: item.brchNo as string,
        theaterName: item.brchNm || '',
        playDate: item.playDe || params.playDate,
        startTime: formatTime(item.playStartTime),
        endTime: formatTime(item.playEndTime),
        totalSeats: toNumber(item.totSeatCnt),
        remainingSeats: toNumber(item.restSeatCnt),
      }));

    return {
      theaters,
      movies,
      showtimes,
    };
  } catch (error) {
    rethrowAsTimeout(error, '메가박스 상영 목록 조회 시간 초과');
    throw error;
  }
}

function parseCoordinates(html: string): { latitude: number | null; longitude: number | null } {
  const latMatch = html.match(/(?:lat=|mapLat\s*[:=]\s*["']?)(-?\d+\.\d+)/i);
  const lngMatch = html.match(/(?:lng=|mapLng\s*[:=]\s*["']?)(-?\d+\.\d+)/i);

  return {
    latitude: latMatch ? parseFloat(latMatch[1]) : null,
    longitude: lngMatch ? parseFloat(lngMatch[1]) : null,
  };
}

function parseAddress(html: string): string {
  const roadAddressMatch = html.match(/도로명주소<\/dt>\s*<dd>([^<]+)<\/dd>/i);
  if (roadAddressMatch) {
    return roadAddressMatch[1].trim();
  }

  const addressMatch = html.match(/주소<\/dt>\s*<dd>([^<]+)<\/dd>/i);
  if (addressMatch) {
    return addressMatch[1].trim();
  }

  return '';
}

function normalizeSeatAvailability(statusCode?: string | null): MegaboxSeatAvailability {
  return statusCode && statusCode.endsWith('SELL') ? 'available' : 'unavailable';
}

function extractNonZeroAmounts(source: Record<string, unknown>): Record<string, number> {
  return Object.entries(source).reduce<Record<string, number>>((accumulator, [key, value]) => {
    if (!key.endsWith('Amt')) {
      return accumulator;
    }

    const amount =
      typeof value === 'number' || typeof value === 'string' ? toNumber(value) : 0;
    if (amount > 0) {
      accumulator[key] = amount;
    }

    return accumulator;
  }, {});
}

function normalizeMegaboxSeatMapSeats(
  items: MegaboxSeatMapResponse['seatListSD01'] = [],
): MegaboxSeatMapSeat[] {
  return items
    .filter((item) => item.seatUniqNo)
    .map((item) => {
      const rowLabel = item.rowNm || '';
      const seatNumber = toNumber(item.seatNo);

      return {
        seatId: item.seatUniqNo as string,
        seatLabel: `${rowLabel}${seatNumber || ''}`.trim(),
        rowLabel,
        seatNumber,
        rowNumber: toNumber(item.rowNo),
        columnNumber: toNumber(item.colNo),
        zoneCode: item.seatZoneCd || null,
        classCode: item.seatClassCd || null,
        statusCode: item.seatStatCd || null,
        availability: normalizeSeatAvailability(item.seatStatCd),
        exposed: item.seatExpoAt === 'Y',
        coordinates: {
          x: toNumber(item.horzCoorVal),
          y: toNumber(item.vertCoorVal),
        },
        selectionGroupName: item.seatChoiGrpNm || null,
        note: item.seatNotiMsg || null,
      };
    });
}

function normalizeMegaboxSeatMapPrices(
  items: MegaboxSeatMapResponse['seatTicketAmtList'] = [],
): MegaboxSeatMapPrice[] {
  return items
    .filter((item) => item.ticketKindCd && item.ticketTypeName)
    .map((item) => ({
      ticketKindCode: item.ticketKindCd as string,
      ticketTypeName: item.ticketTypeName as string,
      amounts: extractNonZeroAmounts(item),
    }));
}

function normalizeMegaboxSeatMapScheduleOptions(
  items: MegaboxSeatMapResponse['playSeqList'] = [],
): MegaboxSeatMapScheduleOption[] {
  return items
    .filter((item) => item.playSchdlNo)
    .map((item) => ({
      scheduleId: item.playSchdlNo as string,
      startTime: formatTime(item.playStartTime),
      endTime: formatTime(item.playEndTime),
      remainingSeats: toNumber(item.choiCnt),
    }));
}

export async function fetchMegaboxTheaterInfo(
  theaterId: string,
  timeout = 15000,
): Promise<MegaboxTheaterInfo> {
  const form = new URLSearchParams({
    brchNo: theaterId,
  });

  try {
    const response = await fetchWithTimeout(
      `${MEGABOX_API.BASE_URL}${MEGABOX_API.THEATER_INFO_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'text/html, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: form.toString(),
        timeout,
      },
    );

    throwIfResponseNotOk(response, '메가박스 지점 정보 조회 실패');

    const html = await response.text();
    const coordinates = parseCoordinates(html);
    const address = parseAddress(html);

    return {
      theaterId,
      address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };
  } catch (error) {
    rethrowAsTimeout(error, '메가박스 지점 정보 조회 시간 초과');
    throw error;
  }
}

export async function fetchMegaboxSeatMap(
  playScheduleId: string,
  timeout = 15000,
): Promise<MegaboxSeatMap | null> {
  const form = new URLSearchParams({
    playSchdlNo: playScheduleId,
  });

  try {
    const response = await fetchWithTimeout(
      `${MEGABOX_API.BASE_URL}${MEGABOX_API.SELECT_SEAT_LIST_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: form.toString(),
        timeout,
      },
    );

    throwIfResponseNotOk(response, '메가박스 좌석맵 조회 실패');

    const body = (await response.json()) as MegaboxSeatMapResponse;
    if (!body.movieDtlInfo?.playSchdlNo) {
      return null;
    }

    const seats = normalizeMegaboxSeatMapSeats(body.seatListSD01);
    const exposedSeats = seats.filter((seat) => seat.exposed).length;
    const availableSeats = seats.filter(
      (seat) => seat.exposed && seat.availability === 'available',
    ).length;

    return {
      scheduleId: body.movieDtlInfo.playSchdlNo,
      playDate: body.movieDtlInfo.playDe || '',
      movie: {
        movieId: body.movieDtlInfo.movieNo || '',
        movieName: body.movieDtlInfo.movieNm || '',
        playKindName: body.movieDtlInfo.playKindName || null,
        rating: body.movieDtlInfo.admisClassName || null,
      },
      theater: {
        theaterId: body.movieDtlInfo.brchNo || '',
        theaterName: body.movieDtlInfo.brchNm || '',
        areaCode: body.movieDtlInfo.areaCd || null,
      },
      auditorium: {
        auditoriumId: body.movieDtlInfo.theabNo || null,
        auditoriumName: body.movieDtlInfo.theabNm || null,
        auditoriumKindCode: body.movieDtlInfo.theabKindCd || null,
      },
      time: {
        startTime: formatTime(body.movieDtlInfo.playStartTime),
        endTime: formatTime(body.movieDtlInfo.playEndTime),
      },
      summary: {
        totalSeats: seats.length,
        exposedSeats,
        availableSeats,
        unavailableSeats: seats.length - availableSeats,
        maxTicketCount: toNumber(body.maxTicketCnt),
      },
      seats,
      ticketPrices: normalizeMegaboxSeatMapPrices(body.seatTicketAmtList),
      scheduleOptions: normalizeMegaboxSeatMapScheduleOptions(body.playSeqList),
    };
  } catch (error) {
    rethrowAsTimeout(error, '메가박스 좌석맵 조회 시간 초과');
    throw error;
  }
}

export { toYyyymmdd };
