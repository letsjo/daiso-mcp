/**
 * CGV 영화 검색 도구 공용 로직
 */

import type { McpToolResponse } from '../../../core/types.js';
import { createJsonTextResponse } from '../../../core/toolBuilder.js';
import { fetchCgvMovies, toYyyymmdd } from '../client.js';
import type { CgvMovieSort } from '../types.js';

export interface SearchMoviesArgs {
  playDate?: string;
  theaterCode?: string;
  theaterQuery?: string;
  sort?: CgvMovieSort;
  timeoutMs?: number;
}

export async function searchMovies(
  args: SearchMoviesArgs,
  apiKey?: string,
): Promise<McpToolResponse> {
  const {
    playDate = toYyyymmdd(),
    theaterCode,
    theaterQuery,
    sort = 'popularity-desc',
    timeoutMs = 15000,
  } = args;

  const movies = await fetchCgvMovies({
    playDate,
    theaterCode,
    theaterQuery,
    sort,
    timeout: timeoutMs,
    zyteApiKey: apiKey,
  });

  return createJsonTextResponse({
    playDate,
    filters: {
      theaterCode: theaterCode || null,
      theaterQuery: theaterQuery || null,
      sort,
    },
    count: movies.length,
    movies,
  });
}
