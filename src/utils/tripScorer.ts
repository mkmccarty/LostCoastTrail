import { Direction, getItinerary, ZONE_BY_ID } from '../data/trailData';
import { addDaysYMD } from './permitUtils';
import { DayTideData, evaluateZoneCrossing } from './tideService';
import { formatMinutesAsTime, getDaylightForDate } from './solarUtils';

export interface CandidateStartSummary {
  startDateStr: string;
  safeCount: number;
  tightCount: number;
  impassableCount: number;
  totalZones: number;
  score: number;
  stars: 0 | 1 | 2 | 3;
  minEdgeBufferMin: number | null;
  ratingLabel: string;
  isBest: boolean;
  /** Quick preview of Zone 2 (hardest gate) entry time & min tide */
  zone2Preview: string;
  overallStatus: 'SAFE' | 'TIGHT' | 'IMPASSABLE';
}

function formatBuffer(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

/**
 * Evaluates a 7-day window [-3 .. +3] around `centerDateStr` for the given
 * `tripDays` and `direction`, scoring each start date by zone passability
 * and assigning a 1–3 star rating based on how comfortably mid-day the
 * crossings are relative to sunrise and sunset.
 */
export function evaluateCandidateDates(
  centerDateStr: string,
  tripDays: number,
  direction: Direction,
  tidesByDate: Record<string, DayTideData>
): CandidateStartSummary[] {
  const itinerary = getItinerary(tripDays, direction);
  const candidates: CandidateStartSummary[] = [];

  for (let offset = -3; offset <= 3; offset++) {
    const startDateStr = addDaysYMD(centerDateStr, offset);
    let safeCount = 0;
    let tightCount = 0;
    let impassableCount = 0;
    let totalZones = 0;
    let score = 0;
    let zone2Preview = '—';
    let minEdgeBufferMin: number | null = null;

    for (let dayIdx = 0; dayIdx < itinerary.length; dayIdx++) {
      const day = itinerary[dayIdx];
      const dateStr = addDaysYMD(startDateStr, dayIdx);
      const dayData = tidesByDate[dateStr];
      const daylight = getDaylightForDate(dateStr);

      for (const zId of day.zonesCrossed) {
        totalZones++;
        const zone = ZONE_BY_ID[zId];
        const ev = evaluateZoneCrossing(dayData, dateStr, zone.thresholdFt, zone.crossingHours);

        if (ev.status === 'SAFE') {
          safeCount++;
          score += 100;
        } else if (ev.status === 'TIGHT') {
          tightCount++;
          score += 45;
        } else {
          impassableCount++;
          score -= 120;
        }

        if (ev.entryMinutes !== null && ev.exitMinutes !== null) {
          const afterSunrise = ev.entryMinutes - daylight.sunriseMinutes;
          const beforeSunset = daylight.sunsetMinutes - ev.exitMinutes;
          const edgeBuffer = Math.min(afterSunrise, beforeSunset);

          minEdgeBufferMin =
            minEdgeBufferMin === null ? edgeBuffer : Math.min(minEdgeBufferMin, edgeBuffer);

          // Reward comfortable mid-day windows (farther from sunrise & sunset)
          score += Math.max(0, Math.min(180, edgeBuffer)) * 0.25;

          if (ev.isRecedingAtEntry) {
            score += 10;
          }
        }

        if (zId === 'zone-2') {
          zone2Preview =
            ev.entryMinutes !== null
              ? `Z2 ${formatMinutesAsTime(ev.entryMinutes).replace(':00 ', '')} (${ev.minTideFt?.toFixed(1)}ft)`
              : 'Z2 Impassable';
        }
      }
    }

    const overallStatus: CandidateStartSummary['overallStatus'] =
      impassableCount > 0 ? 'IMPASSABLE' : tightCount > 0 ? 'TIGHT' : 'SAFE';

    let stars: 0 | 1 | 2 | 3 = 0;
    let ratingLabel = 'Impassable';

    if (impassableCount === 0 && minEdgeBufferMin !== null) {
      if (minEdgeBufferMin >= 90 && tightCount === 0) {
        stars = 3;
        ratingLabel = `Mid-day (${formatBuffer(minEdgeBufferMin)} from sunrise/sunset)`;
      } else if (minEdgeBufferMin >= 30) {
        stars = 2;
        ratingLabel = `Good (${formatBuffer(minEdgeBufferMin)} from sunrise/sunset)`;
      } else {
        stars = 1;
        ratingLabel = `Near dawn/dusk (${formatBuffer(minEdgeBufferMin)} buffer)`;
      }
    }

    candidates.push({
      startDateStr,
      safeCount,
      tightCount,
      impassableCount,
      totalZones,
      score,
      stars,
      minEdgeBufferMin,
      ratingLabel,
      isBest: false,
      zone2Preview,
      overallStatus,
    });
  }

  const maxScore = Math.max(...candidates.map((c) => c.score));
  for (const c of candidates) {
    if (c.score === maxScore && c.impassableCount === 0) {
      c.isBest = true;
    } else if (c.score === maxScore && candidates.every((x) => x.impassableCount > 0)) {
      c.isBest = true;
    }
  }

  return candidates;
}
