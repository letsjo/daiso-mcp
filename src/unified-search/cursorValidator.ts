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

  throw new UnifiedSearchCursorValidationError(
    'CURSOR_NOT_IMPLEMENTED',
    'continuation cursor는 아직 구현되지 않았습니다.',
  );
}
