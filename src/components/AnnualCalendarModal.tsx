import React, { useEffect, useMemo, useState } from 'react';
import { Direction } from '../data/trailData';
import { parseYMD } from '../utils/permitUtils';
import { fetchAnnualHourlyTides, TideFetchResult } from '../utils/tideService';
import { CandidateStartSummary, scoreSingleStartDate } from '../utils/tripScorer';
import { getMoonPhase } from '../utils/moonUtils';
import { Calendar, ChevronLeft, ChevronRight, Loader2, X, ArrowUpDown } from 'lucide-react';

interface AnnualCalendarModalProps {
  open: boolean;
  onClose: () => void;
  selectedStartDateStr: string;
  tripDays: number;
  onChangeTripDays: (days: number) => void;
  direction: Direction;
  onChangeDirection: (dir: Direction) => void;
  onSelectStartDate: (ymd: string) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AnnualCalendarModal: React.FC<AnnualCalendarModalProps> = ({
  open,
  onClose,
  selectedStartDateStr,
  tripDays,
  onChangeTripDays,
  direction,
  onChangeDirection,
  onSelectStartDate,
}) => {
  const [year, setYear] = useState<number>(() => parseYMD(selectedStartDateStr).getFullYear());
  const [annualTides, setAnnualTides] = useState<TideFetchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync year when modal opens
  useEffect(() => {
    if (open) {
      setYear(parseYMD(selectedStartDateStr).getFullYear());
    }
  }, [open, selectedStartDateStr]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchAnnualHourlyTides(year).then((res) => {
      if (!cancelled) {
        setAnnualTides(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, year]);

  // Compute ratings for all 365/366 days of `year`
  const dayRatings = useMemo(() => {
    const map: Record<string, CandidateStartSummary> = {};
    if (!annualTides) return map;

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const ymd = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        map[ymd] = scoreSingleStartDate(ymd, tripDays, direction, annualTides.byDate);
      }
    }
    return map;
  }, [annualTides, year, tripDays, direction]);

  // Summary counts for legend
  const counts = useMemo(() => {
    let s3 = 0;
    let s2 = 0;
    let s1 = 0;
    let s0 = 0;
    for (const val of Object.values(dayRatings)) {
      if (val.stars === 3) s3++;
      else if (val.stars === 2) s2++;
      else if (val.stars === 1) s1++;
      else s0++;
    }
    return { s3, s2, s1, s0 };
  }, [dayRatings]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Annual Lost Coast Trail Tide Rating Calendar"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        background: 'rgba(6, 11, 16, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 1180,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-panel)',
          border: '1.5px solid var(--border-bright)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
          padding: '16px 20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border)',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={18} color="#38bdf8" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700 }}>
                {year} Annual Start-Date Calendar ({tripDays}-Day{' '}
                {direction === 'N_TO_S' ? 'N → S' : 'S → N'})
              </h2>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Click any date to plan that trip · Hover for tide window &amp; moon phase
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="segmented" title="Trip length (days)">
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={tripDays === d ? 'active' : ''}
                  onClick={() => onChangeTripDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>

            <div className="segmented">
              <button
                type="button"
                className={direction === 'N_TO_S' ? 'active' : ''}
                onClick={() => onChangeDirection('N_TO_S')}
              >
                N → S
              </button>
              <button
                type="button"
                className={direction === 'S_TO_N' ? 'active' : ''}
                onClick={() => onChangeDirection('S_TO_N')}
              >
                <ArrowUpDown size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                S → N
              </button>
            </div>

            <button
              type="button"
              className="btn btn-icon"
              onClick={() => setYear((y) => y - 1)}
              title="Previous year"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 46, textAlign: 'center' }}>
              {year}
            </span>
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => setYear((y) => y + 1)}
              title="Next year"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={onClose}
              title="Close calendar"
              style={{ marginLeft: 8 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 14,
            fontSize: '0.75rem',
            marginBottom: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'rgba(251, 191, 36, 0.25)',
                border: '1px solid #fbbf24',
              }}
            />
            <strong style={{ color: '#fbbf24' }}>★★★ Mid-day</strong> ({counts.s3}d)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid #38bdf8',
              }}
            />
            <strong style={{ color: '#38bdf8' }}>★★☆ Good</strong> ({counts.s2}d)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'rgba(148, 163, 184, 0.16)',
                border: '1px solid #64748b',
              }}
            />
            <strong style={{ color: '#94a3b8' }}>★☆☆ Dawn/Dusk</strong> ({counts.s1}d)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            />
            <strong style={{ color: '#f87171' }}>✕ Impassable</strong> ({counts.s0}d)
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.73rem' }}>
            🌑 New · 🌓 1st Qtr · 🌕 Full · 🌗 Last Qtr
          </span>
        </div>

        {/* 12-Month Grid */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: 60,
                color: 'var(--accent-ocean)',
              }}
            >
              <Loader2 size={20} className="spin" />
              <span>Loading {year} NOAA Shelter Cove tide predictions…</span>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))',
                gap: 14,
              }}
            >
              {MONTH_NAMES.map((monthName, mIdx) => {
                const firstWeekday = new Date(year, mIdx, 1).getDay();
                const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
                const cells: Array<number | null> = [
                  ...Array(firstWeekday).fill(null),
                  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                ];

                return (
                  <div
                    key={monthName}
                    style={{
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 10px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        marginBottom: 6,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{monthName}</span>
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {mIdx + 1 >= 5 && mIdx + 1 <= 9 ? '60/d' : '30/d'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 3,
                        marginBottom: 4,
                      }}
                    >
                      {WEEKDAYS.map((wd, i) => (
                        <div
                          key={i}
                          style={{
                            textAlign: 'center',
                            fontSize: '0.64rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          {wd}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 3,
                      }}
                    >
                      {cells.map((dayNum, cIdx) => {
                        if (dayNum === null) {
                          return <div key={`empty-${cIdx}`} />;
                        }
                        const ymd = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const rating = dayRatings[ymd];
                        const moon = getMoonPhase(ymd);
                        const isSelected = ymd === selectedStartDateStr;

                        let bg = 'rgba(239, 68, 68, 0.08)';
                        let border = 'rgba(239, 68, 68, 0.25)';
                        let textColor = '#94a3b8';

                        if (rating?.stars === 3) {
                          bg = 'rgba(251, 191, 36, 0.22)';
                          border = 'rgba(251, 191, 36, 0.65)';
                          textColor = '#fde68a';
                        } else if (rating?.stars === 2) {
                          bg = 'rgba(56, 189, 248, 0.16)';
                          border = 'rgba(56, 189, 248, 0.45)';
                          textColor = '#bae6fd';
                        } else if (rating?.stars === 1) {
                          bg = 'rgba(148, 163, 184, 0.14)';
                          border = 'rgba(148, 163, 184, 0.35)';
                          textColor = '#cbd5e1';
                        }

                        const starText =
                          rating?.stars === 3
                            ? '★★★'
                            : rating?.stars === 2
                              ? '★★☆'
                              : rating?.stars === 1
                                ? '★☆☆'
                                : '✕';

                        return (
                          <button
                            key={ymd}
                            type="button"
                            onClick={() => {
                              onSelectStartDate(ymd);
                              onClose();
                            }}
                            title={`${ymd} · ${starText} ${rating?.ratingLabel ?? ''} · ${moon.emoji} ${moon.name} (${moon.tideNote}) · ${rating?.zone2Preview ?? ''}`}
                            style={{
                              position: 'relative',
                              padding: '3px 1px',
                              borderRadius: 5,
                              background: bg,
                              border: isSelected
                                ? '2px solid #ffffff'
                                : `1px solid ${border}`,
                              color: textColor,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              lineHeight: 1.1,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{dayNum}</span>
                            <span style={{ fontSize: '0.52rem', letterSpacing: '-0.04em' }}>
                              {rating?.stars ? '★'.repeat(rating.stars) : '·'}
                            </span>
                            {moon.isKeyPhase && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: -3,
                                  right: -2,
                                  fontSize: '0.55rem',
                                  lineHeight: 1,
                                }}
                              >
                                {moon.emoji}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
