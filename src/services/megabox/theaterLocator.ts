/**
 * 메가박스 주변 지점 계산 공통 로직
 *
 * Cloudflare Worker 환경에서는 한 요청에서 과도한 수의 외부 fetch를 병렬 실행하면
 * subrequest 한도에 걸릴 수 있어 상세 조회 대상을 제한합니다.
 */

import { fetchMegaboxBookingList, fetchMegaboxTheaterInfo } from './client.js';

export const DEFAULT_MEGABOX_LATITUDE = 37.5665;
export const DEFAULT_MEGABOX_LONGITUDE = 126.978;

const MIN_THEATER_DETAIL_REQUESTS = 20;
const MAX_THEATER_DETAIL_REQUESTS = 40;
const THEATER_DETAIL_REQUEST_MULTIPLIER = 4;

interface FindNearbyMegaboxTheatersParams {
  latitude: number;
  longitude: number;
  playDate: string;
  areaCode: string;
  limit: number;
  timeoutMs: number;
}

export interface NearbyMegaboxTheater {
  theaterId: string;
  theaterName: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

function getTheaterDetailRequestLimit(limit: number): number {
  return Math.min(
    Math.max(limit * THEATER_DETAIL_REQUEST_MULTIPLIER, MIN_THEATER_DETAIL_REQUESTS),
    MAX_THEATER_DETAIL_REQUESTS,
  );
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

export async function findNearbyMegaboxTheaters(
  params: FindNearbyMegaboxTheatersParams,
): Promise<NearbyMegaboxTheater[]> {
  const { theaters } = await fetchMegaboxBookingList({
    playDate: params.playDate,
    areaCode: params.areaCode,
    timeout: params.timeoutMs,
  });

  const sampledTheaters = theaters.slice(0, getTheaterDetailRequestLimit(params.limit));
  const infoResults = await Promise.allSettled(
    sampledTheaters.map((theater) => fetchMegaboxTheaterInfo(theater.theaterId, params.timeoutMs)),
  );

  return sampledTheaters
    .map((theater, index) => {
      const infoResult = infoResults[index];
      if (infoResult.status !== 'fulfilled') {
        return null;
      }

      if (infoResult.value.latitude === null || infoResult.value.longitude === null) {
        return null;
      }

      const distanceKm = calculateDistanceKm(
        params.latitude,
        params.longitude,
        infoResult.value.latitude,
        infoResult.value.longitude,
      );

      return {
        theaterId: theater.theaterId,
        theaterName: theater.theaterName,
        address: infoResult.value.address,
        latitude: infoResult.value.latitude,
        longitude: infoResult.value.longitude,
        distanceKm: Number(distanceKm.toFixed(2)),
      };
    })
    .filter((theater): theater is NearbyMegaboxTheater => theater !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, params.limit);
}
