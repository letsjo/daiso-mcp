/**
 * API 응답 링크 생성 유틸
 */

import type { Product } from '../services/daiso/types.js';
import type { OliveyoungProduct } from '../services/oliveyoung/types.js';
import type { MegaboxSeatMap, MegaboxShowtime, MegaboxTheater } from '../services/megabox/types.js';
import type { CgvTimetable } from '../services/cgv/types.js';

const DEFAULT_PUBLIC_BASE_URL = 'https://daiso-mcp.hyunoh-jo.workers.dev';

function getOrigin(requestUrl?: string): string {
  if (!requestUrl) {
    return DEFAULT_PUBLIC_BASE_URL;
  }

  try {
    return new URL(requestUrl, DEFAULT_PUBLIC_BASE_URL).origin;
  } catch {
    return DEFAULT_PUBLIC_BASE_URL;
  }
}

export function withDaisoProductLinks(product: Product, requestUrl: string) {
  const origin = getOrigin(requestUrl);

  return {
    ...product,
    links: {
      apiDetailUrl: `${origin}/api/daiso/products/${encodeURIComponent(product.id)}`,
      apiInventoryUrl: `${origin}/api/daiso/inventory?productId=${encodeURIComponent(product.id)}`,
      officialMallFinderUrl: 'https://www.daisomall.co.kr/ms/msg/SCR_MSG_0015',
    },
  };
}

export function withOliveyoungProductLinks(product: OliveyoungProduct) {
  return {
    ...product,
    links: {
      officialProductUrl: `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${encodeURIComponent(
        product.goodsNumber,
      )}`,
    },
  };
}

export function withMegaboxTheaterLinks(theater: MegaboxTheater) {
  return {
    ...theater,
    links: {
      officialTheaterUrl: `https://www.megabox.co.kr/theater?brchNo=${encodeURIComponent(
        theater.theaterId,
      )}`,
    },
  };
}

export function withMegaboxShowtimeLinks(showtime: MegaboxShowtime, requestUrl: string) {
  const origin = getOrigin(requestUrl);

  return {
    ...showtime,
    links: {
      officialTheaterUrl: `https://www.megabox.co.kr/theater?brchNo=${encodeURIComponent(
        showtime.theaterId,
      )}`,
      officialBookingUrl:
        'https://www.megabox.co.kr/on/oh/ohb/SimpleBooking/simpleBookingPage.do' +
        `?rpstMovieNo=${encodeURIComponent(showtime.movieId)}` +
        `&brchNo1=${encodeURIComponent(showtime.theaterId)}` +
        `&sellChnlCd=ONLINE` +
        `&playDe=${encodeURIComponent(showtime.playDate)}` +
        `&naverPlaySchdlNo=${encodeURIComponent(showtime.scheduleId)}`,
      officialSeatMapUrl:
        'https://www.megabox.co.kr/on/oh/ohz/PcntSeatChoi/selectPcntSeatChoi.do' +
        `?playSchdlNo=${encodeURIComponent(showtime.scheduleId)}`,
      apiSeatMapUrl: `${origin}/api/megabox/seat-map?playSchdlNo=${encodeURIComponent(
        showtime.scheduleId,
      )}`,
    },
  };
}

export function buildMegaboxSeatMapLinks(seatMap: MegaboxSeatMap, requestUrl: string) {
  const origin = getOrigin(requestUrl);

  return {
    officialTheaterUrl: `https://www.megabox.co.kr/theater?brchNo=${encodeURIComponent(
      seatMap.theater.theaterId,
    )}`,
    officialBookingUrl:
      'https://www.megabox.co.kr/on/oh/ohb/SimpleBooking/simpleBookingPage.do' +
      `?rpstMovieNo=${encodeURIComponent(seatMap.movie.movieId)}` +
      `&brchNo1=${encodeURIComponent(seatMap.theater.theaterId)}` +
      `&sellChnlCd=ONLINE` +
      `&playDe=${encodeURIComponent(seatMap.playDate)}` +
      `&naverPlaySchdlNo=${encodeURIComponent(seatMap.scheduleId)}`,
    officialSeatMapUrl:
      'https://www.megabox.co.kr/on/oh/ohz/PcntSeatChoi/selectPcntSeatChoi.do' +
      `?playSchdlNo=${encodeURIComponent(seatMap.scheduleId)}`,
    apiSeatMapUrl: `${origin}/api/megabox/seat-map?playSchdlNo=${encodeURIComponent(
      seatMap.scheduleId,
    )}`,
  };
}

export function withCgvTimetableLinks(item: CgvTimetable, requestUrl: string) {
  const origin = getOrigin(requestUrl);

  return {
    ...item,
    links: {
      officialBookingUrl: 'https://www.cgv.co.kr/cnm/movieBook',
      apiTimetableUrl:
        `${origin}/api/cgv/timetable?playDate=${encodeURIComponent(item.playDate)}` +
        `&theaterCode=${encodeURIComponent(item.theaterCode)}` +
        `&movieCode=${encodeURIComponent(item.movieCode)}`,
    },
  };
}
