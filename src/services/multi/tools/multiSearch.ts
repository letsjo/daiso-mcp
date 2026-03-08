/**
 * 통합 검색 MCP 도구
 */

import * as z from 'zod';
import type { McpToolResponse, ToolRegistration } from '../../../core/types.js';
import { createJsonTextResponse, createTool } from '../../../core/toolBuilder.js';
import {
  LIMIT_PER_SERVICE_ERROR_MESSAGE,
  MAX_LIMIT_PER_SERVICE,
  MAX_TIMEOUT_MS,
  SUPPORTED_UNIFIED_SEARCH_SERVICES,
  SUPPORTED_UNIFIED_SEARCH_TYPES,
  TIMEOUT_MS_ERROR_MESSAGE,
} from '../../../unified-search/constants.js';
import { createUnifiedSearchAggregator } from '../../../unified-search/createAggregator.js';
import {
  validateUnifiedSearchCursorInput,
} from '../../../unified-search/cursorValidator.js';
import type {
  UnifiedSearchQuery,
  UnifiedSearchEntityType,
  UnifiedSearchServiceId,
} from '../../../unified-search/interfaces.js';

interface MultiSearchArgs {
  query: string;
  services?: UnifiedSearchServiceId[];
  types?: UnifiedSearchEntityType[];
  latitude?: number;
  longitude?: number;
  limitPerService?: number;
  timeoutMs?: number;
  cursor?: string;
}

function validatePositiveInteger(
  value: number | undefined,
  fieldName: 'limitPerService' | 'timeoutMs',
): void {
  const maxValue =
    fieldName === 'limitPerService' ? MAX_LIMIT_PER_SERVICE : MAX_TIMEOUT_MS;

  if (value !== undefined && (value < 1 || value > maxValue)) {
    throw new Error(
      fieldName === 'limitPerService'
        ? LIMIT_PER_SERVICE_ERROR_MESSAGE
        : TIMEOUT_MS_ERROR_MESSAGE,
    );
  }
}

async function multiSearch(
  args: MultiSearchArgs,
  zyteApiKey?: string,
): Promise<McpToolResponse> {
  const {
    query,
    services,
    types,
    latitude,
    longitude,
    limitPerService,
    timeoutMs,
    cursor,
  } = args;

  validatePositiveInteger(limitPerService, 'limitPerService');
  validatePositiveInteger(timeoutMs, 'timeoutMs');

  const validatedQuery = validateUnifiedSearchCursorInput({
    query,
    services,
    types,
    latitude,
    longitude,
    limitPerService,
    cursor,
  });

  if (!validatedQuery.query || validatedQuery.query.trim().length === 0) {
    throw new Error('검색어를 입력해주세요.');
  }

  const aggregator = createUnifiedSearchAggregator({ zyteApiKey });
  const result = await aggregator.search({
    query: validatedQuery.query,
    services: validatedQuery.services,
    types: validatedQuery.types,
    latitude: validatedQuery.latitude,
    longitude: validatedQuery.longitude,
    limitPerService: validatedQuery.limitPerService,
    timeoutMs,
  } satisfies UnifiedSearchQuery);

  return createJsonTextResponse(result);
}

export function createMultiSearchTool(zyteApiKey?: string): ToolRegistration {
  return createTool<MultiSearchArgs>({
    name: 'multi_search',
    title: '통합 검색',
    description:
      '다이소, 올리브영, 메가박스, CGV를 한 번에 조회하는 통합 검색 도구입니다.',
    inputSchema: {
      query: z.string().describe('공통 검색어'),
      services: z
        .array(z.enum(SUPPORTED_UNIFIED_SEARCH_SERVICES))
        .optional()
        .describe('조회할 서비스 목록 (생략 시 전체)'),
      types: z
        .array(z.enum(SUPPORTED_UNIFIED_SEARCH_TYPES))
        .optional()
        .describe('조회할 결과 타입 목록 (생략 시 전체)'),
      latitude: z.number().optional().describe('위도'),
      longitude: z.number().optional().describe('경도'),
      limitPerService: z
        .number()
        .int()
        .positive()
        .max(MAX_LIMIT_PER_SERVICE)
        .optional()
        .describe('서비스별 최대 결과 수 (기본값: 5, 최대: 50)'),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .max(MAX_TIMEOUT_MS)
        .optional()
        .describe('서비스 fan-out 요청 시간 제한 (밀리초, 기본값: 15000, 최대: 30000)'),
      cursor: z
        .string()
        .optional()
        .describe('continuation pilot cursor (현재는 validator만 연결되고 실제 조회는 미구현)'),
    },
    handler: (args) => multiSearch(args, zyteApiKey),
  });
}
