/**
 * 다이소 계약 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchOnlineStock,
  fetchStoreInventory,
} from '../../../src/services/daiso/tools/checkInventory.js';
import { fetchStores } from '../../../src/services/daiso/tools/findStores.js';
import { fetchProducts } from '../../../src/services/daiso/tools/searchProducts.js';
import { readJsonFixture, readTextFixture } from '../../testFixtures.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('daiso representative payload contracts', () => {
  it('제품 검색 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(readJsonFixture('daiso/products-search.json'))),
    );

    const result = await fetchProducts('storage');

    expect(result).toEqual({
      totalCount: 2,
      products: [
        {
          id: '1001',
          name: 'Storage Box',
          price: 5000,
          imageUrl: 'https://img.daisomall.co.kr/images/storage-box.jpg',
          brand: 'DAISO',
          soldOut: false,
          isNew: true,
          pickupAvailable: true,
        },
        {
          id: '1002',
          name: 'Display Basket',
          price: 1500,
          imageUrl: undefined,
          brand: undefined,
          soldOut: true,
          isNew: false,
          pickupAvailable: false,
        },
      ],
    });
  });

  it('매장 검색 fixture를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(new Response(readTextFixture('daiso/store-search.html')));

    const result = await fetchStores('gangnam');

    expect(result).toEqual([
      {
        name: 'Daiso Gangnam',
        phone: '02-1111-2222',
        address: 'Seoul Gangnam-gu',
        lat: 37.5001,
        lng: 127.0001,
        openTime: '10:00',
        closeTime: '22:00',
        options: {
          parking: true,
          ramp: true,
          elevator: true,
          cashless: true,
          photoSticker: false,
          nameSticker: true,
          simCard: true,
          taxFree: false,
          groupOrder: true,
          pickup: true,
        },
      },
      {
        name: 'Daiso Seocho',
        phone: '02-3333-4444',
        address: 'Seoul Seocho-gu',
        lat: 37.5101,
        lng: 127.0101,
        openTime: '09:00',
        closeTime: '21:00',
        options: {
          parking: false,
          ramp: false,
          elevator: false,
          cashless: false,
          photoSticker: false,
          nameSticker: false,
          simCard: false,
          taxFree: false,
          groupOrder: true,
          pickup: false,
        },
      },
    ]);
  });

  it('재고 fixture를 정규화한다', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(readJsonFixture('daiso/online-stock.json'))),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(readJsonFixture('daiso/store-inventory.json'))),
      );

    const onlineStock = await fetchOnlineStock('1001');
    const storeResult = await fetchStoreInventory('1001', 37.5, 127.0);

    expect(onlineStock).toBe(7);
    expect(storeResult).toEqual({
      totalCount: 2,
      stores: [
        {
          storeCode: 'S001',
          storeName: 'Daiso Gangnam',
          address: 'Seoul Gangnam-gu',
          phone: '02-1111-2222',
          openTime: '10:00',
          closeTime: '22:00',
          lat: 37.5001,
          lng: 127.0001,
          distance: '0.3',
          quantity: 5,
          options: {
            parking: true,
            simCard: true,
            pickup: true,
            taxFree: false,
            elevator: true,
            ramp: true,
            cashless: false,
          },
        },
        {
          storeCode: 'S002',
          storeName: 'Daiso Seocho',
          address: 'Seoul Seocho-gu',
          phone: '02-3333-4444',
          openTime: '09:00',
          closeTime: '21:00',
          lat: 37.4901,
          lng: 127.0201,
          distance: '1.1',
          quantity: 0,
          options: {
            parking: false,
            simCard: false,
            pickup: false,
            taxFree: true,
            elevator: false,
            ramp: false,
            cashless: true,
          },
        },
      ],
    });
  });
});
