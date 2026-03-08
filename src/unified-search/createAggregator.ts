/**
 * 통합 검색 aggregator 팩토리
 */

import { UnifiedSearchAggregator } from './aggregator.js';
import {
  createCgvUnifiedSearchAdapter,
  createDaisoUnifiedSearchAdapter,
  createMegaboxUnifiedSearchAdapter,
  createOliveyoungUnifiedSearchAdapter,
} from './adapters.js';

export interface UnifiedSearchAggregatorOptions {
  zyteApiKey?: string;
}

export function createUnifiedSearchAggregator(
  options: UnifiedSearchAggregatorOptions = {},
): UnifiedSearchAggregator {
  return new UnifiedSearchAggregator([
    createDaisoUnifiedSearchAdapter(),
    createOliveyoungUnifiedSearchAdapter(options.zyteApiKey),
    createMegaboxUnifiedSearchAdapter(),
    createCgvUnifiedSearchAdapter(options.zyteApiKey),
  ]);
}
