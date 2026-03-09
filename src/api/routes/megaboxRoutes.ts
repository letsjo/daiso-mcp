/**
 * 메가박스 GET API 라우트 등록
 */

import type { Hono } from 'hono';
import { withEdgeCache } from '../../utils/cache.js';
import {
  handleMegaboxFindNearbyTheaters,
  handleMegaboxGetSeatMap,
  handleMegaboxListNowShowing,
  handleMegaboxGetRemainingSeats,
} from '../megaboxHandlers.js';
import type { AppBindings } from '../response.js';

export function registerMegaboxRoutes(app: Hono<{ Bindings: AppBindings }>): void {
  app.get('/api/megabox/theaters', async (c) =>
    withEdgeCache(
      c.req.url,
      {
        ttlSeconds: 60 * 60 * 24,
        staleWhileRevalidateSeconds: 60 * 5,
        keyPrefix: 'megabox-theaters-v1',
      },
      () => handleMegaboxFindNearbyTheaters(c),
    ),
  );

  app.get('/api/megabox/movies', async (c) =>
    withEdgeCache(
      c.req.url,
      {
        ttlSeconds: 60 * 10,
        staleWhileRevalidateSeconds: 60,
        keyPrefix: 'megabox-movies-v1',
      },
      () => handleMegaboxListNowShowing(c),
    ),
  );

  app.get('/api/megabox/seats', async (c) =>
    withEdgeCache(
      c.req.url,
      {
        ttlSeconds: 60 * 3,
        staleWhileRevalidateSeconds: 30,
        keyPrefix: 'megabox-seats-v1',
      },
      () => handleMegaboxGetRemainingSeats(c),
    ),
  );

  app.get('/api/megabox/seat-map', async (c) =>
    withEdgeCache(
      c.req.url,
      {
        ttlSeconds: 60,
        staleWhileRevalidateSeconds: 15,
        keyPrefix: 'megabox-seat-map-v1',
      },
      () => handleMegaboxGetSeatMap(c),
    ),
  );
}
