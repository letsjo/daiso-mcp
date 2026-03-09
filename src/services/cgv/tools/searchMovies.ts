/**
 * CGV 영화 검색 도구
 */

import * as z from 'zod';
import type { McpToolResponse, ToolRegistration } from '../../../core/types.js';
import { createJsonTextResponse, createTool } from '../../../core/toolBuilder.js';
import { fetchCgvMovies, toYyyymmdd } from '../client.js';
import { CGV_MOVIE_SORT_VALUES, type CgvMovieSort } from '../types.js';

interface SearchMoviesArgs {
  playDate?: string;
  theaterCode?: string;
  theaterQuery?: string;
  sort?: CgvMovieSort;
  timeoutMs?: number;
}

async function searchMovies(args: SearchMoviesArgs, apiKey?: string): Promise<McpToolResponse> {
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

  const result = {
    playDate,
    filters: {
      theaterCode: theaterCode || null,
      theaterQuery: theaterQuery || null,
      sort,
    },
    count: movies.length,
    movies,
  };

  return createJsonTextResponse(result);
}

export function createSearchMoviesTool(apiKey?: string): ToolRegistration {
  return createTool<SearchMoviesArgs>({
    name: 'cgv_search_movies',
    title: 'CGV 영화 검색',
    description: 'CGV 상영 영화 목록을 조회합니다.',
    inputSchema: {
      playDate: z.string().optional().describe('조회 날짜(YYYYMMDD, 기본값: 오늘)'),
      theaterCode: z.string().optional().describe('CGV 극장 코드 (예: 0056)'),
      theaterQuery: z.string().optional().describe('CGV 극장명 검색어 (예: 고덕강일)'),
      sort: z
        .enum(CGV_MOVIE_SORT_VALUES)
        .optional()
        .default('popularity-desc')
        .describe('정렬 기준 (기본값: popularity-desc)'),
      timeoutMs: z.number().optional().default(15000).describe('요청 제한 시간(ms, 기본값: 15000)'),
    },
    handler: (args) => searchMovies(args, apiKey),
  });
}
