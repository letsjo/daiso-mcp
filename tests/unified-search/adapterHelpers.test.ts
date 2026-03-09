import { describe, expect, it } from 'vitest';
import { matchesQuery } from '../../src/unified-search/adapterHelpers.js';

describe('matchesQuery', () => {
  it('값이 없으면 false를 반환한다', () => {
    expect(matchesQuery(undefined, '강남')).toBe(false);
  });
});
