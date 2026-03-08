/**
 * 앱 통합 테스트 - 통합 검색 API
 */

import { describe, expect, it, vi } from 'vitest';
import app from '../../src/index.js';
import { setupFetchMock } from './testHelpers.js';

const mockFetch = vi.fn();
setupFetchMock(mockFetch);

describe('GET /api/search', () => {
  it('통합 검색 결과를 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          resultSet: {
            result: [{ totalSize: 1, resultDocuments: [{ PD_NO: 'P1', PDNM: '정리함', PD_PRC: '1000' }] }],
          },
        }),
      ),
    );

    const res = await app.request('/api/search?q=%EC%A0%95%EB%A6%AC%ED%95%A8&services=daiso&types=product');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.results.daiso.products).toHaveLength(1);
  });

  it('잘못된 services는 400을 반환한다', async () => {
    const res = await app.request('/api/search?q=%EA%B0%95%EB%82%A8&services=unknown');

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_SERVICES');
  });
});
