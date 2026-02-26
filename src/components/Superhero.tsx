import { memo } from 'react';

/**
 * Flying superhero SVG with animated cape and idle bob.
 * Cape sway and vertical bob are handled by CSS keyframes
 * defined in App.css so they run on the compositor thread.
 */
export const Superhero = memo(function Superhero() {
  return (
    <svg
      viewBox="0 0 160 100"
      width={120}
      height={80}
      className="superhero-svg"
      aria-label="Superhero flying alongside the chart"
    >
      <defs>
        <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="cape" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <filter id="hero-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#hero-glow)">
        {/* Cape */}
        <path
          className="hero-cape"
          d="M62,38 C50,44 30,58 20,80 C27,75 36,80 46,72
             C42,64 48,52 58,44 Z"
          fill="url(#cape)"
          opacity="0.92"
        />

        {/* Back leg + boot */}
        <path d="M60,56 L44,70 L48,74 L64,60 Z" fill="#1e3a8a" />
        <ellipse cx="45" cy="73" rx="5" ry="3" fill="#dc2626" />

        {/* Torso */}
        <ellipse cx="82" cy="46" rx="26" ry="14" fill="url(#suit)" />

        {/* Front leg + boot */}
        <path d="M64,54 L50,68 L54,72 L68,58 Z" fill="#2563eb" />
        <ellipse cx="51" cy="71" rx="5" ry="3" fill="#dc2626" />

        {/* Belt */}
        <rect x="70" y="44" width="24" height="5" rx="2.5" fill="#fbbf24" />
        <circle
          cx="82"
          cy="46.5"
          r="3.5"
          fill="#fcd34d"
          stroke="#f59e0b"
          strokeWidth="0.8"
        />

        {/* Back arm */}
        <path d="M68,40 L50,48 L52,52 L70,44 Z" fill="#1e3a8a" />

        {/* Head */}
        <circle cx="112" cy="32" r="13" fill="#fde68a" />

        {/* Mask / helmet */}
        <path
          d="M102,27 L112,20 L122,27 L122,34 L118,36 L106,36 L102,34 Z"
          fill="#1e3a8a"
        />

        {/* Eyes */}
        <ellipse cx="108" cy="30" rx="3" ry="2" fill="white" />
        <ellipse cx="116" cy="30" rx="3" ry="2" fill="white" />
        <circle cx="109" cy="30.2" r="1.2" fill="#0f172a" />
        <circle cx="117" cy="30.2" r="1.2" fill="#0f172a" />

        {/* Front arm */}
        <path d="M105,40 L136,28 L138,32 L108,44 Z" fill="#2563eb" />

        {/* Fist */}
        <circle cx="138" cy="29" r="5" fill="#fde68a" />

        {/* Emblem on chest */}
        <text
          x="82"
          y="49"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#fbbf24"
          fontFamily="sans-serif"
        >
          S
        </text>
      </g>
    </svg>
  );
});
