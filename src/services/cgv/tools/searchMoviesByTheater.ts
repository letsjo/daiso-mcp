/**
 * CGV 극장명 기반 영화 검색 도구
 */

import * as z from 'zod';
import type { ToolRegistration } from '../../../core/types.js';
import { createTool } from '../../../core/toolBuilder.js';
import { CGV_MOVIE_SORT_VALUES, type CgvMovieSort } from '../types.js';
import { searchMovies } from './searchMoviesShared.js';

interface SearchMoviesByTheaterArgs {
  playDate?: string;
  theaterQuery: string;
  sort?: CgvMovieSort;
  timeoutMs?: number;
}

export function createSearchMoviesByTheaterTool(apiKey?: string): ToolRegistration {
  return createTool<SearchMoviesByTheaterArgs>({
    name: 'cgv_search_movies_by_theater',
    title: 'CGV 극장별 영화 검색',
    description:
      '극장명으로 CGV 영화 목록을 조회합니다. 예: 고덕 CGV 영화 목록, 고덕강일 CGV 상영작',
    inputSchema: {
      playDate: z.string().optional().describe('조회 날짜(YYYYMMDD, 기본값: 오늘)'),
      theaterQuery: z.string().describe('CGV 극장명 검색어 (예: 고덕강일)'),
      sort: z
        .enum(CGV_MOVIE_SORT_VALUES)
        .optional()
        .default('popularity-desc')
        .describe('정렬 기준 (기본값: popularity-desc)'),
      timeoutMs: z.number().optional().default(15000).describe('요청 제한 시간(ms, 기본값: 15000)'),
    },
    handler: ({ playDate, theaterQuery, sort, timeoutMs }) =>
      searchMovies(
        {
          playDate,
          theaterQuery,
          sort,
          timeoutMs,
        },
        apiKey,
      ),
  });
}
