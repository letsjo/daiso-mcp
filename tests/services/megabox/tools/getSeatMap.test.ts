/**
 * 메가박스 좌석맵 조회 도구 테스트
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGetSeatMapTool } from '../../../../src/services/megabox/tools/getSeatMap.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createGetSeatMapTool', () => {
  it('올바른 도구 정의를 반환한다', () => {
    const tool = createGetSeatMapTool();

    expect(tool.name).toBe('megabox_get_seat_map');
    expect(tool.metadata.title).toBe('메가박스 좌석맵 조회');
  });

  it('좌석맵을 반환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          movieDtlInfo: {
            playSchdlNo: '2603101372011',
            brchNo: '1372',
            brchNm: '강남',
            theabNo: '03',
            theabNm: '르 리클라이너 3관',
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
              seatZoneCd: 'GERN_ZONE',
              seatClassCd: 'RECLINE_CLS',
              seatExpoAt: 'Y',
              horzCoorVal: 1,
              vertCoorVal: 1,
              seatStatCd: 'GERN_SELL',
            },
          ],
          seatTicketAmtList: [
            {
              ticketKindCd: 'TKA',
              ticketTypeName: '성인',
              clsReclineAmt: 17000,
            },
          ],
        }),
      ),
    );

    const tool = createGetSeatMapTool();
    const result = await tool.handler({ playSchdlNo: '2603101372011' });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.playSchdlNo).toBe('2603101372011');
    expect(parsed.seatMap.summary.totalSeats).toBe(1);
    expect(parsed.seatMap.seats[0].seatLabel).toBe('A1');
  });

  it('좌석맵이 없으면 에러를 던진다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          movieDtlInfo: null,
          seatListSD01: [],
          seatTicketAmtList: [],
        }),
      ),
    );

    const tool = createGetSeatMapTool();
    await expect(tool.handler({ playSchdlNo: 'bad-schedule' })).rejects.toThrow(
      '메가박스 좌석맵을 찾을 수 없습니다.',
    );
  });
});
