/**
 * 메가박스 잔여 좌석 조회 도구
 */

import * as z from 'zod';
import type { McpToolResponse, ToolRegistration } from '../../../core/types.js';
import { createJsonTextResponse, createTool } from '../../../core/toolBuilder.js';
import { fetchMegaboxBookingList, toYyyymmdd } from '../client.js';
import { matchesTimeWindow, normalizeTimeWindow } from '../../../utils/timeWindow.js';
import {
  filterAndSortShowtimes,
  normalizeMinRemainingSeats,
  normalizeShowtimeSort,
  type ShowtimeSort,
} from '../../../utils/showtimeQuery.js';

interface GetRemainingSeatsArgs {
  playDate?: string;
  theaterId?: string;
  movieId?: string;
  areaCode?: string;
  fromTime?: string;
  toTime?: string;
  minRemainingSeats?: number;
  sort?: ShowtimeSort;
  limit?: number;
  timeoutMs?: number;
}

async function getRemainingSeats(args: GetRemainingSeatsArgs): Promise<McpToolResponse> {
  const {
    playDate = toYyyymmdd(),
    theaterId,
    movieId,
    areaCode = '11',
    fromTime,
    toTime,
    minRemainingSeats,
    sort,
    limit = 50,
    timeoutMs = 15000,
  } = args;
  const timeWindow = normalizeTimeWindow({ fromTime, toTime });
  const normalizedMinRemainingSeats = normalizeMinRemainingSeats(minRemainingSeats);
  const normalizedSort = normalizeShowtimeSort(sort);

  const { showtimes } = await fetchMegaboxBookingList({
    playDate,
    theaterId,
    movieId,
    areaCode,
    timeout: timeoutMs,
  });

  const filteredShowtimes = showtimes
    .filter((item) => (theaterId ? item.theaterId === theaterId : true))
    .filter((item) => (movieId ? item.movieId === movieId : true))
    .filter((item) => matchesTimeWindow(item.startTime, timeWindow));
  const seats = filterAndSortShowtimes(filteredShowtimes, {
    minRemainingSeats: normalizedMinRemainingSeats,
    sort: normalizedSort,
    limit,
  });

  const result = {
    playDate,
    filters: {
      theaterId: theaterId || null,
      movieId: movieId || null,
      areaCode,
      fromTime: timeWindow.fromTime || null,
      toTime: timeWindow.toTime || null,
      minRemainingSeats: normalizedMinRemainingSeats ?? null,
      sort: normalizedSort,
      limit,
    },
    count: seats.length,
    seats,
  };

  return createJsonTextResponse(result);
}

export function createGetRemainingSeatsTool(): ToolRegistration {
  return createTool<GetRemainingSeatsArgs>({
    name: 'megabox_get_remaining_seats',
    title: '메가박스 잔여 좌석 조회',
    description: '영화/지점/날짜 조건으로 상영 회차별 남은 좌석 수를 조회합니다.',
    inputSchema: {
      playDate: z.string().optional().describe('조회 날짜(YYYYMMDD, 기본값: 오늘)'),
      theaterId: z.string().optional().describe('메가박스 지점 번호 (예: 1372)'),
      movieId: z.string().optional().describe('메가박스 영화 번호 (예: 25104500)'),
      areaCode: z.string().optional().default('11').describe('지역 코드 (기본값: 11, 서울)'),
      fromTime: z.string().optional().describe('조회 시작 시각 하한 (HHMM, 예: 1800)'),
      toTime: z.string().optional().describe('조회 시작 시각 상한 (HHMM, 예: 2100)'),
      minRemainingSeats: z.number().int().nonnegative().optional().describe('최소 남은 좌석 수'),
      sort: z
        .enum(['startTime-asc', 'remainingSeats-desc', 'remainingSeats-asc'])
        .optional()
        .default('startTime-asc')
        .describe('정렬 기준'),
      limit: z.number().optional().default(50).describe('반환할 최대 회차 수 (기본값: 50)'),
      timeoutMs: z.number().optional().default(15000).describe('요청 제한 시간(ms, 기본값: 15000)'),
    },
    handler: getRemainingSeats,
  });
}
