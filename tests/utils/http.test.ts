/**
 * HTTP 유틸리티 테스트
 */

import { describe, expect, it } from 'vitest';
import { parseJsonResponse, rethrowAsTimeout, throwIfResponseNotOk } from '../../src/utils/http.js';

describe('throwIfResponseNotOk', () => {
  it('성공 응답은 통과시킨다', () => {
    expect(() =>
      throwIfResponseNotOk(new Response('ok', { status: 200 }), '테스트 실패'),
    ).not.toThrow();
  });

  it('실패 응답은 커스텀 메시지로 예외를 던진다', () => {
    expect(() =>
      throwIfResponseNotOk(new Response('fail', { status: 404 }), '테스트 실패'),
    ).toThrow('테스트 실패: 404');
  });
});

describe('parseJsonResponse', () => {
  it('JSON 본문을 파싱한다', async () => {
    const result = await parseJsonResponse<{ ok: boolean }>(
      new Response(JSON.stringify({ ok: true })),
    );

    expect(result).toEqual({ ok: true });
  });

  it('JSON이 아니면 응답 본문으로 에러를 던진다', async () => {
    await expect(
      parseJsonResponse(new Response('<html>not-json</html>'), 'fallback'),
    ).rejects.toThrow('<html>not-json</html>');
  });

  it('본문이 비어 있으면 fallback 메시지를 사용한다', async () => {
    await expect(parseJsonResponse(new Response(''), 'fallback')).rejects.toThrow('fallback');
  });
});

describe('rethrowAsTimeout', () => {
  it('AbortError를 시간 초과 에러로 변환한다', () => {
    expect(() => rethrowAsTimeout(new DOMException('aborted', 'AbortError'), '시간 초과')).toThrow(
      '시간 초과',
    );
  });

  it('다른 에러는 그대로 통과시킨다', () => {
    expect(() => rethrowAsTimeout(new Error('other'), '시간 초과')).not.toThrow();
  });
});
