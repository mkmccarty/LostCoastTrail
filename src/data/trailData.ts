export type Direction = 'N_TO_S' | 'S_TO_N';

export interface TideZone {
  id: 'zone-1' | 'zone-2' | 'zone-3';
  number: 1 | 2 | 3;
  name: string;
  shortName: string;
  /** Mile range measured from Mattole Trailhead (North -> South) */
  mileStartNtoS: number;
  mileEndNtoS: number;
  lengthMiles: number;
  /** Threshold in feet MLLW from BLM / BigDirtyHikes */
  thresholdFt: number;
  /** Estimated crossing duration at conservative 1 mph pace */
  crossingHours: number;
  severity: 'moderate' | 'critical' | 'high';
  description: string;
  blmNote: string;
}

export interface Waypoint {
  id: string;
  name: string;
  mileNtoS: number;
  lat: number;
  lon: number;
  type: 'trailhead' | 'camp' | 'landmark' | 'creek';
  hasWater: boolean;
  hasCamp: boolean;
  note?: string;
}

export interface ItineraryDayTemplate {
  dayNumber: number;
  fromId: string;
  toId: string;
  zonesCrossed: ('zone-1' | 'zone-2' | 'zone-3')[];
  campNote: string;
}

export const TOTAL_TRAIL_MILES = 24.6;

export const TIDE_ZONES: TideZone[] = [
  {
    id: 'zone-1',
    number: 1,
    name: 'Punta Gorda',
    shortName: 'Zone 1 · Punta Gorda',
    mileStartNtoS: 3.0,
    mileEndNtoS: 3.25,
    lengthMiles: 0.25,
    thresholdFt: 6.0,
    crossingHours: 0.5, // ~15-30 min around point
    severity: 'moderate',
    description: 'Quarter-mile rocky pinch point near the historic Punta Gorda Lighthouse.',
    blmNote: 'Passable under ~6.0 ft. Elephant seal colony between Windy Point & Lighthouse — use bluff trail and keep dogs leashed to Sea Lion Gulch.',
  },
  {
    id: 'zone-2',
    number: 2,
    name: 'Sea Lion Gulch to Randall Creek',
    shortName: 'Zone 2 · Sea Lion Gulch–Randall',
    mileStartNtoS: 5.5,
    mileEndNtoS: 9.5,
    lengthMiles: 4.0,
    thresholdFt: 2.5,
    crossingHours: 4.0,
    severity: 'critical',
    description: 'The long, serious 4-mile impassable zone with vertical bedrock cliffs and boulder beaches.',
    blmNote: 'Passable under 2.5 ft on a receding tide. At 1 mph this requires a continuous ~4-hour daylight window under 2.5 ft.',
  },
  {
    id: 'zone-3',
    number: 3,
    name: 'Miller Flat to Gitchell Creek',
    shortName: 'Zone 3 · Miller Flat–Gitchell',
    mileStartNtoS: 17.5,
    mileEndNtoS: 22.0,
    lengthMiles: 4.5,
    thresholdFt: 3.0,
    crossingHours: 4.5,
    severity: 'high',
    description: '4.5-mile southern pinch zone between Miller Flat, Buck Creek, and Gitchell Creek.',
    blmNote: 'Passable under 3.0 ft on a receding tide. Plan ~4.5 hours at 1 mph; Buck Creek sits near mile 20.5 as an intermediate creek.',
  },
];

export const WAYPOINTS: Waypoint[] = [
  {
    id: 'mattole',
    name: 'Mattole Trailhead',
    mileNtoS: 0.0,
    lat: 40.2967,
    lon: -124.3547,
    type: 'trailhead',
    hasWater: false,
    hasCamp: true,
    note: 'Northern terminus. Pit toilet, no potable water at trailhead.',
  },
  {
    id: 'windy-point',
    name: 'Windy Point',
    mileNtoS: 2.2,
    lat: 40.2655,
    lon: -124.3588,
    type: 'landmark',
    hasWater: false,
    hasCamp: false,
    note: 'Elephant seal haul-out area; watch for bluff bypass.',
  },
  {
    id: 'punta-gorda',
    name: 'Punta Gorda Lighthouse',
    mileNtoS: 3.1,
    lat: 40.2494,
    lon: -124.3500,
    type: 'landmark',
    hasWater: false,
    hasCamp: false,
    note: 'Zone 1 (¼ mi, < 6.0 ft). Historic 1912 lighthouse.',
  },
  {
    id: 'sea-lion-gulch',
    name: 'Sea Lion Gulch',
    mileNtoS: 5.5,
    lat: 40.2233,
    lon: -124.3310,
    type: 'camp',
    hasWater: true,
    hasCamp: true,
    note: 'North gate of Zone 2. Good staging camp before the 4-mi Zone 2 push.',
  },
  {
    id: 'cooskie-creek',
    name: 'Cooskie Creek',
    mileNtoS: 7.0,
    lat: 40.2055,
    lon: -124.3125,
    type: 'creek',
    hasWater: true,
    hasCamp: false,
    note: 'Inside Zone 2; seasonal creek crossing.',
  },
  {
    id: 'randall-creek',
    name: 'Randall Creek',
    mileNtoS: 9.5,
    lat: 40.1815,
    lon: -124.2895,
    type: 'camp',
    hasWater: true,
    hasCamp: true,
    note: 'South gate of Zone 2. Sheltered creek-mouth camping.',
  },
  {
    id: 'spanish-flat',
    name: 'Spanish Flat',
    mileNtoS: 11.0,
    lat: 40.1650,
    lon: -124.2680,
    type: 'camp',
    hasWater: true,
    hasCamp: true,
    note: 'Expansive grassy bluff terraces; prime mid-trail camp.',
  },
  {
    id: 'kinsey-creek',
    name: 'Kinsey Creek',
    mileNtoS: 13.2,
    lat: 40.1450,
    lon: -124.2280,
    type: 'camp',
    hasWater: true,
    hasCamp: true,
    note: 'Quiet creek camp between Spanish Flat and Big Flat.',
  },
  {
    id: 'big-flat',
    name: 'Big Flat',
    mileNtoS: 16.5,
    lat: 40.1235,
    lon: -124.1850,
    type: 'camp',
    hasWater: true,
    hasCamp: true,
    note: 'Large coastal flat; ideal staging camp just north of Zone 3.',
  },
  {
    id: 'miller-flat',
    name: 'Miller Flat',
    mileNtoS: 17.5,
    lat: 40.1110,
    lon: -124.1650,
    type: 'creek',
    hasWater: true,
    hasCamp: true,
    note: 'North gate of Zone 3 (4.5 mi, < 3.0 ft).',
  },
  {
    id: 'buck-creek',
    name: 'Buck Creek',
    mileNtoS: 20.5,
    lat: 40.0750,
    lon: -124.1220,
    type: 'camp',
    hasWater: true,
    hasCamp: true,
    note: 'Inside Zone 3; small bluff campsites above high tide.',
  },
  {
    id: 'gitchell-creek',
    name: 'Gitchell Creek',
    mileNtoS: 22.0,
    lat: 40.0560,
    lon: -124.1010,
    type: 'camp',
    hasWater: true,
    hasCamp: true,
    note: 'South gate of Zone 3. Final 2.6 mi to Black Sands Beach is passable at any tide.',
  },
  {
    id: 'black-sands',
    name: 'Black Sands Beach (Shelter Cove)',
    mileNtoS: 24.6,
    lat: 40.0258,
    lon: -124.0725,
    type: 'trailhead',
    hasWater: false,
    hasCamp: false,
    note: 'Southern terminus at Shelter Cove. Shuttle pickup / parking.',
  },
];

export const WAYPOINT_BY_ID: Record<string, Waypoint> = Object.fromEntries(
  WAYPOINTS.map((w) => [w.id, w])
);

export const ZONE_BY_ID: Record<'zone-1' | 'zone-2' | 'zone-3', TideZone> = {
  'zone-1': TIDE_ZONES[0],
  'zone-2': TIDE_ZONES[1],
  'zone-3': TIDE_ZONES[2],
};

/**
 * Realistic 2 to 6 day itineraries in North -> South direction.
 * South -> North automatically mirrors the day order and zone entry sequence.
 */
const ITINERARIES_N_TO_S: Record<number, ItineraryDayTemplate[]> = {
  2: [
    {
      dayNumber: 1,
      fromId: 'mattole',
      toId: 'spanish-flat',
      zonesCrossed: ['zone-1', 'zone-2'],
      campNote: 'Big opening push (11.0 mi): clear Punta Gorda & Zone 2 on Day 1 low tide, camp at Spanish Flat.',
    },
    {
      dayNumber: 2,
      fromId: 'spanish-flat',
      toId: 'black-sands',
      zonesCrossed: ['zone-3'],
      campNote: 'Long finish (13.6 mi): hike past Big Flat, enter Zone 3 on outgoing tide, exit at Black Sands Beach.',
    },
  ],
  3: [
    {
      dayNumber: 1,
      fromId: 'mattole',
      toId: 'randall-creek',
      zonesCrossed: ['zone-1', 'zone-2'],
      campNote: '9.5 mi: cross Zone 1 & Zone 2 during Day 1 low-tide window; camp at Randall Creek.',
    },
    {
      dayNumber: 2,
      fromId: 'randall-creek',
      toId: 'big-flat',
      zonesCrossed: [],
      campNote: '7.0 mi: relaxed tide-free coastal bluff day past Spanish Flat & Kinsey Creek to Big Flat.',
    },
    {
      dayNumber: 3,
      fromId: 'big-flat',
      toId: 'black-sands',
      zonesCrossed: ['zone-3'],
      campNote: '8.1 mi: hit Miller Flat for Zone 3 outgoing tide (< 3.0 ft), finish at Black Sands Beach.',
    },
  ],
  4: [
    {
      dayNumber: 1,
      fromId: 'mattole',
      toId: 'sea-lion-gulch',
      zonesCrossed: ['zone-1'],
      campNote: '5.5 mi: easy start past Punta Gorda (Zone 1, < 6.0 ft); stage at Sea Lion Gulch for Zone 2.',
    },
    {
      dayNumber: 2,
      fromId: 'sea-lion-gulch',
      toId: 'spanish-flat',
      zonesCrossed: ['zone-2'],
      campNote: '5.5 mi: wake for the Day 2 Zone 2 (< 2.5 ft) window, then camp on the bluffs at Spanish Flat.',
    },
    {
      dayNumber: 3,
      fromId: 'spanish-flat',
      toId: 'big-flat',
      zonesCrossed: [],
      campNote: '5.5 mi: tide-independent day along wide beaches to Big Flat.',
    },
    {
      dayNumber: 4,
      fromId: 'big-flat',
      toId: 'black-sands',
      zonesCrossed: ['zone-3'],
      campNote: '8.1 mi: cross Zone 3 (< 3.0 ft) from Miller Flat to Gitchell Creek, exit at Shelter Cove.',
    },
  ],
  5: [
    {
      dayNumber: 1,
      fromId: 'mattole',
      toId: 'sea-lion-gulch',
      zonesCrossed: ['zone-1'],
      campNote: '5.5 mi: cross Zone 1 (< 6.0 ft), visit Punta Gorda Lighthouse, camp at Sea Lion Gulch.',
    },
    {
      dayNumber: 2,
      fromId: 'sea-lion-gulch',
      toId: 'randall-creek',
      zonesCrossed: ['zone-2'],
      campNote: '4.0 mi: dedicated Zone 2 (< 2.5 ft) crossing day; camp right at Randall Creek.',
    },
    {
      dayNumber: 3,
      fromId: 'randall-creek',
      toId: 'kinsey-creek',
      zonesCrossed: [],
      campNote: '3.7 mi: short recovery day through Spanish Flat to Kinsey Creek.',
    },
    {
      dayNumber: 4,
      fromId: 'kinsey-creek',
      toId: 'big-flat',
      zonesCrossed: [],
      campNote: '3.3 mi: easy coastal stroll to Big Flat; stage for Zone 3.',
    },
    {
      dayNumber: 5,
      fromId: 'big-flat',
      toId: 'black-sands',
      zonesCrossed: ['zone-3'],
      campNote: '8.1 mi: cross Zone 3 (< 3.0 ft) in the daylight window, finish at Black Sands Beach.',
    },
  ],
  6: [
    {
      dayNumber: 1,
      fromId: 'mattole',
      toId: 'sea-lion-gulch',
      zonesCrossed: ['zone-1'],
      campNote: '5.5 mi: unhurried start past Punta Gorda (Zone 1); camp at Sea Lion Gulch.',
    },
    {
      dayNumber: 2,
      fromId: 'sea-lion-gulch',
      toId: 'randall-creek',
      zonesCrossed: ['zone-2'],
      campNote: '4.0 mi: cross Zone 2 (< 2.5 ft) at peak low-tide window; camp at Randall Creek.',
    },
    {
      dayNumber: 3,
      fromId: 'randall-creek',
      toId: 'spanish-flat',
      zonesCrossed: [],
      campNote: '1.5 mi: short hop to Spanish Flat for a rest/exploration day.',
    },
    {
      dayNumber: 4,
      fromId: 'spanish-flat',
      toId: 'big-flat',
      zonesCrossed: [],
      campNote: '5.5 mi: scenic bluff and black-sand walk to Big Flat.',
    },
    {
      dayNumber: 5,
      fromId: 'big-flat',
      toId: 'gitchell-creek',
      zonesCrossed: ['zone-3'],
      campNote: '5.5 mi: cross Zone 3 (< 3.0 ft) from Miller Flat to Gitchell Creek.',
    },
    {
      dayNumber: 6,
      fromId: 'gitchell-creek',
      toId: 'black-sands',
      zonesCrossed: [],
      campNote: '2.6 mi: easy final morning walk along Black Sands Beach to Shelter Cove.',
    },
  ],
};

export function getItinerary(days: number, direction: Direction): ItineraryDayTemplate[] {
  const clamped = Math.max(2, Math.min(6, days));
  const base = ITINERARIES_N_TO_S[clamped];
  if (direction === 'N_TO_S') {
    return base;
  }
  // Reverse for South -> North
  return [...base]
    .reverse()
    .map((step, idx) => ({
      dayNumber: idx + 1,
      fromId: step.toId,
      toId: step.fromId,
      zonesCrossed: [...step.zonesCrossed].reverse(),
      campNote: step.campNote
        .replace('Big opening push', 'Big finish')
        .replace('finish at Black Sands Beach', 'finish at Mattole Trailhead')
        .replace('exit at Black Sands Beach', 'exit at Mattole Trailhead')
        .replace('exit at Shelter Cove', 'exit at Mattole Trailhead'),
    }));
}

export function getWaypointDistanceMiles(fromId: string, toId: string): number {
  const a = WAYPOINT_BY_ID[fromId];
  const b = WAYPOINT_BY_ID[toId];
  if (!a || !b) return 0;
  return Math.round(Math.abs(b.mileNtoS - a.mileNtoS) * 10) / 10;
}

export function getDirectionalMile(mileNtoS: number, direction: Direction): number {
  return direction === 'N_TO_S'
    ? Math.round(mileNtoS * 10) / 10
    : Math.round((TOTAL_TRAIL_MILES - mileNtoS) * 10) / 10;
}
