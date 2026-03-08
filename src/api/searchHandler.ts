/**
 * 통합 검색 GET API 핸들러
 */

import type { UnifiedSearchEntityType, UnifiedSearchServiceId } from '../unified-search/interfaces.js';
import { createUnifiedSearchAggregator } from '../unified-search/createAggregator.js';
import { type ApiContext, errorResponse } from './response.js';

const ALLOWED_SERVICES: UnifiedSearchServiceId[] = ['daiso', 'oliveyoung', 'megabox', 'cgv'];
const ALLOWED_TYPES: UnifiedSearchEntityType[] = ['product', 'store', 'movie', 'theater'];

function parseCsvValues<T extends string>(
  rawValue: string | undefined,
  allowedValues: readonly T[],
): { values?: T[]; invalidValues: string[] } {
  if (!rawValue) {
    return { invalidValues: [] };
  }

  const values = rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedSet = new Set(allowedValues);
  const invalidValues = values.filter((value) => !allowedSet.has(value as T));

  return {
    values: values as T[],
    invalidValues,
  };
}

function parsePositiveInteger(rawValue: string | undefined, defaultValue: number): number | null {
  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function parseCoordinate(rawValue: string | undefined): number | null | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function handleUnifiedSearch(c: ApiContext) {
  const query = c.req.query('q');

  if (!query || query.trim().length === 0) {
    return errorResponse(c, 'MISSING_QUERY', '검색어(q)를 입력해주세요.');
  }

  const services = parseCsvValues(c.req.query('services'), ALLOWED_SERVICES);
  if (services.invalidValues.length > 0) {
    return errorResponse(
      c,
      'INVALID_SERVICES',
      `지원하지 않는 서비스입니다: ${services.invalidValues.join(', ')}`,
    );
  }

  const types = parseCsvValues(c.req.query('types'), ALLOWED_TYPES);
  if (types.invalidValues.length > 0) {
    return errorResponse(
      c,
      'INVALID_TYPES',
      `지원하지 않는 검색 타입입니다: ${types.invalidValues.join(', ')}`,
    );
  }

  const limitPerService = parsePositiveInteger(c.req.query('limitPerService'), 5);
  if (limitPerService === null) {
    return errorResponse(c, 'INVALID_LIMIT', 'limitPerService는 1 이상의 정수여야 합니다.');
  }

  const timeoutMs = parsePositiveInteger(c.req.query('timeoutMs'), 15000);
  if (timeoutMs === null) {
    return errorResponse(c, 'INVALID_TIMEOUT', 'timeoutMs는 1 이상의 정수여야 합니다.');
  }

  const latitude = parseCoordinate(c.req.query('lat'));
  const longitude = parseCoordinate(c.req.query('lng'));

  if (latitude === null || longitude === null) {
    return errorResponse(c, 'INVALID_LOCATION', 'lat, lng는 유효한 숫자여야 합니다.');
  }

  const aggregator = createUnifiedSearchAggregator(c.env);
  const result = await aggregator.search({
    query,
    services: services.values,
    types: types.values,
    latitude,
    longitude,
    limitPerService,
    timeoutMs,
  });

  return c.json(result);
}
