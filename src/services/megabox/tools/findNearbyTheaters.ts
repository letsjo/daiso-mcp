/**
 * 메가박스 주변 지점 탐색 도구
 */

import * as z from 'zod';
import type { McpToolResponse, ToolRegistration } from '../../../core/types.js';
import { createJsonTextResponse, createTool } from '../../../core/toolBuilder.js';
import { toYyyymmdd } from '../client.js';
import {
  DEFAULT_MEGABOX_LATITUDE,
  DEFAULT_MEGABOX_LONGITUDE,
  findNearbyMegaboxTheaters,
} from '../theaterLocator.js';

interface FindNearbyTheatersArgs {
  latitude?: number;
  longitude?: number;
  playDate?: string;
  areaCode?: string;
  limit?: number;
  timeoutMs?: number;
}

async function findNearbyTheaters(args: FindNearbyTheatersArgs): Promise<McpToolResponse> {
  const {
    latitude = DEFAULT_MEGABOX_LATITUDE,
    longitude = DEFAULT_MEGABOX_LONGITUDE,
    playDate = toYyyymmdd(),
    areaCode = '11',
    limit = 10,
    timeoutMs = 15000,
  } = args;

  const theaters = await findNearbyMegaboxTheaters({
    latitude,
    longitude,
    playDate,
    areaCode,
    limit,
    timeoutMs,
  });

  const result = {
    location: { latitude, longitude },
    playDate,
    areaCode,
    count: theaters.length,
    theaters,
  };

  return createJsonTextResponse(result);
}

export function createFindNearbyTheatersTool(): ToolRegistration {
  return createTool<FindNearbyTheatersArgs>({
    name: 'megabox_find_nearby_theaters',
    title: '메가박스 주변 지점 탐색',
    description: '사용자 좌표 기준으로 메가박스 지점을 거리순으로 조회합니다.',
    inputSchema: {
      latitude: z.number().optional().default(37.5665).describe('위도 (기본값: 서울 시청 37.5665)'),
      longitude: z.number().optional().default(126.978).describe('경도 (기본값: 서울 시청 126.978)'),
      playDate: z.string().optional().describe('조회 날짜(YYYYMMDD, 기본값: 오늘)'),
      areaCode: z.string().optional().default('11').describe('지역 코드 (기본값: 11, 서울)'),
      limit: z.number().optional().default(10).describe('반환할 최대 지점 수 (기본값: 10)'),
      timeoutMs: z.number().optional().default(15000).describe('요청 제한 시간(ms, 기본값: 15000)'),
    },
    handler: findNearbyTheaters,
  });
}
