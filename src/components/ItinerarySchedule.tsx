import React from 'react';
import {
  Direction,
  ItineraryDayTemplate,
  WAYPOINT_BY_ID,
  ZONE_BY_ID,
  getWaypointDistanceMiles,
} from '../data/trailData';
import { addDaysYMD, formatDisplayDate } from '../utils/permitUtils';
import { getDaylightForDate } from '../utils/solarUtils';
import { DayTideData, evaluateZoneCrossing } from '../utils/tideService';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Footprints,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface ItineraryScheduleProps {
  startDateStr: string;
  direction: Direction;
  itinerary: ItineraryDayTemplate[];
  selectedDayIdx: number;
  onSelectDay: (idx: number, jumpMinutes?: number) => void;
  tidesByDate: Record<string, DayTideData>;
}

export const ItinerarySchedule: React.FC<ItineraryScheduleProps> = ({
  startDateStr,
  direction,
  itinerary,
  selectedDayIdx,
  onSelectDay,
  tidesByDate,
}) => {
  // Overall trip passability summary
  let hasImpassable = false;
  let hasTight = false;

  const dayRows = itinerary.map((day, idx) => {
    const dateStr = addDaysYMD(startDateStr, idx);
    const dayData = tidesByDate[dateStr];
    const fromWp = WAYPOINT_BY_ID[day.fromId];
    const toWp = WAYPOINT_BY_ID[day.toId];
    const miles = getWaypointDistanceMiles(day.fromId, day.toId);
    const daylight = getDaylightForDate(dateStr);

    const zoneEvals = day.zonesCrossed.map((zId) => {
      const zone = ZONE_BY_ID[zId];
      const evaluation = evaluateZoneCrossing(
        dayData,
        dateStr,
        zone.thresholdFt,
        zone.crossingHours
      );
      if (evaluation.status === 'IMPASSABLE') hasImpassable = true;
      if (evaluation.status === 'TIGHT') hasTight = true;
      return { zone, evaluation };
    });

    return { day, idx, dateStr, fromWp, toWp, miles, daylight, zoneEvals };
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Footprints size={17} color="#2dd4bf" />
            {itinerary.length}-Day Schedule &amp; Low-Tide Zone Entry Times
          </h2>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {direction === 'N_TO_S'
              ? 'North → South (Mattole to Black Sands Beach · prevailing NW tailwind)'
              : 'South → North (Black Sands Beach to Mattole · headwind possible)'}{' '}
            · Pace assumed: 1.0 mph in tide zones
          </div>
        </div>
        <span
          className={`badge ${
            hasImpassable ? 'badge-danger' : hasTight ? 'badge-tight' : 'badge-safe'
          }`}
        >
          {hasImpassable ? (
            <>
              <AlertTriangle size={12} /> Impassable Zone(s) — Adjust Dates
            </>
          ) : hasTight ? (
            <>
              <Clock size={12} /> Tight Tide Margins
            </>
          ) : (
            <>
              <CheckCircle2 size={12} /> All 3 Zones Passable
            </>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dayRows.map(({ day, idx, dateStr, fromWp, toWp, miles, daylight, zoneEvals }) => {
          const isSelected = idx === selectedDayIdx;
          return (
            <div
              key={day.dayNumber}
              onClick={() => onSelectDay(idx)}
              style={{
                background: isSelected ? 'var(--bg-panel-alt)' : 'var(--bg-app)',
                border: `1px solid ${isSelected ? 'var(--accent-ocean)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className="mono"
                    style={{
                      background: isSelected ? 'var(--accent-ocean)' : 'var(--bg-hover)',
                      color: isSelected ? '#06131c' : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    DAY {day.dayNumber}
                  </span>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {fromWp?.name.replace(' (Shelter Cove)', '')}{' '}
                    <ArrowRight size={13} style={{ verticalAlign: 'middle', opacity: 0.7 }} />{' '}
                    {toWp?.name.replace(' (Shelter Cove)', '')}
                  </strong>
                </div>
                <div className="mono" style={{ fontSize: '0.77rem', color: 'var(--text-secondary)' }}>
                  {formatDisplayDate(dateStr)} · <strong style={{ color: 'var(--text-primary)' }}>{miles} mi</strong>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.79rem',
                  color: 'var(--text-secondary)',
                  marginBottom: zoneEvals.length > 0 ? 10 : 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <span>{day.campNote}</span>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Daylight {daylight.sunriseLabel}–{daylight.sunsetLabel}
                </span>
              </div>

              {zoneEvals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {zoneEvals.map(({ zone, evaluation }) => {
                    const badgeClass =
                      evaluation.status === 'SAFE'
                        ? 'badge-safe'
                        : evaluation.status === 'TIGHT'
                          ? 'badge-tight'
                          : 'badge-danger';
                    return (
                      <div
                        key={zone.id}
                        style={{
                          background: 'rgba(11, 18, 24, 0.7)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '9px 11px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ flex: '1 1 260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span className={`badge ${badgeClass}`}>{evaluation.status}</span>
                            <strong style={{ fontSize: '0.83rem' }}>
                              {zone.shortName} (&lt;{zone.thresholdFt.toFixed(1)} ft · {zone.lengthMiles} mi)
                            </strong>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            {evaluation.reason}
                          </div>
                        </div>

                        {evaluation.entryMinutes !== null ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            <div className="mono" style={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Enter: </span>
                                <strong style={{ color: '#2dd4bf' }}>{evaluation.entryTimeLabel}</strong>
                                <span style={{ color: 'var(--text-muted)' }}> → Exit: </span>
                                <strong>{evaluation.exitTimeLabel}</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Hit-it-by deadline: </span>
                                <strong style={{ color: '#f59e0b' }}>{evaluation.enterByDeadlineLabel}</strong>
                                {evaluation.minTideFt !== null && (
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {' '}
                                    · Min {evaluation.minTideFt.toFixed(1)} ft
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn"
                              style={{ fontSize: '0.74rem', padding: '4px 9px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectDay(idx, evaluation.entryMinutes!);
                              }}
                            >
                              <Clock size={12} /> View on Map
                            </button>
                          </div>
                        ) : (
                          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                            No safe daylight window
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <CalendarCheck size={13} color="#10b981" />
                  <span>No impassable tide zones on this leg — hike at any daylight hour.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Flame size={13} color="#f59e0b" />
        <span>
          BigDirtyHikes rule: always enter impassable zones on a receding tide, check NWS Shelter Cove swell/buoy data the day before, and verify the official yearly impassable-dates list on Recreation.gov #445864.
        </span>
      </div>
    </div>
  );
};
