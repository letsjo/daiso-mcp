/**
 * 통합 검색 MCP 도구 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMultiSearchTool } from '../../../../src/services/multi/tools/multiSearch.js';
import { createMockProductResponse } from '../../../api/testHelpers.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createMultiSearchTool', () => {
  it('올바른 도구 정의를 반환한다', () => {
    const tool = createMultiSearchTool();

    expect(tool.name).toBe('multi_search');
    expect(tool.metadata.title).toBe('통합 검색');
  });

  it('서비스별 그룹 결과를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          createMockProductResponse([{ PD_NO: 'P1', PDNM: '정리함', PD_PRC: '1000' }], 1),
        ),
      ),
    );

    const tool = createMultiSearchTool();
    const result = await tool.handler({
      query: '정리함',
      services: ['daiso'],
      types: ['product'],
      limitPerService: 2,
      timeoutMs: 2000,
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.data.results.daiso.products).toHaveLength(1);
    expect(parsed.meta.limitPerService).toBe(2);
    expect(parsed.meta.timeoutMs).toBe(2000);
  });

  it('검색어가 비어 있으면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '   ' })).rejects.toThrow('검색어를 입력해주세요.');
  });

  it('limitPerService가 잘못되면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '정리함', limitPerService: 0 })).rejects.toThrow(
      'limitPerService는 1 이상의 정수여야 합니다.',
    );
  });

  it('timeoutMs가 잘못되면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '정리함', timeoutMs: 0 })).rejects.toThrow(
      'timeoutMs는 1 이상의 정수여야 합니다.',
    );
  });
});
