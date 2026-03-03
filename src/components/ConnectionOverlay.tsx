import { memo } from 'react';
import type { ConnectionStatus } from '../types';

interface Props {
  status: ConnectionStatus;
  onSetup: () => void;
  onTroubleshoot: () => void;
}

export const ConnectionOverlay = memo(function ConnectionOverlay({
  status,
  onSetup,
  onTroubleshoot,
}: Props) {
  if (status !== 'gateway_down' && status !== 'error') return null;

  const isGateway = status === 'gateway_down';

  return (
    <div className="connection-overlay">
      <div className="co-card">
        <div className={`co-icon-ring ${isGateway ? 'co-warning' : 'co-error'}`}>
          {isGateway ? (
            <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </div>

        <h2 className="co-title">
          {isGateway ? 'IBKR Gateway Not Connected' : 'Connection Error'}
        </h2>

        <p className="co-description">
          {isGateway
            ? 'The Interactive Brokers Gateway is required to stream live market data. Make sure IB Gateway or TWS is running and configured to accept API connections.'
            : 'Unable to reach the data server. This usually means the dev server isn\u2019t running or there\u2019s a network issue.'}
        </p>

        <div className="co-actions">
          {isGateway && (
            <button className="co-btn co-btn-primary" onClick={onSetup}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
              Setup Guide
            </button>
          )}
          <button className="co-btn co-btn-secondary" onClick={onTroubleshoot}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Troubleshoot
          </button>
        </div>

        <div className="co-pulse-hint">
          <span className="co-pulse-dot" />
          Retrying automatically&hellip;
        </div>
      </div>
    </div>
  );
});
