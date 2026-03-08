import { describe, expect, it } from 'vitest';
import { createDaisoUnifiedSearchAdapter, createOliveyoungUnifiedSearchAdapter } from '../../src/unified-search/adapters.js';
import { mockFetch, createZyteSuccessResponse, setupUnifiedSearchFetchMock } from './testHelpers.js';

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
      }),
    ]);
    expect(result.stores).toEqual([
      expect.objectContaining({
        title: '다이소 강남역점',
        pickupAvailable: true,
      }),
    ]);
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

describe('createOliveyoungUnifiedSearchAdapter', () => {
  it('기본 좌표와 재고 상태를 반영한다', async () => {
    const adapter = createOliveyoungUnifiedSearchAdapter('test-key');

    mockFetch
      .mockResolvedValueOnce(
        createZyteSuccessResponse({
          status: 'SUCCESS',
          data: {
            totalCount: 1,
            searchList: [
              {
                goodsNumber: 'G1',
                goodsName: '선크림',
                priceToPay: 10000,
                originalPrice: 12000,
                o2oStockFlag: true,
              },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(
        createZyteSuccessResponse({
          status: 'SUCCESS',
          data: {
            totalCount: 1,
            storeList: [
              {
                storeCode: 'S1',
                storeName: '올리브영 강남점',
                address: '서울 강남구',
                latitude: 37.5,
                longitude: 127.0,
                pickupYn: true,
              },
            ],
          },
        }),
      );

    const result = await adapter.search({
      query: '선크림',
      service: 'oliveyoung',
      types: ['product', 'store'],
      limitPerService: 3,
    });

    const storeRequestBody = JSON.parse(String(mockFetch.mock.calls[1][1].body)) as {
      httpRequestText: string;
    };
    const storePayload = JSON.parse(storeRequestBody.httpRequestText) as {
      lat: number;
      lon: number;
    };

    expect(storePayload).toMatchObject({ lat: 37.5665, lon: 126.978 });
    expect(result.products).toEqual([
      expect.objectContaining({
        id: 'G1',
        title: '선크림',
        stockStatus: 'in_stock',
      }),
    ]);
    expect(result.stores).toEqual([
      expect.objectContaining({
        title: '올리브영 강남점',
        pickupAvailable: true,
      }),
    ]);
  });

  it('product만 요청하면 품절 상태를 out_of_stock으로 변환한다', async () => {
    const adapter = createOliveyoungUnifiedSearchAdapter('test-key');

    mockFetch.mockResolvedValueOnce(
      createZyteSuccessResponse({
        status: 'SUCCESS',
        data: {
          totalCount: 1,
          searchList: [
            {
              goodsNumber: 'G2',
              goodsName: '품절 선크림',
              priceToPay: 11000,
              originalPrice: 13000,
              o2oStockFlag: false,
            },
          ],
        },
      }),
    );

    const result = await adapter.search({
      query: '품절',
      service: 'oliveyoung',
      types: ['product'],
      limitPerService: 3,
    });

    expect(result.products).toEqual([
      expect.objectContaining({
        id: 'G2',
        stockStatus: 'out_of_stock',
      }),
    ]);
    expect(result.stores).toBeUndefined();
  });

  it('store만 요청하면 상품 조회를 건너뛴다', async () => {
    const adapter = createOliveyoungUnifiedSearchAdapter('test-key');

    mockFetch.mockResolvedValueOnce(
      createZyteSuccessResponse({
        status: 'SUCCESS',
        data: {
          totalCount: 1,
          storeList: [
            {
              storeCode: 'S2',
              storeName: '올리브영 홍대점',
              address: '서울 마포구',
              latitude: 37.55,
              longitude: 126.92,
              pickupYn: false,
            },
          ],
        },
      }),
    );

    const result = await adapter.search({
      query: '홍대',
      service: 'oliveyoung',
      types: ['store'],
      limitPerService: 3,
      latitude: 37.55,
      longitude: 126.92,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.products).toBeUndefined();
    expect(result.stores).toEqual([
      expect.objectContaining({
        id: 'S2',
        title: '올리브영 홍대점',
      }),
    ]);
  });
});
