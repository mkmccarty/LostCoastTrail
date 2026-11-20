import React, { useState } from 'react';
import { formatDisplayDate, getPermitDetails } from '../utils/permitUtils';
import { Ticket, ExternalLink, CalendarClock, Users, Flame } from 'lucide-react';

interface PermitPlannerCardProps {
  startDateStr: string;
}

export const PermitPlannerCard: React.FC<PermitPlannerCardProps> = ({ startDateStr }) => {
  const [groupSize, setGroupSize] = useState(2);
  const permit = getPermitDetails(startDateStr);
  const totalCost = permit.reservationFee + permit.perPersonFee * groupSize;

  const statusBadgeClass =
    permit.status === 'upcoming'
      ? 'badge-ocean'
      : permit.status === 'open_window'
        ? 'badge-safe'
        : 'badge-tight';

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Ticket size={17} color="#f59e0b" />
          Permit &amp; Booking Window
        </h2>
        <span className={`badge ${statusBadgeClass}`}>
          {permit.status === 'upcoming'
            ? `Opens in ${permit.daysUntilOpens}d`
            : permit.status === 'open_window'
              ? '90-Day Window Open'
              : 'Past Date'}
        </span>
      </div>

      {/* Big 90-day target box */}
      <div
        style={{
          background: 'var(--bg-app)',
          border: '1px solid var(--border-bright)',
          borderRadius: 10,
          padding: '11px 13px',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <CalendarClock size={13} color="#38bdf8" />
          90-Day Rolling Release (Recreation.gov #445864)
        </div>
        <div className="mono" style={{ fontSize: '1.02rem', fontWeight: 700, color: '#eef4f8' }}>
          {permit.bookingOpensLabel}
        </div>
        <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginTop: 3 }}>
          {permit.statusLabel}
        </div>
      </div>

      {/* Quota & Fee Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 12,
          fontSize: '0.8rem',
        }}
      >
        <div
          style={{
            background: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>Daily Wilderness Quota</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
            {permit.quotaPerDay} people / day
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {permit.seasonName} (shared w/ upland)
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div
            style={{
              fontSize: '0.71rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Estimated Fees</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} />
              <select
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                style={{
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  padding: '1px 4px',
                }}
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'hiker' : 'hikers'}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
            ${totalCost} total
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            $6 res + $12/adult (under 16 free)
          </div>
        </div>
      </div>

      {/* Key rules */}
      <ul
        style={{
          margin: '0 0 12px 0',
          paddingLeft: 18,
          fontSize: '0.77rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <li>
          <strong>Refund deadline:</strong> Cancel/shrink group by{' '}
          <span className="mono">{formatDisplayDate(permit.refundDeadlineStr)}</span> (7 days prior) to
          refund the $12/person fee.
        </li>
        <li>
          <strong>Walk-up backstop:</strong> Up to 3 starts/day via lottery Mon–Sat at 8:00 AM at
          King Range Visitor Center (707-986-5400).
        </li>
        <li style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Flame size={12} color={permit.campfireBanActive ? '#ef4444' : '#10b981'} />
          <span>
            <strong>Campfires:</strong>{' '}
            {permit.campfireBanActive
              ? 'BANNED (~June 19–Sept 30). Camp stove + CAL FIRE permit only.'
              : 'Allowed with CAL FIRE permit (check current BLM restrictions).'}
          </span>
        </li>
      </ul>

      {/* Official Links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <a
          href="https://www.recreation.gov/permits/445864"
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ fontSize: '0.76rem' }}
        >
          Recreation.gov #445864 <ExternalLink size={12} />
        </a>
        <a
          href="https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9418024"
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ fontSize: '0.76rem' }}
        >
          NOAA 9418024 <ExternalLink size={12} />
        </a>
        <a
          href="https://bigdirtyhikes.com/guides/lost-coast-trail-permit"
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ fontSize: '0.76rem' }}
        >
          BigDirtyHikes Guide <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
