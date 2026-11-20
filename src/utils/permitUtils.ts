export interface PermitDetails {
  entryDateStr: string;
  bookingOpensDateStr: string;
  bookingOpensLabel: string;
  daysUntilOpens: number;
  status: 'upcoming' | 'open_window' | 'past';
  statusLabel: string;
  quotaPerDay: number;
  seasonName: 'Summer (Peak)' | 'Off-Season';
  campfireBanActive: boolean;
  reservationFee: number;
  perPersonFee: number;
  refundDeadlineStr: string;
}

export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysYMD(ymd: string, delta: number): string {
  const d = parseYMD(ymd);
  d.setDate(d.getDate() + delta);
  return formatYMD(d);
}

export function formatDisplayDate(ymd: string): string {
  const d = parseYMD(ymd);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(ymd: string): string {
  const d = parseYMD(ymd);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Computes Lost Coast Trail (BLM King Range Permit #445864) reservation rules
 * based on BigDirtyHikes & Recreation.gov guidelines:
 * - 90-day rolling window, opens at 7:00 AM Pacific Time
 * - Quota: 60/day May 15 - Sept 15; 30/day Sept 16 - May 14
 * - Fees: $6 non-refundable reservation + $12/person Special Area Fee (youth < 16 free)
 * - Refundable Special Area Fee up to 7 days before entry
 * - Campfire ban: ~June 19 - Sept 30
 */
export function getPermitDetails(entryDateStr: string): PermitDetails {
  const entryDate = parseYMD(entryDateStr);

  // 90 days prior
  const opensDate = new Date(entryDate);
  opensDate.setDate(opensDate.getDate() - 90);
  const bookingOpensDateStr = formatYMD(opensDate);

  const refundDate = new Date(entryDate);
  refundDate.setDate(refundDate.getDate() - 7);
  const refundDeadlineStr = formatYMD(refundDate);

  // Compare against today's date (at noon local)
  const now = new Date();
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const msPerDay = 86400000;
  const daysUntilOpens = Math.round((opensDate.getTime() - todayNoon.getTime()) / msPerDay);
  const daysUntilEntry = Math.round((entryDate.getTime() - todayNoon.getTime()) / msPerDay);

  let status: PermitDetails['status'] = 'open_window';
  let statusLabel = '';
  if (daysUntilEntry < 0) {
    status = 'past';
    statusLabel = `Historical date (${Math.abs(daysUntilEntry)} days ago)`;
  } else if (daysUntilOpens > 0) {
    status = 'upcoming';
    statusLabel = `Opens in ${daysUntilOpens} day${daysUntilOpens === 1 ? '' : 's'} at 7:00 AM PT`;
  } else if (daysUntilOpens === 0) {
    status = 'open_window';
    statusLabel = 'Opens TODAY at 7:00 AM Pacific!';
  } else {
    status = 'open_window';
    statusLabel = `Booking window open (opened ${Math.abs(daysUntilOpens)}d ago) — check Recreation.gov or cancellations`;
  }

  const month = entryDate.getMonth() + 1;
  const day = entryDate.getDate();
  const md = month * 100 + day;

  const isSummer = md >= 515 && md <= 915;
  const campfireBanActive = md >= 619 && md <= 930;

  return {
    entryDateStr,
    bookingOpensDateStr,
    bookingOpensLabel: `${formatDisplayDate(bookingOpensDateStr)} · 7:00 AM PT`,
    daysUntilOpens,
    status,
    statusLabel,
    quotaPerDay: isSummer ? 60 : 30,
    seasonName: isSummer ? 'Summer (Peak)' : 'Off-Season',
    campfireBanActive,
    reservationFee: 6,
    perPersonFee: 12,
    refundDeadlineStr,
  };
}
