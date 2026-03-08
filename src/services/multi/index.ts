/**
 * 통합 검색 서비스 프로바이더
 */

import type { ServiceProvider } from '../../core/interfaces.js';
import type { ServiceMetadata, ToolRegistration } from '../../core/types.js';
import { createMultiSearchTool } from './tools/multiSearch.js';

const MULTI_METADATA: ServiceMetadata = {
  id: 'multi',
  name: '통합 검색',
  version: '1.0.0',
  description: '여러 서비스를 한 번에 조회하는 통합 검색 서비스',
};

class MultiService implements ServiceProvider {
  constructor(private readonly options: { zyteApiKey?: string } = {}) {}

  readonly metadata = MULTI_METADATA;

  getTools(): ToolRegistration[] {
    return [createMultiSearchTool(this.options.zyteApiKey)];
  }
}

export function createMultiService(options: { zyteApiKey?: string } = {}): ServiceProvider {
  return new MultiService(options);
}
