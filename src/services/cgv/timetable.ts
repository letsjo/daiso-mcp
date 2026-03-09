/**
 * CGV 시간표 후처리 유틸리티
 */

import type { CgvTimetable } from './types.js';
import { matchesTimeWindow, type TimeWindow } from '../../utils/timeWindow.js';
import { filterAndSortShowtimes, type ShowtimeSort } from '../../utils/showtimeQuery.js';

export function filterAndSortTimetable(
  timetable: CgvTimetable[],
  options: {
    theaterCode?: string;
    movieCode?: string;
    minRemainingSeats?: number;
    sort?: ShowtimeSort;
    limit: number;
  } & TimeWindow,
): CgvTimetable[] {
  const { theaterCode, movieCode, fromTime, toTime, minRemainingSeats, sort, limit } = options;
  const filtered = timetable
    .filter((item) => (theaterCode ? item.theaterCode === theaterCode : true))
    .filter((item) => (movieCode ? item.movieCode === movieCode : true))
    .filter((item) => matchesTimeWindow(item.startTime, { fromTime, toTime }));

  return filterAndSortShowtimes(filtered, {
    minRemainingSeats,
    sort,
    limit,
  });
}
