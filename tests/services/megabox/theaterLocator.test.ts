import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateDistanceKm,
  findNearbyMegaboxTheaters,
} from '../../../src/services/megabox/theaterLocator.js';

const mockFetch = vi.fn();

function createTheaterList(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    brchNo: `${index + 1}`,
    brchNm: `지점${index + 1}`,
  }));
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calculateDistanceKm', () => {
  it('동일 좌표면 거리가 0이다', () => {
    expect(calculateDistanceKm(37.5, 127, 37.5, 127)).toBe(0);
  });
});

describe('findNearbyMegaboxTheaters', () => {
  it('소규모 limit에서도 상세 요청 수를 20개로 제한한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ areaBrchList: createTheaterList(60) })),
    );

    for (let index = 0; index < 20; index += 1) {
      mockFetch.mockResolvedValueOnce(
        new Response(
          `<dt>도로명주소</dt><dd>서울 ${index}</dd><a href="?lng=127.${index}&lat=37.${index}">지도</a>`,
        ),
      );
    }

    await findNearbyMegaboxTheaters({
      latitude: 37.5,
      longitude: 127,
      playDate: '20260310',
      areaCode: '11',
      limit: 1,
      timeoutMs: 15000,
    });

    expect(mockFetch).toHaveBeenCalledTimes(21);
  });

  it('큰 limit에서는 상세 요청 수를 40개로 제한하고 실패 항목을 제외한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ areaBrchList: createTheaterList(80) })),
    );

    mockFetch.mockRejectedValueOnce(new Error('failed'));

    for (let index = 1; index < 40; index += 1) {
      mockFetch.mockResolvedValueOnce(
        new Response(
          `<dt>도로명주소</dt><dd>서울 ${index}</dd><a href="?lng=127.${index}&lat=37.${index}">지도</a>`,
        ),
      );
    }

    const theaters = await findNearbyMegaboxTheaters({
      latitude: 37.5,
      longitude: 127,
      playDate: '20260310',
      areaCode: '11',
      limit: 15,
      timeoutMs: 15000,
    });

    expect(mockFetch).toHaveBeenCalledTimes(41);
    expect(theaters).toHaveLength(15);
  });
});
