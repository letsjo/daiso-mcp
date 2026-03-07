/**
 * 올리브영 계약 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchOliveyoungProducts,
  fetchOliveyoungStores,
} from '../../../src/services/oliveyoung/client.js';
import { readJsonFixture } from '../../testFixtures.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.ZYTE_API_KEY;
});

describe('oliveyoung representative payload contracts', () => {
  it('매장 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(readJsonFixture('oliveyoung/stores.zyte.json'))),
    );

    const result = await fetchOliveyoungStores(
      { latitude: 37.5, longitude: 127.0, pageIdx: 1, searchWords: '' },
      { apiKey: 'test-key' },
    );

    expect(result).toEqual({
      totalCount: 2,
      stores: [
        {
          storeCode: 'S1',
          storeName: 'Olive Store 1',
          address: 'Seoul 1',
          latitude: 37.51,
          longitude: 127.01,
          pickupYn: true,
          o2oRemainQuantity: 4,
        },
        {
          storeCode: 'S2',
          storeName: 'Olive Store 2',
          address: 'Seoul 2',
          latitude: 37.52,
          longitude: 127.02,
          pickupYn: false,
          o2oRemainQuantity: 0,
        },
      ],
    });
  });

  it('상품 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(readJsonFixture('oliveyoung/products.zyte.json'))),
    );

    const result = await fetchOliveyoungProducts(
      { keyword: 'lip', page: 1, size: 20, sort: '01', includeSoldOut: false },
      { apiKey: 'test-key' },
    );

    expect(result).toEqual({
      totalCount: 2,
      nextPage: false,
      products: [
        {
          goodsNumber: 'P1',
          goodsName: 'Lip Balm',
          priceToPay: 5000,
          originalPrice: 7000,
          discountRate: 28,
          o2oStockFlag: true,
          o2oRemainQuantity: 3,
        },
        {
          goodsNumber: 'P2',
          goodsName: 'Sun Cream',
          priceToPay: 12000,
          originalPrice: 15000,
          discountRate: 20,
          o2oStockFlag: false,
          o2oRemainQuantity: 0,
        },
      ],
    });
  });
});
