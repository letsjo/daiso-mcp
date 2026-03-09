/**
 * 메가박스 좌석맵 조회 도구
 */

import * as z from 'zod';
import type { McpToolResponse, ToolRegistration } from '../../../core/types.js';
import { createJsonTextResponse, createTool } from '../../../core/toolBuilder.js';
import { fetchMegaboxSeatMap } from '../client.js';

interface GetSeatMapArgs {
  playSchdlNo: string;
  timeoutMs?: number;
}

async function getSeatMap(args: GetSeatMapArgs): Promise<McpToolResponse> {
  const { playSchdlNo, timeoutMs = 15000 } = args;
  const seatMap = await fetchMegaboxSeatMap(playSchdlNo, timeoutMs);

  if (!seatMap) {
    throw new Error('메가박스 좌석맵을 찾을 수 없습니다.');
  }

  return createJsonTextResponse({
    playSchdlNo,
    seatMap,
  });
}

export function createGetSeatMapTool(): ToolRegistration {
  return createTool<GetSeatMapArgs>({
    name: 'megabox_get_seat_map',
    title: '메가박스 좌석맵 조회',
    description: '회차 ID(playSchdlNo) 기준으로 메가박스 read-only 좌석맵을 조회합니다.',
    inputSchema: {
      playSchdlNo: z.string().min(1).describe('메가박스 회차 ID (예: 2603101372011)'),
      timeoutMs: z
        .number()
        .optional()
        .default(15000)
        .describe('요청 제한 시간(ms, 기본값: 15000)'),
    },
    handler: getSeatMap,
  });
}
