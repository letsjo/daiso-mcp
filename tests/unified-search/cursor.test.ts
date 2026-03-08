import { describe, expect, it } from 'vitest';
import {
  decodeUnifiedSearchCursor,
  encodeUnifiedSearchCursor,
  isPilotContinuationScope,
  UnifiedSearchCursorError,
  UNIFIED_SEARCH_CURSOR_VERSION,
} from '../../src/unified-search/cursor.js';

function toCursor(payload: unknown): string {
  const json = JSON.stringify(payload);
  let binary = '';

  for (const byte of new TextEncoder().encode(json)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '');
}

describe('unified-search cursor', () => {
  it('daiso products cursor를 round-trip 한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: UNIFIED_SEARCH_CURSOR_VERSION,
      service: 'daiso',
      bucket: 'products',
      query: '정리함',
      limitPerService: 5,
      page: 2,
    });

    expect(decodeUnifiedSearchCursor(cursor)).toEqual({
      v: 1,
      service: 'daiso',
      bucket: 'products',
      query: '정리함',
      limitPerService: 5,
      page: 2,
    });
  });

  it('oliveyoung stores cursor를 round-trip 한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: UNIFIED_SEARCH_CURSOR_VERSION,
      service: 'oliveyoung',
      bucket: 'stores',
      query: '강남',
      limitPerService: 5,
      pageIdx: 2,
      latitude: 37.498,
      longitude: 127.027,
    });

    expect(decodeUnifiedSearchCursor(cursor)).toEqual({
      v: 1,
      service: 'oliveyoung',
      bucket: 'stores',
      query: '강남',
      limitPerService: 5,
      pageIdx: 2,
      latitude: 37.498,
      longitude: 127.027,
    });
  });

  it('pilot continuation scope를 판별한다', () => {
    expect(isPilotContinuationScope('daiso', 'products')).toBe(true);
    expect(isPilotContinuationScope('oliveyoung', 'stores')).toBe(true);
    expect(isPilotContinuationScope('cgv', 'movies')).toBe(false);
  });

  it('지원하지 않는 payload는 encode 단계에서 거부한다', () => {
    expect(() =>
      encodeUnifiedSearchCursor({
        v: 1,
        service: 'daiso',
        bucket: 'products',
        query: '정리함',
        limitPerService: 51,
        page: 2,
      } as never),
    ).toThrowError(
      new UnifiedSearchCursorError(
        'INVALID_CURSOR',
        '지원하지 않는 continuation cursor payload입니다.',
      ),
    );
  });

  it('잘못된 문자열은 INVALID_CURSOR를 반환한다', () => {
    expect(() => decodeUnifiedSearchCursor('%%%')).toThrowError(
      new UnifiedSearchCursorError(
        'INVALID_CURSOR',
        'cursor를 디코딩할 수 없습니다.',
      ),
    );
  });

  it('JSON shape가 맞지 않으면 INVALID_CURSOR를 반환한다', () => {
    expect(() => decodeUnifiedSearchCursor(toCursor({ hello: 'world' }))).toThrowError(
      new UnifiedSearchCursorError(
        'INVALID_CURSOR',
        'cursor payload 형식이 올바르지 않습니다.',
      ),
    );
  });

  it('pilot 미지원 scope는 CURSOR_SCOPE_NOT_SUPPORTED를 반환한다', () => {
    expect(() =>
      decodeUnifiedSearchCursor(
        toCursor({
          v: 1,
          service: 'cgv',
          bucket: 'movies',
          query: '영화A',
          limitPerService: 5,
          page: 2,
        }),
      ),
    ).toThrowError(
      new UnifiedSearchCursorError(
        'CURSOR_SCOPE_NOT_SUPPORTED',
        'continuation pilot 미지원 범위입니다: cgv.movies',
      ),
    );
  });

  it('pilot scope라도 세부 payload가 틀리면 INVALID_CURSOR를 반환한다', () => {
    expect(() =>
      decodeUnifiedSearchCursor(
        toCursor({
          v: 1,
          service: 'oliveyoung',
          bucket: 'stores',
          query: '강남',
          limitPerService: 5,
          pageIdx: 2,
        }),
      ),
    ).toThrowError(
      new UnifiedSearchCursorError(
        'INVALID_CURSOR',
        'cursor payload 검증에 실패했습니다.',
      ),
    );
  });
});
