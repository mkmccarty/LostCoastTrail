import React, { useEffect, useState } from 'react';
import {
  fetchSameDateHistory,
  getMonthlyNormal,
  HistoricalYearSample,
} from '../utils/almanacService';
import { formatShortDate } from '../utils/permitUtils';
import { CloudRain, Thermometer, Wind, Waves } from 'lucide-react';

interface AlmanacCardProps {
  startDateStr: string;
}

export const AlmanacCard: React.FC<AlmanacCardProps> = ({ startDateStr }) => {
  const normal = getMonthlyNormal(startDateStr);
  const [history, setHistory] = useState<HistoricalYearSample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSameDateHistory(startDateStr).then((rows) => {
      if (!cancelled) {
        setHistory(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [startDateStr]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Thermometer size={17} color="#38bdf8" />
            Weather Almanac · {normal.monthName} (Shelter Cove)
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {normal.summary}
          </div>
        </div>
        <span className="badge badge-ocean mono">Ocean ~{normal.oceanTempF}°F</span>
      </div>

      {/* Monthly Climate Normals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 14,
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
          <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Avg High / Low</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
            {normal.avgHighF}° / {normal.avgLowF}°F
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
          <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Monthly Rain</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
            {normal.avgRainIn}&Prime;
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
          <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Rainy Days</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
            ~{normal.rainyDays} days/mo
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
          <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Water Temp</div>
          <div
            className="mono"
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Waves size={13} color="#38bdf8" /> {normal.oceanTempF}°F
          </div>
        </div>
      </div>

      {/* Past 5 Years on this Exact Calendar Date */}
      <div
        style={{
          background: 'var(--bg-app)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: '0.76rem',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>
            Actual Past Weather on {formatShortDate(startDateStr)} (Last 5 Years)
          </strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.71rem' }}>
            Open-Meteo Archive
          </span>
        </div>

        {loading ? (
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Loading historical observations…
          </div>
        ) : history.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Historical archive unavailable offline; use monthly climate normals above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {history.map((row) => (
              <div
                key={row.year}
                className="mono"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr 90px 85px',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  padding: '4px 6px',
                  borderRadius: 6,
                  background: 'var(--bg-panel)',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--accent-ocean)' }}>{row.year}</span>
                <span>
                  {row.highF}°F <span style={{ color: 'var(--text-muted)' }}>/ {row.lowF}°F</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: row.precipIn > 0.05 ? '#38bdf8' : 'var(--text-secondary)' }}>
                  <CloudRain size={12} /> {row.precipIn.toFixed(2)}&Prime;
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                  <Wind size={12} /> {row.maxWindMph} mph
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
