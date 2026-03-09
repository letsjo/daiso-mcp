/**
 * CGV 영화 검색 유틸리티 테스트
 */

import { describe, expect, it } from 'vitest';
import {
  buildMoviesFromTimetableItems,
  mapCgvMovieItem,
  normalizeCgvMovieSort,
  pickMatchingTheater,
  sortMoviesFromList,
} from '../../../src/services/cgv/movieSearch.js';

describe('pickMatchingTheater', () => {
  const theaters = [
    { theaterCode: '0056', theaterName: '강남' },
    { theaterCode: '0366', theaterName: '고덕강일' },
    { theaterCode: '0013', theaterName: '용산아이파크몰' },
  ];

  it('극장 코드로 매칭할 수 있다', () => {
    expect(pickMatchingTheater(theaters, '0366')).toEqual(theaters[1]);
  });

  it('극장 이름 앞부분으로 매칭할 수 있다', () => {
    expect(pickMatchingTheater(theaters, '용산')).toEqual(theaters[2]);
  });

  it('극장 이름이 정확히 일치하면 그대로 매칭한다', () => {
    expect(pickMatchingTheater(theaters, '고덕강일')).toEqual(theaters[1]);
  });

  it('CGV 접두사를 제거하고 부분 문자열로 매칭할 수 있다', () => {
    expect(pickMatchingTheater(theaters, 'CGV 고덕')).toEqual(theaters[1]);
  });

  it('이름 중간 문자열로도 매칭할 수 있다', () => {
    expect(pickMatchingTheater(theaters, '강일')).toEqual(theaters[1]);
  });

  it('동일 점수 후보가 여러 개면 먼저 나온 극장을 반환한다', () => {
    expect(
      pickMatchingTheater(
        [
          { theaterCode: '0056', theaterName: '강남' },
          { theaterCode: '0057', theaterName: '강동' },
        ],
        '강',
      ),
    ).toEqual({ theaterCode: '0056', theaterName: '강남' });
  });

  it('일치하는 극장이 없으면 undefined를 반환한다', () => {
    expect(pickMatchingTheater(theaters, '없는극장')).toBeUndefined();
  });
});

describe('normalizeCgvMovieSort', () => {
  it('기본값은 popularity-desc다', () => {
    expect(normalizeCgvMovieSort()).toBe('popularity-desc');
  });

  it('지원하는 정렬 기준을 그대로 반환한다', () => {
    expect(normalizeCgvMovieSort('cgv-default')).toBe('cgv-default');
  });

  it('지원하지 않는 정렬 기준이면 에러를 던진다', () => {
    expect(() => normalizeCgvMovieSort('distance-asc')).toThrow(
      '지원하지 않는 CGV 영화 정렬입니다. popularity-desc, cgv-default 중에서 선택해주세요.',
    );
  });
});

describe('mapCgvMovieItem', () => {
  it('문자열 예매율을 숫자로 변환한다', () => {
    expect(
      mapCgvMovieItem({
        movNo: 'M1',
        movNm: '영화A',
        cratgClsNm: '12세',
        atktRate: '12.3%',
      }),
    ).toEqual({
      movieCode: 'M1',
      movieName: '영화A',
      rating: '12세',
      ticketRate: 12.3,
    });
  });

  it('숫자 예매율은 그대로 사용한다', () => {
    expect(
      mapCgvMovieItem({
        movNo: 'M2',
        movNm: '영화B',
        atktRate: 8.1,
      }),
    ).toEqual({
      movieCode: 'M2',
      movieName: '영화B',
      rating: undefined,
      ticketRate: 8.1,
    });
  });

  it('잘못된 예매율은 undefined로 처리한다', () => {
    expect(
      mapCgvMovieItem({
        movNo: 'M3',
        movNm: '영화C',
        atktRate: 'N/A',
      }),
    ).toEqual({
      movieCode: 'M3',
      movieName: '영화C',
      rating: undefined,
      ticketRate: undefined,
    });
  });
});

describe('sortMoviesFromList', () => {
  const movies = [
    { movieCode: 'M1', movieName: '영화A', ticketRate: 3.1 },
    { movieCode: 'M2', movieName: '영화B', ticketRate: 11.2 },
  ];

  it('popularity-desc면 예매율 높은 영화를 먼저 둔다', () => {
    expect(sortMoviesFromList(movies, 'popularity-desc').map((movie) => movie.movieCode)).toEqual([
      'M2',
      'M1',
    ]);
  });

  it('cgv-default면 원래 순서를 유지한다', () => {
    expect(sortMoviesFromList(movies, 'cgv-default').map((movie) => movie.movieCode)).toEqual([
      'M1',
      'M2',
    ]);
  });
});

describe('buildMoviesFromTimetableItems', () => {
  const items = [
    {
      siteNo: '0056',
      siteNm: 'CGV 강남',
      scnYmd: '20260304',
      scnSseq: '1',
      movNo: 'M1',
      movNm: '영화A',
      cratgClsNm: null,
      scnsrtTm: '1830',
      sortOseq: '9',
    },
    {
      siteNo: '0056',
      siteNm: 'CGV 강남',
      scnYmd: '20260304',
      scnSseq: '2',
      movNo: 'M1',
      movNm: '영화A',
      cratgClsNm: '12세',
      scnsrtTm: '0930',
      sortOseq: '9',
    },
    {
      siteNo: '0056',
      siteNm: 'CGV 강남',
      scnYmd: '20260304',
      scnSseq: '3',
      movNo: 'M2',
      movNm: '영화B',
      cratgClsNm: '15세',
      scnsrtTm: '1010',
      sortOseq: '1',
    },
    {
      siteNo: '0056',
      siteNm: 'CGV 강남',
      scnYmd: '20260304',
      scnSseq: '4',
      movNo: '',
      movNm: '',
      scnsrtTm: '1110',
      sortOseq: '1',
    },
  ];

  it('popularity-desc면 회차 수가 많은 영화를 먼저 둔다', () => {
    expect(buildMoviesFromTimetableItems(items, 'popularity-desc')).toEqual([
      {
        movieCode: 'M1',
        movieName: '영화A',
        rating: '12세',
        showtimeCount: 2,
        firstStartTime: '09:30',
      },
      {
        movieCode: 'M2',
        movieName: '영화B',
        rating: '15세',
        showtimeCount: 1,
        firstStartTime: '10:10',
      },
    ]);
  });

  it('cgv-default면 기본 노출 순서를 우선한다', () => {
    expect(buildMoviesFromTimetableItems(items, 'cgv-default').map((movie) => movie.movieCode)).toEqual([
      'M2',
      'M1',
    ]);
  });

  it('동일 회차 수와 노출 순서면 더 이른 시작 시각을 먼저 둔다', () => {
    const equalOrderItems = [
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '1',
        movNo: 'M1',
        movNm: '영화A',
        cratgClsNm: '12세',
        scnsrtTm: '1230',
        sortOseq: '0',
      },
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '2',
        movNo: 'M2',
        movNm: '영화B',
        cratgClsNm: '12세',
        scnsrtTm: '0930',
        sortOseq: '0',
      },
    ];

    expect(
      buildMoviesFromTimetableItems(equalOrderItems, 'cgv-default').map((movie) => movie.movieCode),
    ).toEqual(['M2', 'M1']);
  });

  it('시작 시각까지 같으면 먼저 등장한 영화를 유지한다', () => {
    const sameStartItems = [
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '1',
        movNo: 'M1',
        movNm: '영화A',
        cratgClsNm: '12세',
        scnsrtTm: '1010',
        sortOseq: '',
      },
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '2',
        movNo: 'M2',
        movNm: '영화B',
        cratgClsNm: '12세',
        scnsrtTm: '1010',
        sortOseq: '',
      },
    ];

    expect(
      buildMoviesFromTimetableItems(sameStartItems, 'cgv-default').map((movie) => movie.movieCode),
    ).toEqual(['M1', 'M2']);
  });

  it('popularity-desc에서 회차 수가 같으면 시작 시각으로 비교한다', () => {
    const equalCountItems = [
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '1',
        movNo: 'M1',
        movNm: '영화A',
        cratgClsNm: '12세',
        scnsrtTm: '1230',
        sortOseq: '1',
      },
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '2',
        movNo: 'M2',
        movNm: '영화B',
        cratgClsNm: '15세',
        scnsrtTm: '0930',
        sortOseq: '1',
      },
    ];

    expect(
      buildMoviesFromTimetableItems(equalCountItems, 'popularity-desc').map((movie) => movie.movieCode),
    ).toEqual(['M2', 'M1']);
  });

  it('시작 시각이 없으면 가장 뒤로 정렬한다', () => {
    const missingTimeItems = [
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '1',
        movNo: 'M1',
        movNm: '영화A',
        cratgClsNm: '12세',
        scnsrtTm: undefined,
        sortOseq: '1',
      },
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '2',
        movNo: 'M2',
        movNm: '영화B',
        cratgClsNm: '15세',
        scnsrtTm: '0930',
        sortOseq: '1',
      },
    ];

    expect(
      buildMoviesFromTimetableItems(missingTimeItems, 'cgv-default').map((movie) => movie.movieCode),
    ).toEqual(['M2', 'M1']);
  });

  it('이미 등급이 있으면 후속 회차의 빈 등급으로 덮어쓰지 않는다', () => {
    const repeatedMovieItems = [
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '1',
        movNo: 'M1',
        movNm: '영화A',
        cratgClsNm: '12세',
        scnsrtTm: '0930',
        sortOseq: '1',
      },
      {
        siteNo: '0056',
        siteNm: 'CGV 강남',
        scnYmd: '20260304',
        scnSseq: '2',
        movNo: 'M1',
        movNm: '영화A',
        cratgClsNm: null,
        scnsrtTm: '1830',
        sortOseq: '1',
      },
    ];

    expect(buildMoviesFromTimetableItems(repeatedMovieItems, 'popularity-desc')).toEqual([
      {
        movieCode: 'M1',
        movieName: '영화A',
        rating: '12세',
        showtimeCount: 2,
        firstStartTime: '09:30',
      },
    ]);
  });
});
