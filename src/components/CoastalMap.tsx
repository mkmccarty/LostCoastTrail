import React, { useMemo, useState } from 'react';
import {
  Direction,
  TIDE_ZONES,
  TideZone,
  WAYPOINTS,
  Waypoint,
  getDirectionalMile,
} from '../data/trailData';
import { formatMinutesAsTime } from '../utils/solarUtils';
import { Compass, Droplets, Tent, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface CoastalMapProps {
  direction: Direction;
  activeFromId: string;
  activeToId: string;
  currentHeightFt: number | null;
  currentSlopeFtPerHr: number;
  selectedMinutes: number;
  selectedDateStr: string;
}

// Bounding box for King Range coast
const LAT_MAX = 40.312;
const LAT_MIN = 40.012;
const LON_MIN = -124.385;
const LON_MAX = -124.045;

const SVG_W = 400;
const SVG_H = 600;
const PAD_X = 36;
const PAD_Y = 28;

function project(lat: number, lon: number): { x: number; y: number } {
  const xNorm = (lon - LON_MIN) / (LON_MAX - LON_MIN);
  const yNorm = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN);
  return {
    x: PAD_X + xNorm * (SVG_W - PAD_X * 2),
    y: PAD_Y + yNorm * (SVG_H - PAD_Y * 2),
  };
}

function getZoneLiveState(
  zone: TideZone,
  heightFt: number | null,
  slope: number
): { color: string; label: string; passable: boolean } {
  if (heightFt === null) {
    return { color: '#64748b', label: 'Loading', passable: false };
  }
  if (heightFt > zone.thresholdFt) {
    return { color: '#ef4444', label: 'Impassable', passable: false };
  }
  if (slope > 0.05) {
    return { color: '#f59e0b', label: 'Passable (Rising)', passable: true };
  }
  return { color: '#10b981', label: 'Passable (Receding)', passable: true };
}

export const CoastalMap: React.FC<CoastalMapProps> = ({
  direction,
  activeFromId,
  activeToId,
  currentHeightFt,
  currentSlopeFtPerHr,
  selectedMinutes,
}) => {
  const [selectedItem, setSelectedItem] = useState<
    { kind: 'zone'; zone: TideZone } | { kind: 'waypoint'; wp: Waypoint } | null
  >({ kind: 'zone', zone: TIDE_ZONES[1] });

  const projectedWaypoints = useMemo(
    () =>
      WAYPOINTS.map((wp) => ({
        ...wp,
        ...project(wp.lat, wp.lon),
      })),
    []
  );

  const trailPolyline = useMemo(
    () => projectedWaypoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [projectedWaypoints]
  );

  // Land polygon (east of coastline)
  const landPolygon = useMemo(() => {
    const pts = projectedWaypoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    return `${SVG_W},0 ${SVG_W},${SVG_H} ${pts.slice().reverse().join(' ')} ${projectedWaypoints[0].x.toFixed(1)},0`;
  }, [projectedWaypoints]);

  // Active day segment
  const activeSegmentPoints = useMemo(() => {
    const idxA = projectedWaypoints.findIndex((w) => w.id === activeFromId);
    const idxB = projectedWaypoints.findIndex((w) => w.id === activeToId);
    if (idxA === -1 || idxB === -1) return '';
    const lo = Math.min(idxA, idxB);
    const hi = Math.max(idxA, idxB);
    return projectedWaypoints
      .slice(lo, hi + 1)
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  }, [projectedWaypoints, activeFromId, activeToId]);

  // Interpolate zone polyline points along trail
  const getZonePolyline = (zone: TideZone): string => {
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < projectedWaypoints.length - 1; i++) {
      const a = projectedWaypoints[i];
      const b = projectedWaypoints[i + 1];
      const segMin = a.mileNtoS;
      const segMax = b.mileNtoS;
      if (segMax < zone.mileStartNtoS || segMin > zone.mileEndNtoS) continue;

      const t0 = Math.max(0, (zone.mileStartNtoS - segMin) / (segMax - segMin));
      const t1 = Math.min(1, (zone.mileEndNtoS - segMin) / (segMax - segMin));
      pts.push({
        x: a.x + (b.x - a.x) * t0,
        y: a.y + (b.y - a.y) * t0,
      });
      pts.push({
        x: a.x + (b.x - a.x) * t1,
        y: a.y + (b.y - a.y) * t1,
      });
    }
    return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  };

  const zoneMidpoints = useMemo(() => {
    return TIDE_ZONES.map((z) => {
      const midMile = (z.mileStartNtoS + z.mileEndNtoS) / 2;
      for (let i = 0; i < projectedWaypoints.length - 1; i++) {
        const a = projectedWaypoints[i];
        const b = projectedWaypoints[i + 1];
        if (midMile >= a.mileNtoS && midMile <= b.mileNtoS) {
          const t = (midMile - a.mileNtoS) / (b.mileNtoS - a.mileNtoS);
          return {
            zone: z,
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
          };
        }
      }
      return { zone: z, x: 200, y: 300 };
    });
  }, [projectedWaypoints]);

  const tideTrend =
    currentSlopeFtPerHr < -0.05
      ? 'Receding ↓'
      : currentSlopeFtPerHr > 0.05
        ? 'Rising ↑'
        : 'Slack ~';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <h2 className="card-title">
          <Compass size={17} color="#38bdf8" />
          Coastal Tide Map (24.6 mi)
        </h2>
        <span className="badge badge-ocean mono">
          {formatMinutesAsTime(selectedMinutes)} ·{' '}
          {currentHeightFt !== null ? `${currentHeightFt.toFixed(1)} ft` : '—'} · {tideTrend}
        </span>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: '0.73rem',
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 4, background: '#10b981', borderRadius: 2 }} />
          Passable &amp; Receding
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 4, background: '#f59e0b', borderRadius: 2 }} />
          Passable (Rising)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 4, background: '#ef4444', borderRadius: 2 }} />
          Impassable
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 4, background: '#38bdf8', borderRadius: 2 }} />
          Selected Day Leg
        </span>
      </div>

      {/* SVG Map */}
      <div
        style={{
          position: 'relative',
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: '#081521',
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#071524" />
              <stop offset="100%" stopColor="#0c263b" />
            </linearGradient>
            <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#142420" />
              <stop offset="100%" stopColor="#1a2c24" />
            </linearGradient>
          </defs>

          {/* Ocean */}
          <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="url(#oceanGrad)" />

          {/* Subtle bathymetry waves */}
          {[0.18, 0.34, 0.52].map((f, idx) => (
            <path
              key={idx}
              d={`M ${SVG_W * f - 40} 0 Q ${SVG_W * f - 20} ${SVG_H * 0.35}, ${SVG_W * f + 20} ${SVG_H * 0.65} T ${SVG_W * f + 50} ${SVG_H}`}
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth={1.2}
              strokeDasharray="4 6"
            />
          ))}

          {/* Landmass */}
          <polygon points={landPolygon} fill="url(#landGrad)" />

          {/* King Range topographic contour hints */}
          <path
            d={`M 230 30 Q 255 180, 290 310 T 365 570`}
            fill="none"
            stroke="rgba(45, 212, 191, 0.08)"
            strokeWidth={1.5}
          />
          <path
            d={`M 270 10 Q 300 160, 330 290 T 390 540`}
            fill="none"
            stroke="rgba(45, 212, 191, 0.06)"
            strokeWidth={1.2}
          />

          {/* Labels for Ocean & King Range */}
          <text
            x={26}
            y={565}
            fill="rgba(56, 189, 248, 0.35)"
            fontSize={11}
            fontWeight={600}
            letterSpacing="0.16em"
          >
            PACIFIC OCEAN
          </text>
          <text
            x={245}
            y={82}
            fill="rgba(45, 212, 191, 0.32)"
            fontSize={10}
            fontWeight={600}
            letterSpacing="0.14em"
          >
            KING RANGE NCA
          </text>

          {/* Direction indicator */}
          <g transform="translate(26, 26)">
            <rect
              x={0}
              y={0}
              width={118}
              height={26}
              rx={6}
              fill="rgba(11, 18, 24, 0.85)"
              stroke="rgba(56, 189, 248, 0.35)"
            />
            <text x={10} y={17} fill="#38bdf8" fontSize={11} fontWeight={600}>
              {direction === 'N_TO_S' ? '↓ Hiking N → S' : '↑ Hiking S → N'}
            </text>
          </g>

          {/* Base trail line */}
          <polyline
            points={trailPolyline}
            fill="none"
            stroke="#475569"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Day Leg highlight */}
          {activeSegmentPoints && (
            <polyline
              points={activeSegmentPoints}
              fill="none"
              stroke="rgba(56, 189, 248, 0.55)"
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 3 Impassable Tide Zones */}
          {TIDE_ZONES.map((zone) => {
            const st = getZoneLiveState(zone, currentHeightFt, currentSlopeFtPerHr);
            const pts = getZonePolyline(zone);
            const isSel = selectedItem?.kind === 'zone' && selectedItem.zone.id === zone.id;
            return (
              <g
                key={zone.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedItem({ kind: 'zone', zone })}
              >
                <polyline
                  points={pts}
                  fill="none"
                  stroke={st.color}
                  strokeWidth={isSel ? 9 : 6.5}
                  strokeLinecap="round"
                  opacity={0.95}
                />
                {!st.passable && (
                  <polyline
                    points={pts}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={1.5}
                    strokeDasharray="3 5"
                    opacity={0.7}
                  />
                )}
              </g>
            );
          })}

          {/* Zone Callout Badges */}
          {zoneMidpoints.map(({ zone, x, y }) => {
            const st = getZoneLiveState(zone, currentHeightFt, currentSlopeFtPerHr);
            const isSel = selectedItem?.kind === 'zone' && selectedItem.zone.id === zone.id;
            return (
              <g
                key={`badge-${zone.id}`}
                transform={`translate(${x - 24}, ${y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedItem({ kind: 'zone', zone })}
              >
                <rect
                  x={-48}
                  y={-12}
                  width={62}
                  height={22}
                  rx={5}
                  fill="#0b1218"
                  stroke={st.color}
                  strokeWidth={isSel ? 2 : 1.2}
                />
                <text
                  x={-17}
                  y={3}
                  textAnchor="middle"
                  fill={st.color}
                  fontSize={10}
                  fontWeight={700}
                  fontFamily="JetBrains Mono, monospace"
                >
                  Z{zone.number} &lt;{zone.thresholdFt.toFixed(1)}ft
                </text>
              </g>
            );
          })}

          {/* Waypoint Markers & Labels */}
          {projectedWaypoints.map((wp) => {
            const isEndpoint = wp.type === 'trailhead';
            const isActiveEnd = wp.id === activeFromId || wp.id === activeToId;
            const isSel = selectedItem?.kind === 'waypoint' && selectedItem.wp.id === wp.id;
            const showLabel =
              isEndpoint ||
              isActiveEnd ||
              [
                'punta-gorda',
                'sea-lion-gulch',
                'randall-creek',
                'spanish-flat',
                'big-flat',
                'miller-flat',
                'gitchell-creek',
              ].includes(wp.id);

            return (
              <g
                key={wp.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedItem({ kind: 'waypoint', wp })}
              >
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={isEndpoint ? 6 : isActiveEnd ? 5.5 : 3.8}
                  fill={
                    isEndpoint
                      ? '#38bdf8'
                      : isActiveEnd
                        ? '#2dd4bf'
                        : wp.hasCamp
                          ? '#e2e8f0'
                          : '#94a3b8'
                  }
                  stroke="#0b1218"
                  strokeWidth={1.8}
                />
                {isSel && (
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={9}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                  />
                )}
                {showLabel && (
                  <text
                    x={wp.x + 9}
                    y={wp.y + 3.5}
                    fill={isEndpoint || isActiveEnd ? '#eef4f8' : '#9fb3c4'}
                    fontSize={isEndpoint ? 10.5 : 9.2}
                    fontWeight={isEndpoint || isActiveEnd ? 700 : 500}
                  >
                    {wp.name.replace(' (Shelter Cove)', '')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Zone / Waypoint Inspector */}
      {selectedItem && (
        <div
          style={{
            background: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: '0.82rem',
          }}
        >
          {selectedItem.kind === 'zone' ? (
            (() => {
              const z = selectedItem.zone;
              const st = getZoneLiveState(z, currentHeightFt, currentSlopeFtPerHr);
              const m1 = getDirectionalMile(z.mileStartNtoS, direction);
              const m2 = getDirectionalMile(z.mileEndNtoS, direction);
              const loMile = Math.min(m1, m2);
              const hiMile = Math.max(m1, m2);
              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {z.shortName} ({z.lengthMiles} mi)
                    </strong>
                    <span
                      className={`badge ${
                        !st.passable
                          ? 'badge-danger'
                          : currentSlopeFtPerHr > 0.05
                            ? 'badge-tight'
                            : 'badge-safe'
                      }`}
                    >
                      {!st.passable ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {st.label}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-ocean)', marginBottom: 4 }}>
                    Mile {loMile}–{hiMile} ({direction === 'N_TO_S' ? 'N→S' : 'S→N'}) · Threshold &lt;{' '}
                    {z.thresholdFt.toFixed(1)} ft · ~{z.crossingHours} hr @ 1 mph
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.79rem' }}>
                    {z.blmNote}
                  </p>
                </>
              );
            })()
          ) : (
            (() => {
              const wp = selectedItem.wp;
              const dirMile = getDirectionalMile(wp.mileNtoS, direction);
              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>{wp.name}</strong>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-ocean)' }}>
                      Mile {dirMile} ({direction === 'N_TO_S' ? 'N→S' : 'S→N'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 4, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Droplets size={13} color={wp.hasWater ? '#38bdf8' : '#64748b'} />
                      {wp.hasWater ? 'Creek/Spring Water' : 'No Water'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Tent size={13} color={wp.hasCamp ? '#10b981' : '#64748b'} />
                      {wp.hasCamp ? 'Camping Available' : 'No Camping'}
                    </span>
                  </div>
                  {wp.note && (
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.79rem', display: 'flex', gap: 5 }}>
                      <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{wp.note}</span>
                    </p>
                  )}
                </>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
