import { describe, expect, it } from 'vitest';
import { dedupeMovies, matchesQuery } from '../../src/unified-search/adapterHelpers.js';

describe('matchesQuery', () => {
  it('값이 없으면 false를 반환한다', () => {
    expect(matchesQuery(undefined, '강남')).toBe(false);
  });
});

describe('dedupeMovies', () => {
  it('중복 영화 id가 있으면 첫 항목만 유지한다', () => {
    expect(
      dedupeMovies([
        { id: 'M1', title: '영화A', service: 'cgv', type: 'movie' },
        { id: 'M1', title: '영화A-중복', service: 'megabox', type: 'movie' },
        { id: 'M2', title: '영화B', service: 'cgv', type: 'movie' },
      ]),
    ).toEqual([
      { id: 'M1', title: '영화A', service: 'cgv', type: 'movie' },
      { id: 'M2', title: '영화B', service: 'cgv', type: 'movie' },
    ]);
  });
});
