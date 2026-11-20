import React, { useState } from 'react';
import { ShieldAlert, CheckSquare, Square, Car, ExternalLink } from 'lucide-react';

const CHECKLIST_ITEMS = [
  {
    id: 'bear-can',
    label: 'Hard-sided bear canister (1 per person, no exceptions)',
    detail: 'Bear bags are illegal and subject to fine. Rentals available at King Range Visitor Center.',
  },
  {
    id: 'calfire',
    label: 'CAL FIRE campfire permit (free online)',
    detail: 'Required even to operate a backpacking camp stove.',
  },
  {
    id: 'shuttle',
    label: 'Point-to-point shuttle arranged (~2 hr drive between trailheads)',
    detail: 'Park at finish (e.g. Black Sands Beach) and shuttle to Mattole (e.g. Lost Coast Adventures or 2-car self-shuttle).',
  },
  {
    id: 'marine',
    label: 'Check NWS Marine Forecast & NDBC buoy swell the day before',
    detail: 'Big swell raises effective water level and creates sneaker waves; 50°F water has ~20 min survival time.',
  },
  {
    id: 'comms',
    label: 'Satellite communicator (inReach / PLB) & self-rescue plan',
    detail: 'No cell service and no dedicated BLM Search & Rescue team on the Lost Coast.',
  },
  {
    id: 'lnt',
    label: 'Pack out all toilet paper & wet wipes; treat all creek water',
    detail: 'Coastal creeks rise fast after rain—never cross above knee height.',
  },
];

export const TrailChecklistCard: React.FC = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doneCount = CHECKLIST_ITEMS.filter((i) => checked[i.id]).length;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <ShieldAlert size={17} color="#ef4444" />
          Non-Negotiables &amp; Safety Checklist
        </h2>
        <span className="badge badge-ocean mono">
          {doneCount}/{CHECKLIST_ITEMS.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = !!checked[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
                padding: '7px 9px',
                borderRadius: 8,
                background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-panel-alt)',
                border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              {isDone ? (
                <CheckSquare size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              ) : (
                <Square size={16} color="#6c8296" style={{ flexShrink: 0, marginTop: 2 }} />
              )}
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: isDone ? 'line-through' : 'none',
                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                  {item.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <a
          href="https://www.weather.gov/eka/"
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ fontSize: '0.75rem' }}
        >
          NWS Eureka / Marine <ExternalLink size={12} />
        </a>
        <a
          href="https://permit.preventwildfiresca.org/"
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ fontSize: '0.75rem' }}
        >
          CAL FIRE Permit <ExternalLink size={12} />
        </a>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            marginLeft: 'auto',
          }}
        >
          <Car size={13} /> King Range VC: (707) 986-5400
        </span>
      </div>
    </div>
  );
};
