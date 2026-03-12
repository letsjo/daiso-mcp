import { describe, expect, it } from 'vitest';
import { createDaisoUnifiedSearchAdapter } from '../../src/unified-search/adapters.js';
import { encodeUnifiedSearchCursor } from '../../src/unified-search/cursor.js';
import { mockFetch, setupUnifiedSearchFetchMock } from './testHelpers.js';

setupUnifiedSearchFetchMock();

describe('createDaisoUnifiedSearchAdapter', () => {
  it('상품과 매장을 통합 검색 결과 형식으로 변환한다', async () => {
    const adapter = createDaisoUnifiedSearchAdapter();

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            resultSet: {
              result: [
                {
                  totalSize: 1,
                  resultDocuments: [{ PD_NO: 'P1', PDNM: '정리함', PD_PRC: '1000' }],
                },
              ],
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(`
          <div class="bx-store" data-start="0900" data-end="2200" data-lat="37.5" data-lng="127.0" data-info='{"online_yn":"Y"}'>
            <h4 class="place">다이소 강남역점</h4>
            <em class="phone">T. 02-0000-0000</em>
            <p class="addr">서울 강남구</p>
          </div>
        `),
      );

    const result = await adapter.search({
      query: '강남',
      service: 'daiso',
      types: ['product', 'store'],
      limitPerService: 5,
    });

    expect(result.products).toEqual([
      expect.objectContaining({
        id: 'P1',
        title: '정리함',
        service: 'daiso',
        type: 'product',
        stockStatus: 'unknown',
        links: {
          officialProductUrl:
            'https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=P1&recmYn=N',
          officialPurchaseUrl:
            'https://www.daisomall.co.kr/pd/pdr/SCR_PDR_0001?pdNo=P1&recmYn=N',
        },
      }),
    ]);
    expect(result.stores).toEqual([
      expect.objectContaining({
        title: '다이소 강남역점',
        pickupAvailable: true,
      }),
    ]);
    expect(result.meta).toEqual({
      products: {
        returnedCount: 1,
        truncated: false,
        sortApplied: 'service-default',
      },
      stores: {
        returnedCount: 1,
        truncated: false,
        sortApplied: 'service-default',
      },
    });
  });

  it('product만 요청하면 품절 상태를 out_of_stock으로 변환한다', async () => {
    const adapter = createDaisoUnifiedSearchAdapter();

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          resultSet: {
            result: [
              {
                totalSize: 1,
                resultDocuments: [{ PD_NO: 'P2', PDNM: '품절 상품', PD_PRC: '2000', SOLD_OUT_YN: 'Y' }],
              },
            ],
          },
        }),
      ),
    );

    const result = await adapter.search({
      query: '품절',
      service: 'daiso',
      types: ['product'],
      limitPerService: 5,
    });

    expect(result.products).toEqual([
      expect.objectContaining({
        id: 'P2',
        stockStatus: 'out_of_stock',
      }),
    ]);
    expect(result.stores).toBeUndefined();
  });

  it('daiso product continuation은 다음 페이지와 nextCursor를 반영한다', async () => {
    const adapter = createDaisoUnifiedSearchAdapter();

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          resultSet: {
            result: [
              {
                totalSize: 11,
                resultDocuments: [{ PD_NO: 'P6', PDNM: '정리함 6', PD_PRC: '1000' }],
              },
            ],
          },
        }),
      ),
    );

    const result = await adapter.search({
      query: '정리함',
      service: 'daiso',
      types: ['product'],
      limitPerService: 5,
      continuation: {
        v: 1,
        service: 'daiso',
        bucket: 'products',
        query: '정리함',
        limitPerService: 5,
        page: 2,
      },
    });

    expect(mockFetch.mock.calls[0][0]).toContain('pageNum=2');
    expect(result.meta?.products).toEqual({
      returnedCount: 1,
      truncated: true,
      sortApplied: 'service-default',
      nextCursor: encodeUnifiedSearchCursor({
        v: 1,
        service: 'daiso',
        bucket: 'products',
        query: '정리함',
        limitPerService: 5,
        page: 3,
      }),
    });
  });

  it('store만 요청하면 상품 조회를 건너뛴다', async () => {
    const adapter = createDaisoUnifiedSearchAdapter();

    mockFetch.mockResolvedValueOnce(
      new Response(`
        <div class="bx-store" data-start="0900" data-end="2200" data-lat="37.5" data-lng="127.0" data-info='{}'>
          <h4 class="place">다이소 홍대점</h4>
          <p class="addr">서울 마포구</p>
        </div>
      `),
    );

    const result = await adapter.search({
      query: '홍대',
      service: 'daiso',
      types: ['store'],
      limitPerService: 5,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.products).toBeUndefined();
    expect(result.stores).toEqual([
      expect.objectContaining({
        title: '다이소 홍대점',
      }),
    ]);
  });
});
