import { parseYMD } from './permitUtils';

export interface MoonPhaseInfo {
  phaseRatio: number; // 0..1 (0 = New, 0.5 = Full)
  emoji: string;
  name: string;
  illuminationPct: number;
  isKeyPhase: boolean; // New, First Quarter, Full, Last Quarter
  tideNote: 'Spring Tide' | 'Neap Tide' | 'Moderate';
}

const SYNODIC_MONTH = 29.53058867;
// Reference New Moon: Jan 6, 2000 18:14 UTC
const EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

export function getMoonPhase(ymd: string): MoonPhaseInfo {
  const d = parseYMD(ymd);
  const utcMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  const daysSince = (utcMs - EPOCH_MS) / 86400000;
  const cycles = daysSince / SYNODIC_MONTH;
  const phaseRatio = ((cycles % 1) + 1) % 1;

  const illuminationPct = Math.round(((1 - Math.cos(phaseRatio * 2 * Math.PI)) / 2) * 100);

  let emoji = '🌑';
  let name = 'New Moon';
  let isKeyPhase = false;

  if (phaseRatio < 0.035 || phaseRatio >= 0.965) {
    emoji = '🌑';
    name = 'New Moon';
    isKeyPhase = true;
  } else if (phaseRatio < 0.215) {
    emoji = '🌒';
    name = 'Waxing Crescent';
  } else if (phaseRatio < 0.285) {
    emoji = '🌓';
    name = 'First Quarter';
    isKeyPhase = true;
  } else if (phaseRatio < 0.465) {
    emoji = '🌔';
    name = 'Waxing Gibbous';
  } else if (phaseRatio < 0.535) {
    emoji = '🌕';
    name = 'Full Moon';
    isKeyPhase = true;
  } else if (phaseRatio < 0.715) {
    emoji = '🌖';
    name = 'Waning Gibbous';
  } else if (phaseRatio < 0.785) {
    emoji = '🌗';
    name = 'Last Quarter';
    isKeyPhase = true;
  } else {
    emoji = '🌘';
    name = 'Waning Crescent';
  }

  const distFromNewOrFull = Math.min(
    phaseRatio,
    1 - phaseRatio,
    Math.abs(phaseRatio - 0.5)
  );
  const distFromQuarter = Math.min(
    Math.abs(phaseRatio - 0.25),
    Math.abs(phaseRatio - 0.75)
  );

  const tideNote: MoonPhaseInfo['tideNote'] =
    distFromNewOrFull <= 0.08
      ? 'Spring Tide'
      : distFromQuarter <= 0.08
        ? 'Neap Tide'
        : 'Moderate';

  return {
    phaseRatio,
    emoji,
    name,
    illuminationPct,
    isKeyPhase,
    tideNote,
  };
}
