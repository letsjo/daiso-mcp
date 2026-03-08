/**
 * 통합 검색 GET API 라우트 등록
 */

import type { Hono } from 'hono';
import { handleUnifiedSearch } from '../searchHandler.js';
import type { AppBindings } from '../response.js';

export function registerSearchRoutes(app: Hono<{ Bindings: AppBindings }>): void {
  app.get('/api/search', handleUnifiedSearch);
}
