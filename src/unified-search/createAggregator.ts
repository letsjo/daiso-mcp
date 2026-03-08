/**
 * 통합 검색 aggregator 팩토리
 */

import type { AppBindings } from '../api/response.js';
import { UnifiedSearchAggregator } from './aggregator.js';
import {
  createCgvUnifiedSearchAdapter,
  createDaisoUnifiedSearchAdapter,
  createMegaboxUnifiedSearchAdapter,
  createOliveyoungUnifiedSearchAdapter,
} from './adapters.js';

export function createUnifiedSearchAggregator(bindings?: AppBindings): UnifiedSearchAggregator {
  return new UnifiedSearchAggregator([
    createDaisoUnifiedSearchAdapter(),
    createOliveyoungUnifiedSearchAdapter(bindings?.ZYTE_API_KEY),
    createMegaboxUnifiedSearchAdapter(),
    createCgvUnifiedSearchAdapter(bindings?.ZYTE_API_KEY),
  ]);
}
