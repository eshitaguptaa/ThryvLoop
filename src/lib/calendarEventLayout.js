import {
  getEventDaySegmentMinutes,
  parseCalendarDateTime,
  parseInstant,
} from '@/lib/calendarDateUtils';

/** @param {Date | number} aStart @param {Date | number} aEnd @param {Date | number} bStart @param {Date | number} bEnd */
export function eventsTimeRangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aEnd > bStart && aStart < bEnd;
}

/**
 * @param {{ id?: string, startsAt: string, endsAt: string }} candidate
 * @param {Array<{ id?: string, startsAt: string, endsAt: string }>} existing
 * @param {string} [excludeId]
 */
export function findOverlappingEvents(candidate, existing, excludeId) {
  const start = parseCalendarDateTime(candidate.startsAt).getTime();
  const end = parseCalendarDateTime(candidate.endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return [];

  return existing.filter((ev) => {
    if (excludeId && ev.id === excludeId) return false;
    const evStart = parseInstant(ev.startsAt).getTime();
    const evEnd = parseInstant(ev.endsAt).getTime();
    return eventsTimeRangesOverlap(start, end, evStart, evEnd);
  });
}

/**
 * Assign side-by-side columns for overlapping events on one day (week grid).
 * @param {Array<{ id?: string, startsAt: string, endsAt: string, source?: string }>} events
 * @param {Date} day
 * @param {{ hourStart?: number, hourCount?: number }} grid
 */
export function layoutDayEventsForGrid(events, day, grid) {
  /** @type {Array<{ ev: object, clampStart: number, clampEnd: number, column: number, totalColumns: number }>} */
  const items = events
    .map((ev) => {
      const segment = getEventDaySegmentMinutes(ev, day, grid);
      if (!segment) return null;
      return { ev, ...segment, column: 0, totalColumns: 1 };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.clampStart - b.clampStart ||
        b.clampEnd - b.clampStart - (a.clampEnd - a.clampStart)
    );

  /** @type {typeof items} */
  let cluster = [];
  let clusterEnd = 0;
  /** @type {typeof items} */
  const laidOut = [];

  const flushCluster = () => {
    if (!cluster.length) return;
    /** @type {number[]} */
    const columnEnds = [];
    for (const item of cluster) {
      let col = columnEnds.findIndex((end) => end <= item.clampStart);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(item.clampEnd);
      } else {
        columnEnds[col] = item.clampEnd;
      }
      item.column = col;
    }
    const totalColumns = columnEnds.length;
    for (const item of cluster) {
      item.totalColumns = totalColumns;
      laidOut.push(item);
    }
    cluster = [];
    clusterEnd = 0;
  };

  for (const item of items) {
    if (!cluster.length || item.clampStart < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.clampEnd);
    } else {
      flushCluster();
      cluster.push(item);
      clusterEnd = item.clampEnd;
    }
  }
  flushCluster();

  return laidOut;
}
