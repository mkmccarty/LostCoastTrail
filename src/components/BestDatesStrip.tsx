import React from 'react';
import { CandidateStartSummary } from '../utils/tripScorer';
import { formatShortDate, parseYMD } from '../utils/permitUtils';
import { Sparkles, CheckCircle2, AlertTriangle, Clock, Star } from 'lucide-react';

interface BestDatesStripProps {
  selectedStartDateStr: string;
  candidates: CandidateStartSummary[];
  loading: boolean;
  onSelectStartDate: (ymd: string) => void;
}

const StarRating: React.FC<{ stars: 0 | 1 | 2 | 3; label: string }> = ({ stars, label }) => {
  if (stars === 0) {
    return (
      <span
        className="mono"
        title={label}
        style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 600 }}
      >
        ✕ No window
      </span>
    );
  }
  const color = stars === 3 ? '#fbbf24' : stars === 2 ? '#38bdf8' : '#94a3b8';
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {[1, 2, 3].map((idx) => (
        <Star
          key={idx}
          size={11}
          fill={idx <= stars ? color : 'transparent'}
          color={idx <= stars ? color : '#334e68'}
        />
      ))}
    </span>
  );
};

export const BestDatesStrip: React.FC<BestDatesStripProps> = ({
  selectedStartDateStr,
  candidates,
  loading,
  onSelectStartDate,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '12px 14px',
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Sparkles size={15} color="#2dd4bf" />
          <strong style={{ fontSize: '0.86rem' }}>
            Best Start Dates Around Selection (±3 Days)
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ★★★ Mid-day (≥90m from sunrise/sunset) · ★★☆ Good (≥30m) · ★☆☆ Near dawn/dusk
          </span>
        </div>
        {loading && (
          <span className="mono" style={{ fontSize: '0.73rem', color: 'var(--accent-ocean)' }}>
            Evaluating 7-day window…
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {candidates.map((c) => {
          const isSelected = c.startDateStr === selectedStartDateStr;
          const weekday = parseYMD(c.startDateStr).toLocaleDateString('en-US', {
            weekday: 'short',
          });
          const statusColor =
            c.overallStatus === 'SAFE'
              ? 'var(--safe)'
              : c.overallStatus === 'TIGHT'
                ? 'var(--tight)'
                : 'var(--danger)';
          const statusBg =
            c.overallStatus === 'SAFE'
              ? 'var(--safe-bg)'
              : c.overallStatus === 'TIGHT'
                ? 'var(--tight-bg)'
                : 'var(--danger-bg)';

          return (
            <button
              key={c.startDateStr}
              type="button"
              onClick={() => onSelectStartDate(c.startDateStr)}
              title={c.ratingLabel}
              style={{
                textAlign: 'left',
                background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'var(--bg-app)',
                border: `1.5px solid ${
                  isSelected
                    ? 'var(--accent-ocean)'
                    : c.isBest
                      ? 'rgba(251, 191, 36, 0.55)'
                      : 'var(--border)'
                }`,
                borderRadius: 10,
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 4,
                }}
              >
                <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  {weekday}, {formatShortDate(c.startDateStr)}
                </span>
                {c.isBest && (
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      background: 'rgba(251, 191, 36, 0.18)',
                      color: '#fbbf24',
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}
                  >
                    BEST
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <StarRating stars={c.stars} label={c.ratingLabel} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: statusColor,
                  background: statusBg,
                  padding: '2px 6px',
                  borderRadius: 5,
                  width: 'fit-content',
                }}
              >
                {c.overallStatus === 'SAFE' ? (
                  <CheckCircle2 size={11} />
                ) : c.overallStatus === 'TIGHT' ? (
                  <Clock size={11} />
                ) : (
                  <AlertTriangle size={11} />
                )}
                {c.impassableCount > 0
                  ? `${c.impassableCount} Impassable`
                  : c.tightCount > 0
                    ? `${c.safeCount}/${c.totalZones} Safe · ${c.tightCount} Tight`
                    : `${c.safeCount}/${c.totalZones} Safe`}
              </div>

              <div
                className="mono"
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {c.zone2Preview}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
