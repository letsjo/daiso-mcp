/**
 * 통합 검색 GET API 핸들러
 */

import {
  DEFAULT_LIMIT_PER_SERVICE,
  DEFAULT_TIMEOUT_MS,
  LIMIT_PER_SERVICE_ERROR_MESSAGE,
  MAX_LIMIT_PER_SERVICE,
  MAX_TIMEOUT_MS,
  SUPPORTED_UNIFIED_SEARCH_SERVICES,
  SUPPORTED_UNIFIED_SEARCH_TYPES,
  TIMEOUT_MS_ERROR_MESSAGE,
} from '../unified-search/constants.js';
import { createUnifiedSearchAggregator } from '../unified-search/createAggregator.js';
import {
  UnifiedSearchCursorValidationError,
  validateUnifiedSearchCursorInput,
} from '../unified-search/cursorValidator.js';
import { type ApiContext, errorResponse } from './response.js';

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

function parseBoundedInteger(
  rawValue: string | undefined,
  defaultValue: number,
  maxValue: number,
): number | null {
  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > maxValue) {
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
  const services = parseCsvValues(c.req.query('services'), SUPPORTED_UNIFIED_SEARCH_SERVICES);
  if (services.invalidValues.length > 0) {
    return errorResponse(
      c,
      'INVALID_SERVICES',
      `지원하지 않는 서비스입니다: ${services.invalidValues.join(', ')}`,
    );
  }

  const types = parseCsvValues(c.req.query('types'), SUPPORTED_UNIFIED_SEARCH_TYPES);
  if (types.invalidValues.length > 0) {
    return errorResponse(
      c,
      'INVALID_TYPES',
      `지원하지 않는 검색 타입입니다: ${types.invalidValues.join(', ')}`,
    );
  }

  const limitPerService = parseBoundedInteger(
    c.req.query('limitPerService'),
    DEFAULT_LIMIT_PER_SERVICE,
    MAX_LIMIT_PER_SERVICE,
  );
  if (limitPerService === null) {
    return errorResponse(c, 'INVALID_LIMIT', LIMIT_PER_SERVICE_ERROR_MESSAGE);
  }

  const timeoutMs = parseBoundedInteger(
    c.req.query('timeoutMs'),
    DEFAULT_TIMEOUT_MS,
    MAX_TIMEOUT_MS,
  );
  if (timeoutMs === null) {
    return errorResponse(c, 'INVALID_TIMEOUT', TIMEOUT_MS_ERROR_MESSAGE);
  }

  const latitude = parseCoordinate(c.req.query('lat'));
  const longitude = parseCoordinate(c.req.query('lng'));

  if (latitude === null || longitude === null) {
    return errorResponse(c, 'INVALID_LOCATION', 'lat, lng는 유효한 숫자여야 합니다.');
  }

  let validatedQuery;

  try {
    validatedQuery = validateUnifiedSearchCursorInput({
      query: c.req.query('q'),
      services: services.values,
      types: types.values,
      limitPerService,
      latitude,
      longitude,
      cursor: c.req.query('cursor'),
    });
  } catch (error) {
    if (error instanceof UnifiedSearchCursorValidationError) {
      return errorResponse(c, error.code, error.message);
    }

    throw error;
  }

  if (!validatedQuery.query || validatedQuery.query.trim().length === 0) {
    return errorResponse(c, 'MISSING_QUERY', '검색어(q)를 입력해주세요.');
  }

  const aggregator = createUnifiedSearchAggregator({
    zyteApiKey: c.env?.ZYTE_API_KEY,
  });
  const result = await aggregator.search({
    query: validatedQuery.query,
    services: validatedQuery.services,
    types: validatedQuery.types,
    latitude: validatedQuery.latitude,
    longitude: validatedQuery.longitude,
    limitPerService: validatedQuery.limitPerService,
    timeoutMs,
    continuation: validatedQuery.continuation,
  });

  return c.json(result);
}
