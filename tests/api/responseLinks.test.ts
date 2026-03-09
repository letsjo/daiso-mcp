/**
 * API 응답 링크 생성 유틸 테스트
 */

import { describe, expect, it } from 'vitest';
import { withDaisoProductLinks } from '../../src/api/responseLinks.js';

describe('withDaisoProductLinks', () => {
  it('잘못된 requestUrl이면 기본 공개 URL로 fallback한다', () => {
    const result = withDaisoProductLinks(
      {
        id: '12345',
        name: '정리함',
        price: 1000,
      },
      'http://%',
    );

    expect(result.links.apiDetailUrl).toBe(
      'https://daiso-mcp.hyunoh-jo.workers.dev/api/daiso/products/12345',
    );
    expect(result.links.apiInventoryUrl).toBe(
      'https://daiso-mcp.hyunoh-jo.workers.dev/api/daiso/inventory?productId=12345',
    );
  });
});
