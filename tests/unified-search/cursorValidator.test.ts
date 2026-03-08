import { afterEach, describe, expect, it, vi } from 'vitest';
import * as cursorModule from '../../src/unified-search/cursor.js';
import { encodeUnifiedSearchCursor } from '../../src/unified-search/cursor.js';
import {
  UnifiedSearchCursorValidationError,
  validateUnifiedSearchCursorInput,
} from '../../src/unified-search/cursorValidator.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('unified-search cursor validator', () => {
  it('cursor가 없으면 입력값을 그대로 반환한다', () => {
    expect(
      validateUnifiedSearchCursorInput({
        query: '정리함',
        services: ['daiso'],
        types: ['product'],
        limitPerService: 5,
      }),
    ).toEqual({
      query: '정리함',
      services: ['daiso'],
      types: ['product'],
      limitPerService: 5,
      latitude: undefined,
      longitude: undefined,
    });
  });

  it('구현된 daiso products cursor는 실제 조회용 continuation을 반환한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: 1,
      service: 'daiso',
      bucket: 'products',
      query: '정리함',
      limitPerService: 5,
      page: 2,
    });

    expect(
      validateUnifiedSearchCursorInput({
        cursor,
      }),
    ).toEqual({
      query: '정리함',
      services: ['daiso'],
      types: ['product'],
      limitPerService: 5,
      latitude: undefined,
      longitude: undefined,
      continuation: {
        v: 1,
        service: 'daiso',
        bucket: 'products',
        query: '정리함',
        limitPerService: 5,
        page: 2,
      },
    });
  });

  it('cursor와 query가 다르면 CURSOR_QUERY_MISMATCH를 반환한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: 1,
      service: 'daiso',
      bucket: 'products',
      query: '정리함',
      limitPerService: 5,
      page: 2,
    });

    expect(() =>
      validateUnifiedSearchCursorInput({
        cursor,
        query: '다른검색어',
      }),
    ).toThrowError(
      new UnifiedSearchCursorValidationError(
        'CURSOR_QUERY_MISMATCH',
        'cursor와 요청 파라미터가 일치하지 않습니다.',
      ),
    );
  });

  it('cursor와 services/types가 다르면 CURSOR_QUERY_MISMATCH를 반환한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: 1,
      service: 'daiso',
      bucket: 'products',
      query: '정리함',
      limitPerService: 5,
      page: 2,
    });

    expect(() =>
      validateUnifiedSearchCursorInput({
        cursor,
        services: ['oliveyoung'],
        types: ['product'],
      }),
    ).toThrowError(
      new UnifiedSearchCursorValidationError(
        'CURSOR_QUERY_MISMATCH',
        'cursor와 요청 파라미터가 일치하지 않습니다.',
      ),
    );
  });

  it('multi-service 또는 multi-type cursor 요청은 CURSOR_SCOPE_NOT_SUPPORTED를 반환한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: 1,
      service: 'daiso',
      bucket: 'products',
      query: '정리함',
      limitPerService: 5,
      page: 2,
    });

    expect(() =>
      validateUnifiedSearchCursorInput({
        cursor,
        services: ['daiso', 'oliveyoung'],
      }),
    ).toThrowError(
      new UnifiedSearchCursorValidationError(
        'CURSOR_SCOPE_NOT_SUPPORTED',
        'continuation cursor는 서비스 1개와 타입 1개 요청에서만 사용할 수 있습니다.',
      ),
    );
  });

  it('oliveyoung stores cursor는 위치가 맞아야 한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: 1,
      service: 'oliveyoung',
      bucket: 'stores',
      query: '강남',
      limitPerService: 5,
      pageIdx: 2,
      latitude: 37.498,
      longitude: 127.027,
    });

    expect(() =>
      validateUnifiedSearchCursorInput({
        cursor,
        latitude: 37.5,
        longitude: 127.027,
      }),
    ).toThrowError(
      new UnifiedSearchCursorValidationError(
        'CURSOR_QUERY_MISMATCH',
        'cursor와 요청 파라미터가 일치하지 않습니다.',
      ),
    );
  });

  it('미구현 oliveyoung cursor는 CURSOR_NOT_IMPLEMENTED를 반환한다', () => {
    const cursor = encodeUnifiedSearchCursor({
      v: 1,
      service: 'oliveyoung',
      bucket: 'products',
      query: '선크림',
      limitPerService: 5,
      page: 2,
    });

    expect(() =>
      validateUnifiedSearchCursorInput({
        cursor,
      }),
    ).toThrowError(
      new UnifiedSearchCursorValidationError(
        'CURSOR_NOT_IMPLEMENTED',
        'continuation cursor는 아직 구현되지 않았습니다.',
      ),
    );
  });

  it('invalid cursor 오류를 그대로 매핑한다', () => {
    expect(() =>
      validateUnifiedSearchCursorInput({
        cursor: '%%%invalid',
      }),
    ).toThrowError(
      new UnifiedSearchCursorValidationError(
        'INVALID_CURSOR',
        'cursor를 디코딩할 수 없습니다.',
      ),
    );
  });

  it('예상하지 못한 decode 오류는 그대로 다시 던진다', () => {
    vi.spyOn(cursorModule, 'decodeUnifiedSearchCursor').mockImplementation(() => {
      throw new Error('unexpected decode failure');
    });

    expect(() =>
      validateUnifiedSearchCursorInput({
        cursor: 'opaque-token',
      }),
    ).toThrow('unexpected decode failure');
  });
});
