import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const COOKIE_NAME = 'lct_disclaimer_accepted';

function hasAcceptedCookie(): boolean {
  return document.cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${COOKIE_NAME}=1`));
}

function setAcceptedCookie(): void {
  // Persist for 1 year across the site
  document.cookie = `${COOKIE_NAME}=1; max-age=31536000; path=/; SameSite=Lax`;
}

export const DisclaimerModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasAcceptedCookie()) {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const handleAccept = () => {
    setAcceptedCookie();
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(6, 11, 16, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 520,
          width: '100%',
          background: 'var(--bg-panel)',
          border: '1.5px solid var(--border-bright)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          padding: '22px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'var(--tight-bg)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <h2 id="disclaimer-title" style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700 }}>
            Welcome · Important Trip Planning Notice
          </h2>
        </div>

        <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
          This site was developed to help visualize and plan for a{' '}
          <strong>Lost Coast Trail</strong> backpacking trip.
        </p>

        <div
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 14,
            fontSize: '0.83rem',
            color: '#fecaca',
            lineHeight: 1.55,
          }}
        >
          <strong>For entertainment purposes only.</strong> Do not rely on this site for your own
          trip plan. Coastal tides, ocean swells, creek levels, and permit rules can be hazardous
          or change without notice. You must confirm all information directly from official sources
          before heading out.
        </div>

        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            marginBottom: 18,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span>Official sources:</span>
          <a
            href="https://www.recreation.gov/permits/445864"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
          >
            Recreation.gov #445864 <ExternalLink size={11} />
          </a>
          <a
            href="https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9418024"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
          >
            NOAA 9418024 <ExternalLink size={11} />
          </a>
          <a
            href="https://www.blm.gov/programs/national-conservation-lands/california/king-range-national-conservation-area"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
          >
            BLM King Range <ExternalLink size={11} />
          </a>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent-ocean)',
            color: '#06131c',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          I Understand — Continue
        </button>
      </div>
    </div>
  );
};
