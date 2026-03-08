/**
 * 통합 검색 continuation cursor validator
 */

import type {
  UnifiedSearchContinuationCursorPayload,
} from './cursor.js';
import { decodeUnifiedSearchCursor, UnifiedSearchCursorError } from './cursor.js';
import type {
  UnifiedSearchEntityType,
  UnifiedSearchQuery,
  UnifiedSearchServiceId,
} from './interfaces.js';

type UnifiedSearchCursorValidationErrorCode =
  | 'INVALID_CURSOR'
  | 'CURSOR_SCOPE_NOT_SUPPORTED'
  | 'CURSOR_QUERY_MISMATCH'
  | 'CURSOR_NOT_IMPLEMENTED';

const BUCKET_TO_TYPE = {
  products: 'product',
  stores: 'store',
  movies: 'movie',
  theaters: 'theater',
} as const satisfies Record<string, UnifiedSearchEntityType>;

export interface UnifiedSearchCursorValidationInput {
  query?: string;
  services?: UnifiedSearchServiceId[];
  types?: UnifiedSearchEntityType[];
  limitPerService?: number;
  latitude?: number;
  longitude?: number;
  cursor?: string;
}

export interface UnifiedSearchCursorValidationResult
{
  query?: string;
  services?: UnifiedSearchServiceId[];
  types?: UnifiedSearchEntityType[];
  limitPerService?: number;
  latitude?: number;
  longitude?: number;
  continuation?: UnifiedSearchContinuationCursorPayload;
}

export class UnifiedSearchCursorValidationError extends Error {
  constructor(
    readonly code: UnifiedSearchCursorValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'UnifiedSearchCursorValidationError';
  }
}

function isSameArray<T>(left: T[] | undefined, right: T[]): boolean {
  if (!left) {
    return true;
  }

  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function isSameValue<T>(left: T | undefined, right: T | undefined): boolean {
  if (left === undefined) {
    return true;
  }

  return left === right;
}

function hasUnsupportedScopedCursorValues(values: string[] | undefined): boolean {
  return values !== undefined && values.length !== 1;
}

function getCursorLocation(
  cursor: UnifiedSearchContinuationCursorPayload,
): Pick<UnifiedSearchQuery, 'latitude' | 'longitude'> {
  if ('latitude' in cursor && 'longitude' in cursor) {
    return {
      latitude: cursor.latitude,
      longitude: cursor.longitude,
    };
  }

  return {};
}

function isImplementedContinuationCursor(
  cursor: UnifiedSearchContinuationCursorPayload,
): boolean {
  return cursor.service === 'daiso' && cursor.bucket === 'products';
}

export function validateUnifiedSearchCursorInput(
  input: UnifiedSearchCursorValidationInput,
): UnifiedSearchCursorValidationResult {
  if (!input.cursor) {
    return {
      query: input.query,
      services: input.services,
      types: input.types,
      latitude: input.latitude,
      longitude: input.longitude,
      limitPerService: input.limitPerService,
    };
  }

  let cursor: UnifiedSearchContinuationCursorPayload;

  try {
    cursor = decodeUnifiedSearchCursor(input.cursor);
  } catch (error) {
    if (error instanceof UnifiedSearchCursorError) {
      throw new UnifiedSearchCursorValidationError(error.code, error.message);
    }

    throw error;
  }

  const cursorServices: UnifiedSearchServiceId[] = [cursor.service];
  const cursorTypes: UnifiedSearchEntityType[] = [BUCKET_TO_TYPE[cursor.bucket]];
  const cursorLocation = getCursorLocation(cursor);

  if (
    hasUnsupportedScopedCursorValues(input.services) ||
    hasUnsupportedScopedCursorValues(input.types)
  ) {
    throw new UnifiedSearchCursorValidationError(
      'CURSOR_SCOPE_NOT_SUPPORTED',
      'continuation cursor는 서비스 1개와 타입 1개 요청에서만 사용할 수 있습니다.',
    );
  }

  if (
    !isSameValue(input.query, cursor.query) ||
    !isSameArray(input.services, cursorServices) ||
    !isSameArray(input.types, cursorTypes) ||
    !isSameValue(input.limitPerService, cursor.limitPerService) ||
    !isSameValue(input.latitude, cursorLocation.latitude) ||
    !isSameValue(input.longitude, cursorLocation.longitude)
  ) {
    throw new UnifiedSearchCursorValidationError(
      'CURSOR_QUERY_MISMATCH',
      'cursor와 요청 파라미터가 일치하지 않습니다.',
    );
  }

  const validatedQuery: UnifiedSearchCursorValidationResult = {
    query: input.query ?? cursor.query,
    services: input.services ?? cursorServices,
    types: input.types ?? cursorTypes,
    limitPerService: input.limitPerService ?? cursor.limitPerService,
    latitude: input.latitude ?? cursorLocation.latitude,
    longitude: input.longitude ?? cursorLocation.longitude,
  };

  if (isImplementedContinuationCursor(cursor)) {
    return {
      ...validatedQuery,
      continuation: cursor,
    };
  }

  throw new UnifiedSearchCursorValidationError(
    'CURSOR_NOT_IMPLEMENTED',
    'continuation cursor는 아직 구현되지 않았습니다.',
  );
}
