import React, { useRef } from 'react';
import { DayTideData } from '../utils/tideService';
import { formatDisplayDate } from '../utils/permitUtils';
import { formatMinutesAsTime, getDaylightForDate } from '../utils/solarUtils';
import { getMoonPhase } from '../utils/moonUtils';
import { Waves, Sun, Moon } from 'lucide-react';

interface TideChartProps {
  dateStr: string;
  dayNumber: number;
  dayData: DayTideData | undefined;
  selectedMinutes: number;
  onSelectMinutes: (mins: number) => void;
  source: 'noaa' | 'offline-estimate';
}

const W = 720;
const H = 230;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 22;
const PAD_B = 30;

export const TideChart: React.FC<TideChartProps> = ({
  dateStr,
  dayNumber,
  dayData,
  selectedMinutes,
  onSelectMinutes,
  source,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const daylight = getDaylightForDate(dateStr);
  const moon = getMoonPhase(dateStr);

  const points = dayData?.points ?? [];
  const extremes = dayData?.extremes ?? [];

  const minFt = Math.min(-2, ...points.map((p) => p.heightFt), 0);
  const maxFt = Math.max(7.5, ...points.map((p) => p.heightFt));

  const xForMin = (m: number) => PAD_L + (m / 1440) * (W - PAD_L - PAD_R);
  const yForFt = (ft: number) =>
    PAD_T + ((maxFt - ft) / (maxFt - minFt)) * (H - PAD_T - PAD_B);

  const curvePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xForMin(p.minutes).toFixed(1)} ${yForFt(p.heightFt).toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${curvePath} L ${xForMin(points[points.length - 1].minutes).toFixed(1)} ${yForFt(minFt).toFixed(1)} L ${xForMin(points[0].minutes).toFixed(1)} ${yForFt(minFt).toFixed(1)} Z`
      : '';

  const handlePointer = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const clamped = Math.max(PAD_L, Math.min(W - PAD_R, relX));
    const mins = Math.round(((clamped - PAD_L) / (W - PAD_L - PAD_R)) * 1434 / 6) * 6;
    onSelectMinutes(Math.max(0, Math.min(1434, mins)));
  };

  // Current point
  const closestPt =
    points.length > 0
      ? points.reduce((best, p) =>
          Math.abs(p.minutes - selectedMinutes) < Math.abs(best.minutes - selectedMinutes) ? p : best
        )
      : null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Waves size={17} color="#38bdf8" />
            Day {dayNumber} Tide Curve · {formatDisplayDate(dateStr)}
          </h2>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>NOAA Station 9418024 (Shelter Cove, CA · MLLW)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sun size={12} color="#f59e0b" /> Daylight: {daylight.sunriseLabel} – {daylight.sunsetLabel}
            </span>
            <span
              title={`${moon.illuminationPct}% illuminated · ${moon.tideNote} tidal range`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span>{moon.emoji}</span> {moon.name}
              {moon.tideNote !== 'Moderate' && (
                <span style={{ color: moon.tideNote === 'Spring Tide' ? '#2dd4bf' : '#94a3b8' }}>
                  ({moon.tideNote})
                </span>
              )}
            </span>
          </div>
        </div>
        <span className={`badge ${source === 'noaa' ? 'badge-safe' : 'badge-tight'}`}>
          {source === 'noaa' ? 'Live NOAA Data' : 'Offline Estimate'}
        </span>
      </div>

      {/* SVG Tide Chart */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          onClick={handlePointer}
          onMouseMove={(e) => {
            if (e.buttons === 1) handlePointer(e);
          }}
        >
          <defs>
            <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.35)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0.02)" />
            </linearGradient>
          </defs>

          {/* Nighttime shading */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={Math.max(0, xForMin(daylight.sunriseMinutes) - PAD_L)}
            height={H - PAD_T - PAD_B}
            fill="rgba(5, 10, 16, 0.55)"
          />
          <rect
            x={xForMin(daylight.sunsetMinutes)}
            y={PAD_T}
            width={Math.max(0, W - PAD_R - xForMin(daylight.sunsetMinutes))}
            height={H - PAD_T - PAD_B}
            fill="rgba(5, 10, 16, 0.55)"
          />

          {/* Y-axis gridlines */}
          {[0, 2, 4, 6].map((ft) => {
            const y = yForFt(ft);
            return (
              <g key={ft}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.14)"
                  strokeWidth={1}
                />
                <text
                  x={PAD_L - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#6c8296"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {ft}ft
                </text>
              </g>
            );
          })}

          {/* Zone Threshold lines */}
          {[
            { ft: 6.0, label: 'Z1 (6.0ft)', color: '#a78bfa' },
            { ft: 3.0, label: 'Z3 (3.0ft)', color: '#f59e0b' },
            { ft: 2.5, label: 'Z2 (2.5ft)', color: '#10b981' },
          ].map((th) => {
            const y = yForFt(th.ft);
            return (
              <g key={th.label}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke={th.color}
                  strokeWidth={1.2}
                  strokeDasharray="5 4"
                  opacity={0.75}
                />
                <text
                  x={W - PAD_R - 4}
                  y={y - 4}
                  textAnchor="end"
                  fill={th.color}
                  fontSize={9.5}
                  fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {th.label}
                </text>
              </g>
            );
          })}

          {/* Tide area & curve */}
          {areaPath && <path d={areaPath} fill="url(#tideFill)" />}
          {curvePath && (
            <path d={curvePath} fill="none" stroke="#38bdf8" strokeWidth={2.4} strokeLinecap="round" />
          )}

          {/* High / Low Extremes */}
          {extremes.map((ex, i) => {
            const x = xForMin(ex.minutes);
            const y = yForFt(ex.heightFt);
            const isLow = ex.type === 'L';
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill={isLow ? '#10b981' : '#f43f5e'}
                  stroke="#0b1218"
                  strokeWidth={1.2}
                />
                <text
                  x={x}
                  y={isLow ? y + 13 : y - 7}
                  textAnchor="middle"
                  fill={isLow ? '#2dd4bf' : '#fda4af'}
                  fontSize={9.5}
                  fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {ex.heightFt.toFixed(1)}ft ({formatMinutesAsTime(ex.minutes).replace(':00 ', '').replace(' ', '')})
                </text>
              </g>
            );
          })}

          {/* X-axis hours */}
          {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((hr) => {
            const x = xForMin(hr * 60);
            const label =
              hr === 0 || hr === 24
                ? '12a'
                : hr === 12
                  ? '12p'
                  : hr < 12
                    ? `${hr}a`
                    : `${hr - 12}p`;
            return (
              <text
                key={hr}
                x={x}
                y={H - 8}
                textAnchor="middle"
                fill="#6c8296"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
              >
                {label}
              </text>
            );
          })}

          {/* Selected Time Cursor */}
          <line
            x1={xForMin(selectedMinutes)}
            y1={PAD_T}
            x2={xForMin(selectedMinutes)}
            y2={H - PAD_B}
            stroke="#eef4f8"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          {closestPt && (
            <circle
              cx={xForMin(closestPt.minutes)}
              cy={yForFt(closestPt.heightFt)}
              r={5.5}
              fill="#eef4f8"
              stroke="#38bdf8"
              strokeWidth={2.5}
            />
          )}
        </svg>
      </div>

      {/* Time-of-day scrubber */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 8,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {selectedMinutes >= daylight.sunriseMinutes && selectedMinutes <= daylight.sunsetMinutes ? (
            <Sun size={14} color="#f59e0b" />
          ) : (
            <Moon size={14} color="#94a3b8" />
          )}
          Scrub Time:
        </span>
        <input
          type="range"
          min={0}
          max={1434}
          step={6}
          value={selectedMinutes}
          onChange={(e) => onSelectMinutes(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
        />
        <span className="mono" style={{ fontSize: '0.84rem', fontWeight: 600, minWidth: 74, textAlign: 'right' }}>
          {formatMinutesAsTime(selectedMinutes)}
        </span>
      </div>
    </div>
  );
};
