import { Direction } from '../data/trailData';
import { formatYMD } from './permitUtils';

const SETTINGS_COOKIE = 'lct_user_settings';

export interface SavedTripSettings {
  startDateStr: string;
  tripDays: number;
  direction: Direction;
}

export function loadSavedSettings(): SavedTripSettings | null {
  try {
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SETTINGS_COOKIE}=`));
    if (!match) return null;

    const raw = decodeURIComponent(match.slice(SETTINGS_COOKIE.length + 1));
    const parsed = JSON.parse(raw) as Partial<SavedTripSettings>;

    const todayStr = formatYMD(new Date());
    let startDateStr =
      typeof parsed.startDateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.startDateStr)
        ? parsed.startDateStr
        : todayStr;

    // If the saved date is now in the past on return, snap to today
    if (startDateStr < todayStr) {
      startDateStr = todayStr;
    }

    const tripDays =
      typeof parsed.tripDays === 'number' && parsed.tripDays >= 2 && parsed.tripDays <= 6
        ? parsed.tripDays
        : 3;

    const direction: Direction =
      parsed.direction === 'S_TO_N' ? 'S_TO_N' : 'N_TO_S';

    return { startDateStr, tripDays, direction };
  } catch {
    return null;
  }
}

export function saveSettingsCookie(settings: SavedTripSettings): void {
  const encoded = encodeURIComponent(JSON.stringify(settings));
  document.cookie = `${SETTINGS_COOKIE}=${encoded}; max-age=31536000; path=/; SameSite=Lax`;
}
