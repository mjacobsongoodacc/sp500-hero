import { memo } from 'react';

interface Props {
  onBack: () => void;
}

const STEPS = [
  {
    title: 'Create an IBKR Account',
    body: 'Sign up for an Interactive Brokers account at interactivebrokers.com. A free paper-trading account is sufficient for development and testing.',
    link: { label: 'Open IBKR Sign-Up', href: 'https://www.interactivebrokers.com/en/trading/free-trial2.php' },
  },
  {
    title: 'Download IB Gateway',
    body: 'Download the latest stable version of IB Gateway. It\u2019s lighter and more reliable than the full Trader Workstation (TWS) for API-only use.',
    link: { label: 'Download IB Gateway', href: 'https://www.interactivebrokers.com/en/trading/ibgateway-stable.php' },
  },
  {
    title: 'Configure API Settings',
    body: 'After installing, launch IB Gateway and navigate to Configure \u2192 Settings \u2192 API \u2192 Settings.',
    checklist: [
      'Enable ActiveX and Socket Clients',
      'Set Socket port to 7497',
      'Check \u201cAllow connections from localhost only\u201d',
      'Uncheck \u201cRead-Only API\u201d',
    ],
  },
  {
    title: 'Subscribe to Market Data',
    body: 'In your IBKR Account Management portal, go to Settings \u2192 Market Data Subscriptions. You\u2019ll need a US equities data bundle for live prices.',
    note: 'Free delayed data (15-minute delay) also works \u2014 set Market Data Type to \u201cDelayed\u201d in the gateway config.',
  },
  {
    title: 'Log In & Connect',
    body: 'Start IB Gateway and log in with your IBKR credentials. Wait for the status indicator to show \u201cConnected\u201d with a green icon. The gateway must stay running while you use S&P 500 Hero.',
  },
  {
    title: 'Launch the App',
    body: 'Start the development server from the project root. The app automatically connects to IB Gateway on localhost:7497.',
    code: 'npm run dev',
  },
] as const;

export const SetupGuide = memo(function SetupGuide({ onBack }: Props) {
  return (
    <div className="guide-page">
      <header className="sp-header guide-header">
        <button className="guide-back-btn" onClick={onBack} title="Go back">
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="guide-header-text">
          <h1>IBKR Gateway Setup</h1>
          <span className="sp-subtitle">step-by-step configuration guide</span>
        </div>
      </header>

      <div className="guide-content">
        <div className="guide-intro">
          <p>
            S&P 500 Hero connects to the Interactive Brokers TWS API to stream
            real-time market data. Follow the steps below to set up the connection.
          </p>
        </div>

        <div className="guide-steps">
          {STEPS.map((step, i) => (
            <div key={i} className="guide-step">
              <div className="step-badge">{i + 1}</div>
              <div className="step-body">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {'checklist' in step && step.checklist && (
                  <ul className="step-checklist">
                    {step.checklist.map((item, j) => (
                      <li key={j}>
                        <span className="check-icon">
                          <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
                            <polyline points="3.5 8 6.5 11 12.5 5" />
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {'note' in step && step.note && (
                  <div className="step-note">
                    <strong>Tip:</strong> {step.note}
                  </div>
                )}
                {'code' in step && step.code && (
                  <pre className="step-code"><code>{step.code}</code></pre>
                )}
                {'link' in step && step.link && (
                  <a
                    className="step-link"
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {step.link.label}
                    <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M5 3h8v8M13 3L5 11" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="guide-footer">
          <button className="co-btn co-btn-primary" onClick={onBack}>
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
});
