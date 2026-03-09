/**
 * 상영 시작 시각 범위 필터 공통 유틸리티
 */

const TIME_WINDOW_PATTERN = /^(?:[01]\d|2[0-3])[0-5]\d$/;

export interface TimeWindow {
  fromTime?: string;
  toTime?: string;
}

export function normalizeTimeWindow(window: TimeWindow): TimeWindow {
  const fromTime = window.fromTime?.trim() || undefined;
  const toTime = window.toTime?.trim() || undefined;

  if (fromTime && !TIME_WINDOW_PATTERN.test(fromTime)) {
    throw new Error('fromTime은 HHMM 형식이어야 합니다.');
  }

  if (toTime && !TIME_WINDOW_PATTERN.test(toTime)) {
    throw new Error('toTime은 HHMM 형식이어야 합니다.');
  }

  if (fromTime && toTime && fromTime > toTime) {
    throw new Error('fromTime은 toTime보다 늦을 수 없습니다.');
  }

  return { fromTime, toTime };
}

export function matchesTimeWindow(startTime: string, window: TimeWindow): boolean {
  const { fromTime, toTime } = window;

  if (fromTime && startTime < fromTime) {
    return false;
  }

  if (toTime && startTime > toTime) {
    return false;
  }

  return true;
}
