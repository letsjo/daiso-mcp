/**
 * 통합 검색 공통 상수
 */

import type { UnifiedSearchEntityType, UnifiedSearchServiceId } from './interfaces.js';

export const DEFAULT_LIMIT_PER_SERVICE = 5;
export const MAX_LIMIT_PER_SERVICE = 50;
export const DEFAULT_TIMEOUT_MS = 15000;
export const MAX_TIMEOUT_MS = 30000;

export const LIMIT_PER_SERVICE_ERROR_MESSAGE = `limitPerService는 1 이상 ${MAX_LIMIT_PER_SERVICE} 이하의 정수여야 합니다.`;
export const TIMEOUT_MS_ERROR_MESSAGE = `timeoutMs는 1 이상 ${MAX_TIMEOUT_MS} 이하의 정수여야 합니다.`;

export const SUPPORTED_UNIFIED_SEARCH_SERVICES = [
  'daiso',
  'oliveyoung',
  'megabox',
  'cgv',
] as const satisfies readonly UnifiedSearchServiceId[];

export const SUPPORTED_UNIFIED_SEARCH_TYPES = [
  'product',
  'store',
  'movie',
  'theater',
] as const satisfies readonly UnifiedSearchEntityType[];

export const ALL_ENTITY_TYPES: UnifiedSearchEntityType[] = [...SUPPORTED_UNIFIED_SEARCH_TYPES];
