import { parseYMD } from './permitUtils';

export interface MonthlyClimateNormal {
  month: number; // 1..12
  monthName: string;
  avgHighF: number;
  avgLowF: number;
  avgRainIn: number;
  rainyDays: number;
  oceanTempF: number;
  summary: string;
}

export interface HistoricalYearSample {
  year: number;
  dateStr: string;
  highF: number;
  lowF: number;
  precipIn: number;
  maxWindMph: number;
}

// Shelter Cove / King Range Coast climate normals (coastal marine climate)
const MONTHLY_NORMALS: MonthlyClimateNormal[] = [
  {
    month: 1,
    monthName: 'January',
    avgHighF: 55,
    avgLowF: 43,
    avgRainIn: 11.4,
    rainyDays: 14,
    oceanTempF: 51,
    summary: 'Peak winter rain season; heavy storms can make coastal creeks impassable.',
  },
  {
    month: 2,
    monthName: 'February',
    avgHighF: 56,
    avgLowF: 43,
    avgRainIn: 9.8,
    rainyDays: 13,
    oceanTempF: 51,
    summary: 'Wet and breezy with frequent Pacific fronts; dramatic surf & green headlands.',
  },
  {
    month: 3,
    monthName: 'March',
    avgHighF: 57,
    avgLowF: 44,
    avgRainIn: 8.6,
    rainyDays: 13,
    oceanTempF: 50,
    summary: 'Transitional spring weather; mix of clearing sunny windows and passing showers.',
  },
  {
    month: 4,
    monthName: 'April',
    avgHighF: 59,
    avgLowF: 45,
    avgRainIn: 4.5,
    rainyDays: 9,
    oceanTempF: 50,
    summary: 'Wildflowers on bluffs; cooler NW winds pick up in afternoons.',
  },
  {
    month: 5,
    monthName: 'May',
    avgHighF: 62,
    avgLowF: 48,
    avgRainIn: 2.2,
    rainyDays: 6,
    oceanTempF: 51,
    summary: 'Mild & mostly dry; morning marine layer common, ticks active in brush.',
  },
  {
    month: 6,
    monthName: 'June',
    avgHighF: 65,
    avgLowF: 51,
    avgRainIn: 0.7,
    rainyDays: 3,
    oceanTempF: 52,
    summary: 'Dry coastal summer begins; brisk NW afternoon winds (15–25 mph) & morning fog.',
  },
  {
    month: 7,
    monthName: 'July',
    avgHighF: 67,
    avgLowF: 53,
    avgRainIn: 0.1,
    rainyDays: 1,
    oceanTempF: 53,
    summary: 'Cool foggy mornings clearing to crisp sunny afternoons; virtually no rain.',
  },
  {
    month: 8,
    monthName: 'August',
    avgHighF: 68,
    avgLowF: 53,
    avgRainIn: 0.2,
    rainyDays: 1,
    oceanTempF: 54,
    summary: 'Warmest coastal month; persistent marine fog keeps beach temps comfortable.',
  },
  {
    month: 9,
    monthName: 'September',
    avgHighF: 68,
    avgLowF: 52,
    avgRainIn: 1.0,
    rainyDays: 3,
    oceanTempF: 54,
    summary: 'Often the clearest, calmest month on the Lost Coast with lighter winds.',
  },
  {
    month: 10,
    monthName: 'October',
    avgHighF: 65,
    avgLowF: 49,
    avgRainIn: 4.1,
    rainyDays: 7,
    oceanTempF: 53,
    summary: 'Early autumn sun mixed with first Pacific rainstorms; crisp nights.',
  },
  {
    month: 11,
    monthName: 'November',
    avgHighF: 59,
    avgLowF: 45,
    avgRainIn: 8.9,
    rainyDays: 12,
    oceanTempF: 52,
    summary: 'Rainy season ramps up; watch NWS marine swell & creek levels closely.',
  },
  {
    month: 12,
    monthName: 'December',
    avgHighF: 55,
    avgLowF: 43,
    avgRainIn: 11.8,
    rainyDays: 15,
    oceanTempF: 51,
    summary: 'Wettest month of the year with short daylight and strong winter surf.',
  },
];

export function getMonthlyNormal(ymd: string): MonthlyClimateNormal {
  const d = parseYMD(ymd);
  return MONTHLY_NORMALS[d.getMonth()];
}

const historyCache = new Map<string, HistoricalYearSample[]>();

/**
 * Fetches past 5 complete years of actual daily weather for the same MM-DD
 * at Shelter Cove (40.0258, -124.0725) via Open-Meteo Historical Archive.
 */
export async function fetchSameDateHistory(ymd: string): Promise<HistoricalYearSample[]> {
  const target = parseYMD(ymd);
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const cacheKey = `${mm}-${dd}`;
  const cached = historyCache.get(cacheKey);
  if (cached) return cached;

  const currentYear = new Date().getFullYear();
  // Use last 5 years strictly before today's year (or up to last year if date is in future)
  const todayStr = new Date().toISOString().slice(0, 10);
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 6 && years.length < 5; y--) {
    const candidate = `${y}-${mm}-${dd}`;
    if (candidate < todayStr) {
      years.push(y);
    }
  }

  const results = await Promise.all(
    years.map(async (year): Promise<HistoricalYearSample | null> => {
      const dateStr = `${year}-${mm}-${dd}`;
      const url =
        `https://archive-api.open-meteo.com/v1/archive?latitude=40.0258&longitude=-124.0725` +
        `&start_date=${dateStr}&end_date=${dateStr}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
        `&temperature_unit=fahrenheit&precipitation_unit=inch&wind_speed_unit=mph&timezone=America%2FLos_Angeles`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = (await res.json()) as {
          daily?: {
            temperature_2m_max?: number[];
            temperature_2m_min?: number[];
            precipitation_sum?: number[];
            wind_speed_10m_max?: number[];
          };
        };
        const d = json.daily;
        if (!d || d.temperature_2m_max?.[0] == null) return null;
        return {
          year,
          dateStr,
          highF: Math.round(d.temperature_2m_max[0]),
          lowF: Math.round(d.temperature_2m_min?.[0] ?? 45),
          precipIn: Math.round((d.precipitation_sum?.[0] ?? 0) * 100) / 100,
          maxWindMph: Math.round(d.wind_speed_10m_max?.[0] ?? 0),
        };
      } catch {
        return null;
      }
    })
  );

  const valid = results.filter((r): r is HistoricalYearSample => r !== null);
  if (valid.length > 0) {
    historyCache.set(cacheKey, valid);
  }
  return valid;
}
