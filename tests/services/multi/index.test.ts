/**
 * 통합 검색 서비스 테스트
 */

import { describe, expect, it } from 'vitest';
import { createMultiService } from '../../../src/services/multi/index.js';

describe('createMultiService', () => {
  it('ServiceProvider 인터페이스를 구현한 객체를 반환한다', () => {
    const service = createMultiService();

    expect(service.metadata).toBeDefined();
    expect(service.getTools).toBeDefined();
    expect(typeof service.getTools).toBe('function');
  });

  it('올바른 메타데이터를 가진다', () => {
    const service = createMultiService();

    expect(service.metadata.id).toBe('multi');
    expect(service.metadata.name).toBe('통합 검색');
    expect(service.metadata.version).toBe('1.0.0');
    expect(service.metadata.description).toBeDefined();
  });

  it('multi_search 도구를 반환한다', () => {
    const service = createMultiService({ zyteApiKey: 'test-key' });
    const tools = service.getTools();

    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe('multi_search');
  });
});
