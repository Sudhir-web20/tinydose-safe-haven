import type { SVGProps } from "react";

export function HeroIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 320 260"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="hero-bottle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.10" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id="hero-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft ambient glow */}
      <circle cx="170" cy="120" r="120" fill="url(#hero-glow)" className="text-primary" />

      {/* Leafy sprig — back layer */}
      <g
        className="text-primary"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      >
        <path d="M58 215 C 78 170, 110 140, 150 128" />
        <path d="M84 188 q -10 -16 4 -28 q 14 -6 22 8 q -8 16 -26 20 z" fill="currentColor" fillOpacity="0.10" />
        <path d="M110 165 q -8 -18 8 -28 q 16 -4 22 10 q -10 14 -30 18 z" fill="currentColor" fillOpacity="0.10" />
        <path d="M138 142 q -6 -18 10 -26 q 16 -2 20 12 q -12 12 -30 14 z" fill="currentColor" fillOpacity="0.10" />
      </g>

      {/* Medicine bottle */}
      <g transform="translate(150 50)">
        {/* cap */}
        <rect
          x="22"
          y="0"
          width="44"
          height="20"
          rx="5"
          className="text-accent"
          fill="currentColor"
          fillOpacity="0.55"
        />
        {/* neck */}
        <rect
          x="30"
          y="18"
          width="28"
          height="12"
          className="text-accent"
          fill="currentColor"
          fillOpacity="0.45"
        />
        {/* body */}
        <path
          d="M10 32 h68 v118 a16 16 0 0 1 -16 16 H26 a16 16 0 0 1 -16 -16 Z"
          className="text-primary"
          fill="url(#hero-bottle)"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1.4"
        />
        {/* label */}
        <rect
          x="20"
          y="74"
          width="48"
          height="56"
          rx="6"
          className="text-background"
          fill="currentColor"
          fillOpacity="0.7"
        />
        {/* label cross */}
        <g className="text-primary" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.65">
          <line x1="44" y1="90" x2="44" y2="114" />
          <line x1="32" y1="102" x2="56" y2="102" />
        </g>
        {/* liquid line */}
        <path
          d="M14 110 q 16 -6 32 0 t 30 0"
          className="text-primary"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.35"
        />
      </g>

      {/* Dropper, top-right */}
      <g transform="translate(238 28)" className="text-primary">
        <rect x="0" y="0" width="14" height="36" rx="3" fill="currentColor" fillOpacity="0.25" />
        <rect x="2" y="34" width="10" height="60" rx="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" />
        <circle cx="7" cy="104" r="6" fill="currentColor" fillOpacity="0.35" />
      </g>

      {/* Floating drops */}
      <g className="text-primary" fill="currentColor">
        <circle cx="245" cy="150" r="3" opacity="0.35" />
        <circle cx="262" cy="172" r="2" opacity="0.25" />
        <circle cx="232" cy="184" r="2.5" opacity="0.3" />
      </g>

      {/* Ground line */}
      <path
        d="M30 230 Q 160 245, 300 226"
        className="text-primary"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}
