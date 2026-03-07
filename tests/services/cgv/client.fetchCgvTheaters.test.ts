/**
 * CGV 극장 조회 클라이언트 테스트
 */

import { describe, expect, it } from 'vitest';
import { fetchCgvTheaters } from '../../../src/services/cgv/client.js';
import { setupMockFetch } from './clientTestSupport.js';

const mockFetch = setupMockFetch();

describe('fetchCgvTheaters', () => {
  it('극장 목록을 정규화한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              regnGrpCd: '01',
              regnGrpNm: '서울',
              siteList: [
                { siteNo: '0056', siteNm: '강남' },
                { siteNo: '0001', siteNm: '강변' },
              ],
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTheaters({ playDate: '20260304', regionCode: '01' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ theaterCode: '0056', theaterName: '강남', regionCode: '01' });
  });

  it('403이면 Zyte fallback을 사용한다', async () => {
    const zyteBody = Buffer.from(
      JSON.stringify({
        statusCode: 0,
        statusMessage: '조회 되었습니다.',
        data: [
          {
            regnGrpCd: '01',
            regnGrpNm: '서울',
            siteList: [{ siteNo: '0056', siteNm: '강남' }],
          },
        ],
      }),
      'utf8',
    ).toString('base64');

    mockFetch
      .mockResolvedValueOnce(new Response('forbidden', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 200,
            httpResponseBody: zyteBody,
          }),
        ),
      );

    const result = await fetchCgvTheaters({ zyteApiKey: 'test-key' });

    expect(result).toHaveLength(1);
    expect(result[0].theaterCode).toBe('0056');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('HTTP 에러를 처리한다', async () => {
    mockFetch.mockResolvedValue(new Response('fail', { status: 500 }));

    await expect(fetchCgvTheaters({})).rejects.toThrow('CGV API 호출 실패: 500');
  });

  it('JSON 파싱 실패를 처리한다', async () => {
    mockFetch.mockResolvedValue(new Response('<html>not-json</html>', { status: 200 }));

    await expect(fetchCgvTheaters({})).rejects.toThrow('not-json');
  });

  it('AbortError를 시간 초과 에러로 변환한다', async () => {
    mockFetch.mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await expect(fetchCgvTheaters({})).rejects.toThrow('CGV API 요청 시간 초과');
  });

  it('응답 필드 누락 시 빈 배열을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          data: [
            {
              siteList: [{}],
            },
            {},
          ],
        }),
      ),
    );

    const result = await fetchCgvTheaters({});
    expect(result).toEqual([]);
  });

  it('data가 없으면 빈 배열을 반환한다', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ statusCode: 0 })));

    const result = await fetchCgvTheaters({});
    expect(result).toEqual([]);
  });

  it('Zyte 응답이 실패 상태면 에러를 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('forbidden', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            title: 'Bad Request',
            detail: 'zyte fail',
          }),
          { status: 400 },
        ),
      );

    await expect(fetchCgvTheaters({ zyteApiKey: 'test-key' })).rejects.toThrow(
      'Zyte API 호출 실패: 400 zyte fail',
    );
  });

  it('Zyte 응답 본문이 비어 있으면 에러를 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('forbidden', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 200,
          }),
          { status: 200 },
        ),
      );

    await expect(fetchCgvTheaters({ zyteApiKey: 'test-key' })).rejects.toThrow(
      'Zyte HTTP 응답 본문이 비어 있습니다.',
    );
  });

  it('Zyte API 키가 비어 있으면 에러를 반환한다', async () => {
    const original = process.env.ZYTE_API_KEY;

    process.env.ZYTE_API_KEY = '';

    mockFetch.mockResolvedValue(new Response('forbidden', { status: 403 }));

    await expect(fetchCgvTheaters({ zyteApiKey: '   ' })).rejects.toThrow(
      'ZYTE_API_KEY가 설정되지 않았습니다.',
    );

    process.env.ZYTE_API_KEY = original;
  });
});
