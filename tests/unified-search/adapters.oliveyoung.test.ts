import { describe, expect, it } from 'vitest';
import { createOliveyoungUnifiedSearchAdapter } from '../../src/unified-search/adapters.js';
import { encodeUnifiedSearchCursor } from '../../src/unified-search/cursor.js';
import { createZyteSuccessResponse, mockFetch, setupUnifiedSearchFetchMock } from './testHelpers.js';

setupUnifiedSearchFetchMock();

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

  it('oliveyoung product continuation은 다음 페이지와 nextCursor를 반영한다', async () => {
    const adapter = createOliveyoungUnifiedSearchAdapter('test-key');

    mockFetch.mockResolvedValueOnce(
      createZyteSuccessResponse({
        status: 'SUCCESS',
        data: {
          totalCount: 21,
          nextPage: true,
          searchList: [
            {
              goodsNumber: 'G6',
              goodsName: '선크림 6',
              priceToPay: 10000,
              originalPrice: 12000,
              o2oStockFlag: true,
            },
          ],
        },
      }),
    );

    const result = await adapter.search({
      query: '선크림',
      service: 'oliveyoung',
      types: ['product'],
      limitPerService: 5,
      continuation: {
        v: 1,
        service: 'oliveyoung',
        bucket: 'products',
        query: '선크림',
        limitPerService: 5,
        page: 2,
      },
    });

    expect(result.meta?.products).toEqual({
      returnedCount: 1,
      truncated: true,
      sortApplied: 'service-default',
      nextCursor: encodeUnifiedSearchCursor({
        v: 1,
        service: 'oliveyoung',
        bucket: 'products',
        query: '선크림',
        limitPerService: 5,
        page: 3,
      }),
    });
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

  it('oliveyoung store continuation은 같은 페이지 offset과 nextCursor를 반영한다', async () => {
    const adapter = createOliveyoungUnifiedSearchAdapter('test-key');

    mockFetch.mockResolvedValueOnce(
      createZyteSuccessResponse({
        status: 'SUCCESS',
        data: {
          totalCount: 48,
          storeList: Array.from({ length: 20 }, (_, index) => ({
            storeCode: `S${index + 1}`,
            storeName: `올리브영 강남점 ${index + 1}`,
            address: '서울 강남구',
            latitude: 37.5,
            longitude: 127.0,
            pickupYn: index % 2 === 0,
          })),
        },
      }),
    );

    const result = await adapter.search({
      query: '강남',
      service: 'oliveyoung',
      types: ['store'],
      limitPerService: 5,
      latitude: 37.498,
      longitude: 127.027,
      continuation: {
        v: 1,
        service: 'oliveyoung',
        bucket: 'stores',
        query: '강남',
        limitPerService: 5,
        pageIdx: 1,
        offset: 5,
        pageSize: 20,
        latitude: 37.498,
        longitude: 127.027,
      },
    });

    expect(result.stores).toHaveLength(5);
    expect(result.stores?.[0].id).toBe('S6');
    expect(result.meta?.stores).toEqual({
      returnedCount: 5,
      truncated: true,
      sortApplied: 'service-default',
      nextCursor: encodeUnifiedSearchCursor({
        v: 1,
        service: 'oliveyoung',
        bucket: 'stores',
        query: '강남',
        limitPerService: 5,
        pageIdx: 1,
        offset: 10,
        pageSize: 20,
        latitude: 37.498,
        longitude: 127.027,
      }),
    });
  });

  it('oliveyoung store continuation은 현재 페이지를 소진하면 다음 pageIdx로 넘긴다', async () => {
    const adapter = createOliveyoungUnifiedSearchAdapter('test-key');

    mockFetch.mockResolvedValueOnce(
      createZyteSuccessResponse({
        status: 'SUCCESS',
        data: {
          totalCount: 48,
          storeList: Array.from({ length: 20 }, (_, index) => ({
            storeCode: `S${index + 1}`,
            storeName: `올리브영 강남점 ${index + 1}`,
            address: '서울 강남구',
            latitude: 37.5,
            longitude: 127.0,
            pickupYn: index % 2 === 0,
          })),
        },
      }),
    );

    const result = await adapter.search({
      query: '강남',
      service: 'oliveyoung',
      types: ['store'],
      limitPerService: 5,
      latitude: 37.498,
      longitude: 127.027,
      continuation: {
        v: 1,
        service: 'oliveyoung',
        bucket: 'stores',
        query: '강남',
        limitPerService: 5,
        pageIdx: 1,
        offset: 15,
        pageSize: 20,
        latitude: 37.498,
        longitude: 127.027,
      },
    });

    expect(result.stores).toHaveLength(5);
    expect(result.stores?.[0].id).toBe('S16');
    expect(result.meta?.stores?.nextCursor).toBe(
      encodeUnifiedSearchCursor({
        v: 1,
        service: 'oliveyoung',
        bucket: 'stores',
        query: '강남',
        limitPerService: 5,
        pageIdx: 2,
        offset: 0,
        pageSize: 20,
        latitude: 37.498,
        longitude: 127.027,
      }),
    );
  });
});
