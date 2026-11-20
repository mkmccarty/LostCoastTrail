import { getDaylightForDate, formatMinutesAsTime } from './solarUtils';
import { addDaysYMD } from './permitUtils';

export interface TidePoint {
  timeStr: string; // "YYYY-MM-DD HH:MM"
  dateStr: string; // "YYYY-MM-DD"
  minutes: number; // 0..1434
  heightFt: number;
  slopeFtPerHr: number; // negative = receding, positive = rising
}

export interface TideExtreme {
  timeStr: string;
  dateStr: string;
  minutes: number;
  heightFt: number;
  type: 'H' | 'L';
}

export interface DayTideData {
  dateStr: string;
  points: TidePoint[];
  extremes: TideExtreme[];
}

export interface ZoneCrossingEvaluation {
  status: 'SAFE' | 'TIGHT' | 'IMPASSABLE';
  entryMinutes: number | null;
  enterByMinutes: number | null;
  exitMinutes: number | null;
  entryTimeLabel: string;
  enterByDeadlineLabel: string;
  exitTimeLabel: string;
  minTideFt: number | null;
  windowDurationHours: number;
  isRecedingAtEntry: boolean;
  reason: string;
}

export interface TideFetchResult {
  source: 'noaa' | 'offline-estimate';
  stationId: string;
  stationName: string;
  byDate: Record<string, DayTideData>;
  error?: string;
}

const NOAA_STATION_ID = '9418024';
const NOAA_STATION_NAME = 'Shelter Cove, CA';

const cache = new Map<string, TideFetchResult>();
const annualCache = new Map<number, TideFetchResult>();

function toNoaaDate(ymd: string): string {
  return ymd.replace(/-/g, '');
}

function parseNoaaTimestamp(t: string): { dateStr: string; minutes: number } {
  const [dateStr, hm] = t.split(' ');
  const [h, m] = hm.split(':').map(Number);
  return { dateStr, minutes: h * 60 + m };
}

/**
 * Fallback synthetic harmonic tide generator if NOAA API is unreachable offline.
 */
function generateOfflineEstimate(startDate: string, endDate: string): TideFetchResult {
  const byDate: Record<string, DayTideData> = {};
  let curr = startDate;
  let dayIdx = 0;

  while (curr <= endDate) {
    const points: TidePoint[] = [];
    const phaseShift = dayIdx * 0.85; // ~50 min/day tidal progression

    for (let m = 0; m < 1440; m += 6) {
      const tHr = m / 60;
      const m2 = 2.3 * Math.cos(((tHr - phaseShift) * 2 * Math.PI) / 12.42);
      const k1 = 1.3 * Math.cos(((tHr - phaseShift * 0.5 - 2) * 2 * Math.PI) / 23.93);
      const heightFt = Math.round((3.2 + m2 + k1) * 100) / 100;
      points.push({
        timeStr: `${curr} ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
        dateStr: curr,
        minutes: m,
        heightFt,
        slopeFtPerHr: 0,
      });
    }

    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const dtHr = (next.minutes - prev.minutes) / 60 || 0.1;
      points[i].slopeFtPerHr = (next.heightFt - prev.heightFt) / dtHr;
    }

    const extremes: TideExtreme[] = [];
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i - 1].heightFt;
      const b = points[i].heightFt;
      const c = points[i + 1].heightFt;
      if (b > a && b >= c) {
        extremes.push({
          timeStr: points[i].timeStr,
          dateStr: curr,
          minutes: points[i].minutes,
          heightFt: b,
          type: 'H',
        });
      } else if (b < a && b <= c) {
        extremes.push({
          timeStr: points[i].timeStr,
          dateStr: curr,
          minutes: points[i].minutes,
          heightFt: b,
          type: 'L',
        });
      }
    }

    byDate[curr] = { dateStr: curr, points, extremes };
    curr = addDaysYMD(curr, 1);
    dayIdx++;
  }

  return {
    source: 'offline-estimate',
    stationId: NOAA_STATION_ID,
    stationName: NOAA_STATION_NAME,
    byDate,
    error: 'Could not reach NOAA CO-OPS API; showing offline harmonic estimate.',
  };
}

export async function fetchShelterCoveTides(
  startDate: string,
  endDate: string
): Promise<TideFetchResult> {
  const key = `${startDate}_${endDate}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const begin = toNoaaDate(startDate);
  const end = toNoaaDate(endDate);

  const baseUrl =
    'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter' +
    `?begin_date=${begin}&end_date=${end}&station=${NOAA_STATION_ID}` +
    '&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&format=json';

  try {
    const [curveRes, hiloRes] = await Promise.all([
      fetch(`${baseUrl}&interval=6`),
      fetch(`${baseUrl}&interval=hilo`),
    ]);

    if (!curveRes.ok || !hiloRes.ok) {
      throw new Error(`NOAA HTTP ${curveRes.status}/${hiloRes.status}`);
    }

    const curveJson = (await curveRes.json()) as {
      predictions?: Array<{ t: string; v: string }>;
      error?: { message: string };
    };
    const hiloJson = (await hiloRes.json()) as {
      predictions?: Array<{ t: string; v: string; type: 'H' | 'L' }>;
      error?: { message: string };
    };

    if (curveJson.error || !curveJson.predictions?.length) {
      throw new Error(curveJson.error?.message || 'Empty NOAA curve response');
    }

    const byDate: Record<string, DayTideData> = {};
    let curr = startDate;
    while (curr <= endDate) {
      byDate[curr] = { dateStr: curr, points: [], extremes: [] };
      curr = addDaysYMD(curr, 1);
    }

    const allPoints: TidePoint[] = curveJson.predictions.map((p) => {
      const { dateStr, minutes } = parseNoaaTimestamp(p.t);
      return {
        timeStr: p.t,
        dateStr,
        minutes,
        heightFt: parseFloat(p.v),
        slopeFtPerHr: 0,
      };
    });

    for (let i = 0; i < allPoints.length; i++) {
      const prev = allPoints[Math.max(0, i - 1)];
      const next = allPoints[Math.min(allPoints.length - 1, i + 1)];
      const dtHr = i === 0 || i === allPoints.length - 1 ? 0.1 : 0.2;
      allPoints[i].slopeFtPerHr = (next.heightFt - prev.heightFt) / dtHr;
      if (byDate[allPoints[i].dateStr]) {
        byDate[allPoints[i].dateStr].points.push(allPoints[i]);
      }
    }

    for (const h of hiloJson.predictions ?? []) {
      const { dateStr, minutes } = parseNoaaTimestamp(h.t);
      if (byDate[dateStr]) {
        byDate[dateStr].extremes.push({
          timeStr: h.t,
          dateStr,
          minutes,
          heightFt: parseFloat(h.v),
          type: h.type,
        });
      }
    }

    const result: TideFetchResult = {
      source: 'noaa',
      stationId: NOAA_STATION_ID,
      stationName: NOAA_STATION_NAME,
      byDate,
    };
    cache.set(key, result);
    return result;
  } catch (err) {
    const fallback = generateOfflineEstimate(startDate, endDate);
    fallback.error =
      err instanceof Error
        ? `NOAA API unavailable (${err.message}); showing offline estimate.`
        : 'NOAA API unavailable; showing offline estimate.';
    return fallback;
  }
}

/**
 * Fetches a full year (+6 days into Jan of next year) of hourly NOAA predictions
 * for the annual calendar rating view.
 */
export async function fetchAnnualHourlyTides(year: number): Promise<TideFetchResult> {
  const cached = annualCache.get(year);
  if (cached) return cached;

  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-06`;
  const begin = toNoaaDate(startDate);
  const end = toNoaaDate(endDate);

  const url =
    'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter' +
    `?begin_date=${begin}&end_date=${end}&station=${NOAA_STATION_ID}` +
    '&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&format=json&interval=h';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NOAA HTTP ${res.status}`);
    const json = (await res.json()) as {
      predictions?: Array<{ t: string; v: string }>;
      error?: { message: string };
    };
    if (json.error || !json.predictions?.length) {
      throw new Error(json.error?.message || 'Empty annual NOAA response');
    }

    const byDate: Record<string, DayTideData> = {};
    const allPoints: TidePoint[] = json.predictions.map((p) => {
      const { dateStr, minutes } = parseNoaaTimestamp(p.t);
      return {
        timeStr: p.t,
        dateStr,
        minutes,
        heightFt: parseFloat(p.v),
        slopeFtPerHr: 0,
      };
    });

    for (let i = 0; i < allPoints.length; i++) {
      const prev = allPoints[Math.max(0, i - 1)];
      const next = allPoints[Math.min(allPoints.length - 1, i + 1)];
      const dtHr = i === 0 || i === allPoints.length - 1 ? 1.0 : 2.0;
      allPoints[i].slopeFtPerHr = (next.heightFt - prev.heightFt) / dtHr;
      if (!byDate[allPoints[i].dateStr]) {
        byDate[allPoints[i].dateStr] = { dateStr: allPoints[i].dateStr, points: [], extremes: [] };
      }
      byDate[allPoints[i].dateStr].points.push(allPoints[i]);
    }

    const result: TideFetchResult = {
      source: 'noaa',
      stationId: NOAA_STATION_ID,
      stationName: NOAA_STATION_NAME,
      byDate,
    };
    annualCache.set(year, result);
    return result;
  } catch (err) {
    const fallback = generateOfflineEstimate(startDate, endDate);
    fallback.error =
      err instanceof Error
        ? `NOAA API unavailable (${err.message}); showing offline estimate.`
        : 'NOAA API unavailable; showing offline estimate.';
    return fallback;
  }
}

/**
 * Evaluates whether a daylight passable window exists on `dateStr` for a given
 * zone threshold (ft MLLW) and crossing duration (hours at 1 mph).
 */
export function evaluateZoneCrossing(
  dayData: DayTideData | undefined,
  dateStr: string,
  thresholdFt: number,
  crossingHours: number
): ZoneCrossingEvaluation {
  if (!dayData || dayData.points.length === 0) {
    return {
      status: 'IMPASSABLE',
      entryMinutes: null,
      enterByMinutes: null,
      exitMinutes: null,
      entryTimeLabel: '—',
      enterByDeadlineLabel: '—',
      exitTimeLabel: '—',
      minTideFt: null,
      windowDurationHours: 0,
      isRecedingAtEntry: false,
      reason: 'No tide data loaded for this date.',
    };
  }

  const daylight = getDaylightForDate(dateStr);
  const pts = dayData.points;
  const needMinutes = crossingHours * 60;

  // Find contiguous daylight intervals where heightFt <= thresholdFt
  interface Window {
    startIdx: number;
    endIdx: number;
    startMin: number;
    endMin: number;
    durationMin: number;
    minHeight: number;
    entrySlope: number;
  }

  const daylightWindows: Window[] = [];
  let inWin = false;
  let startIdx = 0;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const isDay = p.minutes >= daylight.sunriseMinutes && p.minutes <= daylight.sunsetMinutes;
    const ok = isDay && p.heightFt <= thresholdFt;
    if (ok && !inWin) {
      inWin = true;
      startIdx = i;
    } else if (!ok && inWin) {
      inWin = false;
      const endIdx = i - 1;
      const slice = pts.slice(startIdx, endIdx + 1);
      daylightWindows.push({
        startIdx,
        endIdx,
        startMin: pts[startIdx].minutes,
        endMin: pts[endIdx].minutes,
        durationMin: pts[endIdx].minutes - pts[startIdx].minutes,
        minHeight: Math.min(...slice.map((s) => s.heightFt)),
        entrySlope: pts[startIdx].slopeFtPerHr,
      });
    }
  }
  if (inWin) {
    const endIdx = pts.length - 1;
    const slice = pts.slice(startIdx, endIdx + 1);
    daylightWindows.push({
      startIdx,
      endIdx,
      startMin: pts[startIdx].minutes,
      endMin: pts[endIdx].minutes,
      durationMin: pts[endIdx].minutes - pts[startIdx].minutes,
      minHeight: Math.min(...slice.map((s) => s.heightFt)),
      entrySlope: pts[startIdx].slopeFtPerHr,
    });
  }

  if (daylightWindows.length === 0) {
    // Check if there was a nighttime low tide under threshold
    const nightLow = pts.some((p) => p.heightFt <= thresholdFt);
    const minAny = Math.min(...pts.map((p) => p.heightFt));
    return {
      status: 'IMPASSABLE',
      entryMinutes: null,
      enterByMinutes: null,
      exitMinutes: null,
      entryTimeLabel: 'None',
      enterByDeadlineLabel: 'None',
      exitTimeLabel: '—',
      minTideFt: Math.round(minAny * 10) / 10,
      windowDurationHours: 0,
      isRecedingAtEntry: false,
      reason: nightLow
        ? `Low tide under ${thresholdFt.toFixed(1)} ft only occurs at night (BLM advises against night hiking).`
        : `Tide never drops below ${thresholdFt.toFixed(1)} ft on this date (min ${minAny.toFixed(1)} ft).`,
    };
  }

  // Pick the longest daylight window
  daylightWindows.sort((a, b) => b.durationMin - a.durationMin);
  const best = daylightWindows[0];
  const durationHours = Math.round((best.durationMin / 60) * 10) / 10;

  // Optimal entry: start of window (receding), or if window starts right at sunrise, start at sunrise
  const entryMinutes = best.startMin;
  const enterByMinutes = Math.max(best.startMin, best.endMin - needMinutes);
  const exitMinutes = entryMinutes + needMinutes;
  const isRecedingAtEntry = best.entrySlope <= 0.05;

  if (best.durationMin >= needMinutes) {
    // Check if there's comfortable margin (>= 30 min) and receding entry
    const marginMin = best.durationMin - needMinutes;
    const status = marginMin >= 30 && isRecedingAtEntry ? 'SAFE' : 'TIGHT';
    return {
      status,
      entryMinutes,
      enterByMinutes,
      exitMinutes,
      entryTimeLabel: formatMinutesAsTime(entryMinutes),
      enterByDeadlineLabel: formatMinutesAsTime(enterByMinutes),
      exitTimeLabel: formatMinutesAsTime(exitMinutes),
      minTideFt: Math.round(best.minHeight * 10) / 10,
      windowDurationHours: durationHours,
      isRecedingAtEntry,
      reason:
        status === 'SAFE'
          ? `${durationHours.toFixed(1)} hr daylight window under ${thresholdFt.toFixed(1)} ft · Receding at entry (+${Math.round(marginMin)}m buffer).`
          : `${durationHours.toFixed(1)} hr daylight window under ${thresholdFt.toFixed(1)} ft · Tight margin (${Math.round(marginMin)}m buffer${!isRecedingAtEntry ? ', rising tide at entry' : ''}).`,
    };
  }

  // Window exists in daylight, but shorter than crossingHours at 1 mph
  if (best.durationMin >= needMinutes * 0.8) {
    return {
      status: 'TIGHT',
      entryMinutes,
      enterByMinutes: entryMinutes,
      exitMinutes: best.endMin,
      entryTimeLabel: formatMinutesAsTime(entryMinutes),
      enterByDeadlineLabel: formatMinutesAsTime(entryMinutes),
      exitTimeLabel: formatMinutesAsTime(best.endMin),
      minTideFt: Math.round(best.minHeight * 10) / 10,
      windowDurationHours: durationHours,
      isRecedingAtEntry,
      reason: `Only ${durationHours.toFixed(1)} hr daylight window under ${thresholdFt.toFixed(1)} ft (1 mph pace needs ${crossingHours.toFixed(1)} hr).`,
    };
  }

  return {
    status: 'IMPASSABLE',
    entryMinutes: null,
    enterByMinutes: null,
    exitMinutes: null,
    entryTimeLabel: 'Too short',
    enterByDeadlineLabel: '—',
    exitTimeLabel: '—',
    minTideFt: Math.round(best.minHeight * 10) / 10,
    windowDurationHours: durationHours,
    isRecedingAtEntry,
    reason: `Daylight window is only ${durationHours.toFixed(1)} hr under ${thresholdFt.toFixed(1)} ft (need ${crossingHours.toFixed(1)} hr at 1 mph) — Move dates.`,
  };
}
