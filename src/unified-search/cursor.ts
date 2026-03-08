/**
 * 통합 검색 continuation cursor 유틸
 */

import * as z from 'zod';
import { MAX_LIMIT_PER_SERVICE } from './constants.js';
import type { UnifiedSearchBucketKey, UnifiedSearchServiceId } from './interfaces.js';

export const UNIFIED_SEARCH_CURSOR_VERSION = 1;
const DEFAULT_OLIVEYOUNG_STORES_PAGE_SIZE = 20;

type UnifiedSearchCursorErrorCode = 'INVALID_CURSOR' | 'CURSOR_SCOPE_NOT_SUPPORTED';

const CURSOR_SCOPE_SCHEMA = z.object({
  v: z.number(),
  service: z.enum(['daiso', 'oliveyoung', 'megabox', 'cgv']),
  bucket: z.enum(['products', 'stores', 'movies', 'theaters']),
});

const DAISO_PRODUCTS_CURSOR_SCHEMA = z.object({
  v: z.literal(UNIFIED_SEARCH_CURSOR_VERSION),
  service: z.literal('daiso'),
  bucket: z.literal('products'),
  query: z.string().min(1),
  limitPerService: z.number().int().min(1).max(MAX_LIMIT_PER_SERVICE),
  page: z.number().int().min(2),
});

const OLIVEYOUNG_PRODUCTS_CURSOR_SCHEMA = z.object({
  v: z.literal(UNIFIED_SEARCH_CURSOR_VERSION),
  service: z.literal('oliveyoung'),
  bucket: z.literal('products'),
  query: z.string().min(1),
  limitPerService: z.number().int().min(1).max(MAX_LIMIT_PER_SERVICE),
  page: z.number().int().min(2),
});

const OLIVEYOUNG_STORES_CURSOR_SCHEMA = z.object({
  v: z.literal(UNIFIED_SEARCH_CURSOR_VERSION),
  service: z.literal('oliveyoung'),
  bucket: z.literal('stores'),
  query: z.string().min(1),
  limitPerService: z.number().int().min(1).max(MAX_LIMIT_PER_SERVICE),
  pageIdx: z.number().int().min(1),
  offset: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).default(DEFAULT_OLIVEYOUNG_STORES_PAGE_SIZE),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
});

const PILOT_CURSOR_SCHEMA = z.union([
  DAISO_PRODUCTS_CURSOR_SCHEMA,
  OLIVEYOUNG_PRODUCTS_CURSOR_SCHEMA,
  OLIVEYOUNG_STORES_CURSOR_SCHEMA,
]);

export type UnifiedSearchContinuationCursorPayload = z.infer<
  typeof PILOT_CURSOR_SCHEMA
>;

export class UnifiedSearchCursorError extends Error {
  constructor(
    readonly code: UnifiedSearchCursorErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'UnifiedSearchCursorError';
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(`${normalized}${padding}`);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function isPilotContinuationScope(
  service: UnifiedSearchServiceId,
  bucket: UnifiedSearchBucketKey,
): boolean {
  return (
    (service === 'daiso' && bucket === 'products') ||
    (service === 'oliveyoung' &&
      (bucket === 'products' || bucket === 'stores'))
  );
}

export function encodeUnifiedSearchCursor(
  payload: UnifiedSearchContinuationCursorPayload,
): string {
  const parsed = PILOT_CURSOR_SCHEMA.safeParse(payload);

  if (!parsed.success) {
    throw new UnifiedSearchCursorError(
      'INVALID_CURSOR',
      '지원하지 않는 continuation cursor payload입니다.',
    );
  }

  const json = JSON.stringify(parsed.data);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeUnifiedSearchCursor(
  cursor: string,
): UnifiedSearchContinuationCursorPayload {
  let rawValue: unknown;

  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(cursor));
    rawValue = JSON.parse(decoded);
  } catch {
    throw new UnifiedSearchCursorError(
      'INVALID_CURSOR',
      'cursor를 디코딩할 수 없습니다.',
    );
  }

  const scope = CURSOR_SCOPE_SCHEMA.safeParse(rawValue);

  if (!scope.success) {
    throw new UnifiedSearchCursorError(
      'INVALID_CURSOR',
      'cursor payload 형식이 올바르지 않습니다.',
    );
  }

  if (!isPilotContinuationScope(scope.data.service, scope.data.bucket)) {
    throw new UnifiedSearchCursorError(
      'CURSOR_SCOPE_NOT_SUPPORTED',
      `continuation pilot 미지원 범위입니다: ${scope.data.service}.${scope.data.bucket}`,
    );
  }

  const parsed = PILOT_CURSOR_SCHEMA.safeParse(rawValue);

  if (!parsed.success) {
    throw new UnifiedSearchCursorError(
      'INVALID_CURSOR',
      'cursor payload 검증에 실패했습니다.',
    );
  }

  return parsed.data;
}
