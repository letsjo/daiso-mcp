/**
 * 상영 회차 필터/정렬 공통 유틸리티
 */

export type ShowtimeSort = 'startTime-asc' | 'remainingSeats-desc' | 'remainingSeats-asc';

interface ShowtimeLike {
  startTime: string;
  remainingSeats: number;
  theaterName: string;
}

const SUPPORTED_SHOWTIME_SORTS: ShowtimeSort[] = [
  'startTime-asc',
  'remainingSeats-desc',
  'remainingSeats-asc',
];

function compareByStartTime(left: ShowtimeLike, right: ShowtimeLike): number {
  if (left.startTime === right.startTime) {
    return left.theaterName.localeCompare(right.theaterName);
  }

  return left.startTime.localeCompare(right.startTime);
}

export function normalizeMinRemainingSeats(value?: number): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error('minRemainingSeats는 0 이상의 정수여야 합니다.');
  }

  return value;
}

export function normalizeShowtimeSort(sort?: string): ShowtimeSort {
  if (!sort) {
    return 'startTime-asc';
  }

  if (SUPPORTED_SHOWTIME_SORTS.includes(sort as ShowtimeSort)) {
    return sort as ShowtimeSort;
  }

  throw new Error(
    'sort는 startTime-asc, remainingSeats-desc, remainingSeats-asc 중 하나여야 합니다.',
  );
}

export function filterAndSortShowtimes<T extends ShowtimeLike>(
  items: T[],
  options: { minRemainingSeats?: number; sort?: ShowtimeSort; limit: number },
): T[] {
  const minRemainingSeats = normalizeMinRemainingSeats(options.minRemainingSeats);
  const sort = normalizeShowtimeSort(options.sort);

  return items
    .filter((item) =>
      minRemainingSeats !== undefined ? item.remainingSeats >= minRemainingSeats : true,
    )
    .sort((left, right) => {
      if (sort === 'remainingSeats-desc' && left.remainingSeats !== right.remainingSeats) {
        return right.remainingSeats - left.remainingSeats;
      }

      if (sort === 'remainingSeats-asc' && left.remainingSeats !== right.remainingSeats) {
        return left.remainingSeats - right.remainingSeats;
      }

      return compareByStartTime(left, right);
    })
    .slice(0, options.limit);
}
