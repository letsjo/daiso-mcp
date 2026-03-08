/**
 * 통합 검색 MCP 도구
 */

import * as z from 'zod';
import type { McpToolResponse, ToolRegistration } from '../../../core/types.js';
import { createJsonTextResponse, createTool } from '../../../core/toolBuilder.js';
import { createUnifiedSearchAggregator } from '../../../unified-search/createAggregator.js';
import type {
  UnifiedSearchEntityType,
  UnifiedSearchQuery,
  UnifiedSearchServiceId,
} from '../../../unified-search/interfaces.js';

const SUPPORTED_SERVICES: [UnifiedSearchServiceId, ...UnifiedSearchServiceId[]] = [
  'daiso',
  'oliveyoung',
  'megabox',
  'cgv',
];
const SUPPORTED_TYPES: [UnifiedSearchEntityType, ...UnifiedSearchEntityType[]] = [
  'product',
  'store',
  'movie',
  'theater',
];

interface MultiSearchArgs {
  query: string;
  services?: UnifiedSearchServiceId[];
  types?: UnifiedSearchEntityType[];
  latitude?: number;
  longitude?: number;
  limitPerService?: number;
  timeoutMs?: number;
}

function validatePositiveInteger(
  value: number | undefined,
  fieldName: 'limitPerService' | 'timeoutMs',
): void {
  if (value !== undefined && value < 1) {
    throw new Error(`${fieldName}는 1 이상의 정수여야 합니다.`);
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
  } = args;

  if (!query || query.trim().length === 0) {
    throw new Error('검색어를 입력해주세요.');
  }

  validatePositiveInteger(limitPerService, 'limitPerService');
  validatePositiveInteger(timeoutMs, 'timeoutMs');

  const aggregator = createUnifiedSearchAggregator({ zyteApiKey });
  const result = await aggregator.search({
    query,
    services,
    types,
    latitude,
    longitude,
    limitPerService,
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
        .array(z.enum(SUPPORTED_SERVICES))
        .optional()
        .describe('조회할 서비스 목록 (생략 시 전체)'),
      types: z
        .array(z.enum(SUPPORTED_TYPES))
        .optional()
        .describe('조회할 결과 타입 목록 (생략 시 전체)'),
      latitude: z.number().optional().describe('위도'),
      longitude: z.number().optional().describe('경도'),
      limitPerService: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('서비스별 최대 결과 수 (기본값: 5)'),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('서비스 fan-out 요청 시간 제한 (밀리초, 기본값: 15000)'),
    },
    handler: (args) => multiSearch(args, zyteApiKey),
  });
}
