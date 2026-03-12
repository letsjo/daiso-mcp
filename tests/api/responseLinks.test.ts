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
        links: {
          officialPurchaseUrl:
            'https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=12345&recmYn=N',
        },
      },
      'http://%',
    );

    expect(result.links.apiDetailUrl).toBe(
      'https://daiso-mcp.hyunoh-jo.workers.dev/api/daiso/products/12345',
    );
    expect(result.links.apiInventoryUrl).toBe(
      'https://daiso-mcp.hyunoh-jo.workers.dev/api/daiso/inventory?productId=12345',
    );
    expect(result.links.officialProductUrl).toBe(
      'https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=12345&recmYn=N',
    );
    expect(result.links.officialPurchaseUrl).toBe(
      'https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=12345&recmYn=N',
    );
    expect(result.links.officialMallFinderUrl).toBe(
      'https://www.daisomall.co.kr/ms/msg/SCR_MSG_0015',
    );
  });
});
