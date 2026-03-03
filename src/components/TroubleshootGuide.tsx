import { memo, useState } from 'react';

interface Props {
  onBack: () => void;
  onSetup: () => void;
}

interface Section {
  title: string;
  icon: string;
  items: { problem: string; solution: string }[];
}

const SECTIONS: Section[] = [
  {
    title: 'Gateway Not Connected',
    icon: '\u26A0',
    items: [
      {
        problem: 'IB Gateway or TWS isn\u2019t running',
        solution: 'Launch IB Gateway (or TWS), log in, and wait until the status bar shows a green \u201cConnected\u201d indicator.',
      },
      {
        problem: 'API port mismatch',
        solution: 'Confirm the Socket port is set to 7497 in IB Gateway \u2192 Configure \u2192 Settings \u2192 API \u2192 Settings. The app expects port 7497 by default.',
      },
      {
        problem: 'Firewall or antivirus blocking the connection',
        solution: 'Allow IB Gateway and Node.js through your firewall. Both need access to localhost on port 7497.',
      },
      {
        problem: 'Paper vs. live account conflict',
        solution: 'Paper trading uses port 7497, live accounts use 7496. Make sure you\u2019re connecting to the correct port for your account type.',
      },
    ],
  },
  {
    title: 'Waiting for Data',
    icon: '\u23F3',
    items: [
      {
        problem: 'No market data subscription',
        solution: 'In IBKR Account Management, go to Settings \u2192 Market Data and ensure you have a US equities subscription active.',
      },
      {
        problem: 'Market is currently closed',
        solution: 'US equity markets operate 9:30 AM \u2013 4:00 PM Eastern Time, Monday through Friday. Data will flow when markets reopen.',
      },
      {
        problem: 'First connection takes a moment',
        solution: 'After starting IB Gateway, it may take 10\u201315 seconds for the first price tick to arrive. The app retries automatically.',
      },
      {
        problem: 'Delayed data not enabled',
        solution: 'If you don\u2019t have a real-time subscription, enable delayed data: in your code or gateway config, set Market Data Type to 3 (delayed).',
      },
    ],
  },
  {
    title: 'Connection Error',
    icon: '\u2716',
    items: [
      {
        problem: 'Dev server not running',
        solution: 'Run npm run dev from the project root to start the Vite development server.',
      },
      {
        problem: 'Port 5173 already in use',
        solution: 'Another process may be using port 5173. Stop it or let Vite choose an alternative port automatically.',
      },
      {
        problem: 'Network connectivity issue',
        solution: 'Check your internet connection and DNS settings. IB Gateway requires internet access to authenticate and stream data.',
      },
    ],
  },
  {
    title: 'No Data for a Specific Stock',
    icon: '\uD83D\uDCC9',
    items: [
      {
        problem: 'Exchange data not subscribed',
        solution: 'Some stocks trade on exchanges that require separate data subscriptions. Add the relevant market data bundle in Account Management.',
      },
      {
        problem: 'Ticker symbol not recognized',
        solution: 'Verify the symbol matches IBKR\u2019s contract database. Some symbols differ from other platforms (e.g. BRK B vs BRK.B).',
      },
      {
        problem: 'Contract ambiguity',
        solution: 'For stocks listed on multiple exchanges, IBKR may require a specific primary exchange. The app defaults to SMART routing.',
      },
    ],
  },
];

export const TroubleshootGuide = memo(function TroubleshootGuide({ onBack, onSetup }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="guide-page">
      <header className="sp-header guide-header">
        <button className="guide-back-btn" onClick={onBack} title="Go back">
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="guide-header-text">
          <h1>Troubleshooting</h1>
          <span className="sp-subtitle">common issues &amp; solutions</span>
        </div>
      </header>

      <div className="guide-content">
        <div className="guide-intro">
          <p>
            Having trouble connecting? Select an issue category below to find the
            most common causes and fixes.
          </p>
        </div>

        <div className="ts-sections">
          {SECTIONS.map((section, si) => {
            const isOpen = expanded === si;
            return (
              <div key={si} className={`ts-section ${isOpen ? 'open' : ''}`}>
                <button
                  className="ts-section-header"
                  onClick={() => setExpanded(isOpen ? null : si)}
                >
                  <span className="ts-icon">{section.icon}</span>
                  <span className="ts-section-title">{section.title}</span>
                  <span className={`ts-chevron ${isOpen ? 'open' : ''}`}>
                    <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="4 6 8 10 12 6" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="ts-items">
                    {section.items.map((item, ii) => (
                      <div key={ii} className="ts-item">
                        <div className="ts-problem">
                          <span className="ts-q">Q</span>
                          {item.problem}
                        </div>
                        <div className="ts-solution">
                          <span className="ts-a">A</span>
                          {item.solution}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="ts-cta">
          <p>Need to set up the gateway from scratch?</p>
          <button className="co-btn co-btn-primary" onClick={onSetup}>
            Open Setup Guide
          </button>
        </div>

        <div className="guide-footer">
          <button className="co-btn co-btn-secondary" onClick={onBack}>
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
});
