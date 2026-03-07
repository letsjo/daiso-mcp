/**
 * CGV 시간표 정규화 클라이언트 테스트
 */

import { describe, expect, it } from 'vitest';
import { fetchCgvTimetable } from '../../../src/services/cgv/client.js';
import { setupMockFetch } from './clientTestSupport.js';

const mockFetch = setupMockFetch();

describe('fetchCgvTimetable 정규화', () => {
  it('시간표를 정규화하고 시간 포맷을 변환한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV 강남',
              scnYmd: '20260304',
              scnSseq: '2',
              movNo: '30000985',
              movNm: '테스트 영화',
              scnsrtTm: '1230',
              scnendTm: '1443',
              stcnt: '123',
              frSeatCnt: '118',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe('12:30');
    expect(result[0].endTime).toBe('14:43');
    expect(result[0].totalSeats).toBe(123);
    expect(result[0].remainingSeats).toBe(118);
  });

  it('이미 포맷된 시간과 비표준 시간 문자열을 그대로 유지한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV 강남',
              scnYmd: '20260304',
              scnSseq: '9',
              movNo: '30000985',
              movNm: '테스트 영화',
              scnsrtTm: '12:30',
              scnendTm: '12345',
              stcnt: '123',
              frSeatCnt: '118',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe('12:30');
    expect(result[0].endTime).toBe('12345');
  });

  it('시간/좌석 정보가 비어 있으면 기본값으로 정규화한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV 강남',
              scnYmd: '20260304',
              scnSseq: '10',
              movNo: '30000985',
              movNm: '테스트 영화',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe('');
    expect(result[0].endTime).toBe('');
    expect(result[0].totalSeats).toBe(0);
    expect(result[0].remainingSeats).toBe(0);
  });

  it('응답 필드 일부가 비어 있어도 기본값으로 정규화한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              scnYmd: '20260304',
              movNo: '30000985',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toHaveLength(1);
    expect(result[0].scheduleId).toBe('202603040056');
    expect(result[0].movieName).toBe('');
    expect(result[0].theaterName).toBe('');
    expect(result[0].playDate).toBe('20260304');
  });

  it('좌석 수 문자열이 숫자가 아니면 0으로 처리한다', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV 강남',
              scnYmd: '20260304',
              scnSseq: '11',
              movNo: '30000985',
              movNm: '테스트 영화',
              scnsrtTm: '1230',
              scnendTm: '1440',
              stcnt: 'abc',
              frSeatCnt: 'xyz',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: '30000985',
    });

    expect(result).toHaveLength(1);
    expect(result[0].totalSeats).toBe(0);
    expect(result[0].remainingSeats).toBe(0);
  });

  it('movieCode 조회에서 필수 필드가 없는 항목은 제외한다', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode: 0, data: [] })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 0,
            data: [
              { siteNo: '0056', scnYmd: '20260304', movNm: '누락-movNo' },
              { movNo: 'M1', scnYmd: '20260304', movNm: '누락-siteNo' },
              { siteNo: '0056', movNo: 'M1', movNm: '누락-scnYmd' },
              { siteNo: '0056', scnYmd: '20260304', movNo: 'M1' },
            ],
          }),
        ),
      );

    const result = await fetchCgvTimetable({
      playDate: '20260304',
      theaterCode: '0056',
      movieCode: 'M1',
    });

    expect(result).toHaveLength(1);
    expect(result[0].movieCode).toBe('M1');
  });

  it('movieCode가 없으면 사이트 기준 시간표를 우선 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 0,
          statusMessage: '조회 되었습니다.',
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV 강남',
              scnYmd: '20260304',
              scnSseq: '2',
              movNo: '30000986',
              movNm: '둘째 영화',
              scnsrtTm: '1230',
              scnendTm: '1443',
              stcnt: '123',
              frtmpSeatCnt: '99',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toHaveLength(1);
    expect(result[0].movieCode).toBe('30000986');
    expect(result[0].remainingSeats).toBe(99);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(String(mockFetch.mock.calls[0][0])).toContain('/cnm/atkt/searchMovScnInfo');
  });

  it('사이트 시간표에서 prodNm/frtmpSeatCnt 분기를 정규화한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 0,
          data: [
            {
              siteNo: '0056',
              siteNm: '',
              scnYmd: '20260304',
              movNo: '',
              prodNm: '상품명 기반 영화',
              scnsrtTm: '1010',
              scnendTm: '1210',
              stcnt: '150',
              frtmpSeatCnt: '70',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toHaveLength(1);
    expect(result[0].movieName).toBe('상품명 기반 영화');
    expect(result[0].remainingSeats).toBe(70);
    expect(result[0].theaterName).toBe('');
  });

  it('사이트 시간표에서 movieName/좌석 기본값 분기를 처리한다', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 0,
          data: [
            {
              siteNo: '0056',
              siteNm: 'CGV 강남',
              scnYmd: '20260304',
              movNo: 'M9',
              scnsrtTm: '0900',
              scnendTm: '1030',
              stcnt: '80',
            },
          ],
        }),
      ),
    );

    const result = await fetchCgvTimetable({ playDate: '20260304', theaterCode: '0056' });

    expect(result).toHaveLength(1);
    expect(result[0].scheduleId).toBe('202603040056');
    expect(result[0].movieName).toBe('');
    expect(result[0].remainingSeats).toBe(0);
  });
});
