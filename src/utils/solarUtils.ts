import { parseYMD } from './permitUtils';

// Shelter Cove, CA coordinates
const LAT = 40.0258;
const LON = -124.0725;

export interface DaylightInfo {
  sunriseMinutes: number; // minutes from midnight local PT
  sunsetMinutes: number;
  sunriseLabel: string;
  sunsetLabel: string;
}

function isPacificDST(date: Date): boolean {
  const year = date.getFullYear();
  // Second Sunday of March
  const marchFirst = new Date(year, 2, 1);
  const dstStart = new Date(year, 2, 1 + ((7 - marchFirst.getDay()) % 7) + 7, 2);
  // First Sunday of November
  const novFirst = new Date(year, 10, 1);
  const dstEnd = new Date(year, 10, 1 + ((7 - novFirst.getDay()) % 7), 2);
  return date >= dstStart && date < dstEnd;
}

export function formatMinutesAsTime(mins: number): string {
  const clamped = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * NOAA solar equations for sunrise and sunset at Shelter Cove, CA.
 */
export function getDaylightForDate(ymd: string): DaylightInfo {
  const date = parseYMD(ymd);
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);

  const tzOffsetHours = isPacificDST(date) ? -7 : -8;
  const rad = Math.PI / 180;

  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const zenith = 90.833 * rad;
  const latRad = LAT * rad;
  const cosHa =
    Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl)) -
    Math.tan(latRad) * Math.tan(decl);
  const haDeg = (Math.acos(Math.max(-1, Math.min(1, cosHa))) * 180) / Math.PI;

  const sunriseMinutes = 720 - 4 * (LON + haDeg) - eqTime + tzOffsetHours * 60;
  const sunsetMinutes = 720 - 4 * (LON - haDeg) - eqTime + tzOffsetHours * 60;

  return {
    sunriseMinutes,
    sunsetMinutes,
    sunriseLabel: formatMinutesAsTime(sunriseMinutes),
    sunsetLabel: formatMinutesAsTime(sunsetMinutes),
  };
}
