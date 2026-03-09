/**
 * 메가박스 좌석맵 API 핸들러 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleMegaboxGetSeatMap } from '../../src/api/megaboxHandlers.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createMockContext(query: Record<string, string> = {}) {
  return {
    env: {},
    req: {
      query: (key: string) => query[key],
      param: () => undefined,
    },
    json: vi.fn().mockImplementation((data, status) => ({
      data,
      status: status || 200,
    })),
  } as unknown as Parameters<typeof handleMegaboxGetSeatMap>[0];
}

describe('handleMegaboxGetSeatMap', () => {
  it('메가박스 좌석맵을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          movieDtlInfo: {
            playSchdlNo: '2603101372011',
            brchNo: '1372',
            brchNm: '강남',
            movieNo: '25104501',
            movieNm: '왕과 사는 남자',
            playDe: '20260310',
            playStartTime: '1800',
            playEndTime: '2007',
          },
          maxTicketCnt: '8',
          seatListSD01: [
            {
              seatUniqNo: '00100101',
              rowNm: 'A',
              seatNo: 1,
              rowNo: 1,
              colNo: 1,
              seatExpoAt: 'Y',
              horzCoorVal: 1,
              vertCoorVal: 1,
              seatStatCd: 'GERN_SELL',
            },
          ],
          seatTicketAmtList: [],
        }),
      ),
    );

    const ctx = createMockContext({ playSchdlNo: '2603101372011' });
    await handleMegaboxGetSeatMap(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          playSchdlNo: '2603101372011',
          seatMap: expect.objectContaining({
            summary: expect.objectContaining({ totalSeats: 1 }),
          }),
        }),
      }),
    );
  });

  it('회차 ID가 없으면 400을 반환한다', async () => {
    const ctx = createMockContext({});
    await handleMegaboxGetSeatMap(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { code: 'MISSING_PLAY_SCHEDULE_ID', message: 'playSchdlNo를 입력해주세요.' },
      }),
      400,
    );
  });

  it('좌석맵이 없으면 404를 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          movieDtlInfo: null,
          seatListSD01: [],
          seatTicketAmtList: [],
        }),
      ),
    );

    const ctx = createMockContext({ playSchdlNo: 'bad-schedule' });
    await handleMegaboxGetSeatMap(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'MEGABOX_SEAT_MAP_NOT_FOUND',
          message: '메가박스 좌석맵을 찾을 수 없습니다.',
        },
      }),
      404,
    );
  });

  it('알 수 없는 좌석맵 에러를 500으로 처리한다', async () => {
    mockFetch.mockRejectedValue(null);

    const ctx = createMockContext({ playSchdlNo: '2603101372011' });
    await handleMegaboxGetSeatMap(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'MEGABOX_SEAT_MAP_FETCH_FAILED',
          message: '알 수 없는 오류가 발생했습니다.',
        },
      }),
      500,
    );
  });

  it('좌석맵 조회 에러 메시지를 그대로 반환한다', async () => {
    mockFetch.mockRejectedValue(new Error('seat map fail'));

    const ctx = createMockContext({ playSchdlNo: '2603101372011' });
    await handleMegaboxGetSeatMap(ctx);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'MEGABOX_SEAT_MAP_FETCH_FAILED',
          message: 'seat map fail',
        },
      }),
      500,
    );
  });
});
