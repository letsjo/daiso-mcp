import { describe, expect, it } from 'vitest';
import {
  createCgvUnifiedSearchAdapter,
  createMegaboxUnifiedSearchAdapter,
} from '../../src/unified-search/adapters.js';
import { createUnifiedSearchAggregator } from '../../src/unified-search/createAggregator.js';
import { mockFetch, setupUnifiedSearchFetchMock } from './testHelpers.js';

setupUnifiedSearchFetchMock();

describe('createMegaboxUnifiedSearchAdapter', () => {
  it('영화와 지점을 query 기준으로 필터링하고 거리순 정렬한다', async () => {
    const adapter = createMegaboxUnifiedSearchAdapter();

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            areaBrchList: [
              { brchNo: '1372', brchNm: '강남' },
              { brchNo: '1373', brchNm: '홍대' },
            ],
            movieList: [
              { movieNo: 'M1', movieNm: '강남 대소동', movieStatCdNm: '상영중' },
              { movieNo: 'M2', movieNm: '다른 영화' },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response('<dt>도로명주소</dt><dd>서울 강남구</dd><a href="?lng=127.0&lat=37.5">지도</a>'),
      )
      .mockRejectedValueOnce(new Error('detail fail'));

    const result = await adapter.search({
      query: '강남',
      service: 'megabox',
      types: ['movie', 'theater'],
      limitPerService: 5,
      latitude: 37.5,
      longitude: 127.0,
    });

    expect(result.movies).toEqual([
      expect.objectContaining({
        id: 'M1',
        title: '강남 대소동',
        rating: '상영중',
      }),
    ]);
    expect(result.theaters).toEqual([
      expect.objectContaining({
        id: '1372',
        title: '강남',
        distanceKm: 0,
      }),
    ]);
  });

  it('movie만 요청하면 지점 상세 조회를 건너뛴다', async () => {
    const adapter = createMegaboxUnifiedSearchAdapter();

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          areaBrchList: [{ brchNo: '1372', brchNm: '강남' }],
          movieList: [{ movieNo: 'M1', movieNm: '강남 대소동', movieStatCdNm: '상영중' }],
        }),
      ),
    );

    const result = await adapter.search({
      query: '강남',
      service: 'megabox',
      types: ['movie'],
      limitPerService: 5,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.movies).toEqual([
      expect.objectContaining({
        id: 'M1',
        title: '강남 대소동',
      }),
    ]);
    expect(result.theaters).toBeUndefined();
  });

  it('거리 정보가 같으면 극장명을 기준으로 정렬한다', async () => {
    const adapter = createMegaboxUnifiedSearchAdapter();

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            areaBrchList: [
              { brchNo: '1372', brchNm: '지점 B' },
              { brchNo: '1373', brchNm: '지점 A' },
            ],
          }),
        ),
      )
      .mockRejectedValueOnce(new Error('detail fail'))
      .mockRejectedValueOnce(new Error('detail fail'));

    const result = await adapter.search({
      query: '지점',
      service: 'megabox',
      types: ['theater'],
      limitPerService: 5,
      latitude: 37.5,
      longitude: 127.0,
    });

    expect(result.theaters?.map((theater) => theater.title)).toEqual(['지점 A', '지점 B']);
  });

  it('거리 정보가 다르면 가까운 극장을 먼저 정렬한다', async () => {
    const adapter = createMegaboxUnifiedSearchAdapter();

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            areaBrchList: [
              { brchNo: '1372', brchNm: '강남 A' },
              { brchNo: '1373', brchNm: '강남 B' },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response('<dt>도로명주소</dt><dd>서울</dd><a href="?lng=127.1&lat=37.5">지도</a>'),
      )
      .mockResolvedValueOnce(
        new Response('<dt>도로명주소</dt><dd>서울</dd><a href="?lng=127.0&lat=37.5">지도</a>'),
      );

    const result = await adapter.search({
      query: '강남',
      service: 'megabox',
      types: ['theater'],
      limitPerService: 5,
      latitude: 37.5,
      longitude: 127.0,
    });

    expect(result.theaters?.map((theater) => theater.title)).toEqual(['강남 B', '강남 A']);
  });
});

describe('createCgvUnifiedSearchAdapter', () => {
  it('극장 검색 결과를 반환한다', async () => {
    const adapter = createCgvUnifiedSearchAdapter('test-key');

    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          data: [
            {
              regnGrpCd: '01',
              regnGrpNm: '서울',
              siteList: [{ siteNo: '0056', siteNm: 'CGV 강남' }],
            },
          ],
        }),
      ),
    );

    const result = await adapter.search({
      query: '강남',
      service: 'cgv',
      types: ['theater'],
      limitPerService: 5,
    });

    expect(result.theaters).toEqual([
      expect.objectContaining({
        id: '0056',
        title: 'CGV 강남',
        regionCode: '01',
      }),
    ]);
  });

  it('극장명이 매치되지 않으면 기본 후보 극장에서 영화를 수집하고 중복을 제거한다', async () => {
    const adapter = createCgvUnifiedSearchAdapter('test-key');

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              {
                regnGrpCd: '01',
                regnGrpNm: '서울',
                siteList: [
                  { siteNo: '0056', siteNm: 'CGV 강남' },
                  { siteNo: '0013', siteNm: 'CGV 용산' },
                ],
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [{ movNo: 'M1', movNm: '영화A', cratgClsNm: '12세' }],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              { movNo: 'M1', movNm: '영화A', cratgClsNm: '12세' },
              { movNo: 'M2', movNm: '영화B' },
            ],
          }),
        ),
      );

    const result = await adapter.search({
      query: '영화A',
      service: 'cgv',
      types: ['movie'],
      limitPerService: 5,
    });

    expect(result.movies).toEqual([
      expect.objectContaining({
        id: 'M1',
        title: '영화A',
        theaterName: 'CGV 강남',
      }),
    ]);
  });

  it('극장명이 매치되면 해당 극장 우선으로 영화를 조회한다', async () => {
    const adapter = createCgvUnifiedSearchAdapter('test-key');

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              {
                regnGrpCd: '01',
                regnGrpNm: '서울',
                siteList: [
                  { siteNo: '0056', siteNm: 'CGV 강남' },
                  { siteNo: '0013', siteNm: 'CGV 용산' },
                ],
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [{ movNo: 'M3', movNm: '강남 상영작' }],
          }),
        ),
      );

    const result = await adapter.search({
      query: '강남',
      service: 'cgv',
      types: ['movie'],
      limitPerService: 5,
    });

    expect(result.movies).toEqual([
      expect.objectContaining({
        id: 'M3',
        title: '강남 상영작',
        theaterName: 'CGV 강남',
      }),
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('createUnifiedSearchAggregator', () => {
  it('기본 서비스 adapter들을 등록한다', () => {
    const aggregator = createUnifiedSearchAggregator({ ZYTE_API_KEY: 'test-key' });

    expect(aggregator.getRegisteredServices()).toEqual([
      'daiso',
      'oliveyoung',
      'megabox',
      'cgv',
    ]);
  });
});
