/**
 * 통합 검색 MCP 도구 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMultiSearchTool } from '../../../../src/services/multi/tools/multiSearch.js';
import { createMockProductResponse } from '../../../api/testHelpers.js';
import {
  LIMIT_PER_SERVICE_ERROR_MESSAGE,
  TIMEOUT_MS_ERROR_MESSAGE,
} from '../../../../src/unified-search/constants.js';
import { encodeUnifiedSearchCursor } from '../../../../src/unified-search/cursor.js';

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
    expect(parsed.meta.services.daiso.products).toEqual({
      returnedCount: 1,
      truncated: false,
      sortApplied: 'service-default',
    });
  });

  it('검색어가 비어 있으면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '   ' })).rejects.toThrow('검색어를 입력해주세요.');
  });

  it('daiso product cursor가 들어오면 다음 페이지를 조회한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          createMockProductResponse([{ PD_NO: 'P6', PDNM: '정리함 6', PD_PRC: '1000' }], 11),
        ),
      ),
    );

    const tool = createMultiSearchTool();
    const cursor = encodeUnifiedSearchCursor({
      v: 1,
      service: 'daiso',
      bucket: 'products',
      query: '정리함',
      limitPerService: 5,
      page: 2,
    });

    const result = await tool.handler({
      cursor,
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.data.query).toBe('정리함');
    expect(parsed.data.results.daiso.products).toHaveLength(1);
    expect(parsed.meta.services.daiso.products.nextCursor).toBe(
      encodeUnifiedSearchCursor({
        v: 1,
        service: 'daiso',
        bucket: 'products',
        query: '정리함',
        limitPerService: 5,
        page: 3,
      }),
    );
    expect(mockFetch.mock.calls[0][0]).toContain('pageNum=2');
  });

  it('미구현 oliveyoung cursor는 CURSOR_NOT_IMPLEMENTED를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(
      tool.handler({
        cursor: encodeUnifiedSearchCursor({
          v: 1,
          service: 'oliveyoung',
          bucket: 'products',
          query: '선크림',
          limitPerService: 5,
          page: 2,
        }),
      }),
    ).rejects.toThrow('continuation cursor는 아직 구현되지 않았습니다.');
  });

  it('limitPerService가 잘못되면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '정리함', limitPerService: 0 })).rejects.toThrow(
      LIMIT_PER_SERVICE_ERROR_MESSAGE,
    );
  });

  it('timeoutMs가 잘못되면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '정리함', timeoutMs: 0 })).rejects.toThrow(
      TIMEOUT_MS_ERROR_MESSAGE,
    );
  });

  it('limitPerService가 최대치를 넘으면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '정리함', limitPerService: 51 })).rejects.toThrow(
      LIMIT_PER_SERVICE_ERROR_MESSAGE,
    );
  });

  it('timeoutMs가 최대치를 넘으면 에러를 던진다', async () => {
    const tool = createMultiSearchTool();

    await expect(tool.handler({ query: '정리함', timeoutMs: 30001 })).rejects.toThrow(
      TIMEOUT_MS_ERROR_MESSAGE,
    );
  });
});
