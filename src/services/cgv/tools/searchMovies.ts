/**
 * CGV 영화 검색 도구
 */

import * as z from 'zod';
import type { ToolRegistration } from '../../../core/types.js';
import { createTool } from '../../../core/toolBuilder.js';
import { CGV_MOVIE_SORT_VALUES } from '../types.js';
import { searchMovies, type SearchMoviesArgs } from './searchMoviesShared.js';

export function createSearchMoviesTool(apiKey?: string): ToolRegistration {
  return createTool<SearchMoviesArgs>({
    name: 'cgv_search_movies',
    title: 'CGV 영화 검색',
    description:
      'CGV 상영 영화 목록을 조회합니다. 극장명이 있으면 theaterQuery를 사용하세요. 예: 고덕강일 CGV 영화 목록',
    inputSchema: {
      playDate: z.string().optional().describe('조회 날짜(YYYYMMDD, 기본값: 오늘)'),
      theaterCode: z.string().optional().describe('CGV 극장 코드 (예: 0056)'),
      theaterQuery: z
        .string()
        .optional()
        .describe('CGV 극장명 검색어 (예: 고덕강일). 극장명으로 영화 목록을 찾을 때 사용'),
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
