import { type MedicineType } from "./medicines-db";

// Generates a soft, premium SVG illustration of a medicine product based on type & name.
// Returns a data URL string suitable for use as <img src>.
export function medicineIllustration(name: string, type: MedicineType): string {
  // Deterministic accent tint from name
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const tintA = `hsl(${h} 35% 86%)`;
  const tintB = `hsl(${(h + 28) % 360} 35% 92%)`;

  const shape = renderShape(type, tintA, tintB);
  const initials = name
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="#FAF7F2"/>
        <stop offset="100%" stop-color="#F1ECE4"/>
      </radialGradient>
      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${tintB}"/>
        <stop offset="100%" stop-color="${tintA}"/>
      </linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <ellipse cx="200" cy="330" rx="120" ry="14" fill="#24312E" opacity="0.08" filter="url(#soft)"/>
    ${shape}
    <text x="200" y="380" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#7C8A84" letter-spacing="0.18em">${escapeXml(
      type.toUpperCase(),
    )} · ${escapeXml(initials)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

function renderShape(type: MedicineType, tintA: string, tintB: string): string {
  switch (type) {
    case "Syrup":
      return `
        <g transform="translate(140 90)">
          <rect x="20" y="10" width="80" height="22" rx="6" fill="#E8E2D7"/>
          <path d="M10 32 h100 v140 a18 18 0 0 1-18 18 H28 a18 18 0 0 1-18-18 Z" fill="url(#gA)" stroke="#fff" stroke-width="2"/>
          <rect x="22" y="60" width="76" height="120" rx="8" fill="#ffffff" opacity="0.55"/>
          <rect x="30" y="100" width="60" height="60" rx="4" fill="#ffffff"/>
        </g>`;
    case "Drops":
      return `
        <g transform="translate(150 80)">
          <rect x="30" y="8" width="40" height="26" rx="6" fill="#E8E2D7"/>
          <path d="M10 36 h80 v130 a16 16 0 0 1-16 16 H26 a16 16 0 0 1-16-16 Z" fill="url(#gA)" stroke="#fff" stroke-width="2"/>
          <rect x="22" y="80" width="56" height="80" rx="6" fill="#ffffff" opacity="0.6"/>
          <circle cx="50" cy="210" r="6" fill="${tintA}"/>
        </g>`;
    case "Tablet":
      return `
        <g transform="translate(110 150)">
          <rect x="0" y="0" width="180" height="100" rx="14" fill="#F2ECE2" stroke="#fff" stroke-width="2"/>
          ${[0, 1, 2].map((c) => [0, 1].map((r) => `<circle cx="${30 + c * 60}" cy="${30 + r * 40}" r="14" fill="url(#gA)"/>`).join("")).join("")}
        </g>`;
    case "Cream":
      return `
        <g transform="translate(120 110)">
          <rect x="0" y="0" width="160" height="60" rx="8" fill="#EFE8DD"/>
          <path d="M0 60 h160 l-20 130 a14 14 0 0 1-14 12 H34 a14 14 0 0 1-14-12 Z" fill="url(#gA)" stroke="#fff" stroke-width="2"/>
          <rect x="20" y="100" width="120" height="60" rx="6" fill="#fff" opacity="0.55"/>
        </g>`;
    case "Ointment":
      return `
        <g transform="translate(110 130)">
          <rect x="0" y="0" width="180" height="48" rx="10" fill="#EFE8DD"/>
          <path d="M10 48 h160 l-12 100 a12 12 0 0 1-12 10 H34 a12 12 0 0 1-12-10 Z" fill="url(#gA)"/>
          <path d="M70 -10 q20 -20 40 0 v10 H70 Z" fill="#E8E2D7"/>
        </g>`;
    case "Inhaler":
      return `
        <g transform="translate(140 90)">
          <rect x="0" y="40" width="120" height="160" rx="20" fill="url(#gA)" stroke="#fff" stroke-width="2"/>
          <rect x="40" y="0" width="40" height="60" rx="8" fill="#EFE8DD"/>
          <rect x="20" y="90" width="80" height="70" rx="6" fill="#fff" opacity="0.55"/>
        </g>`;
    default:
      return `
        <g transform="translate(130 110)">
          <rect x="0" y="0" width="140" height="180" rx="18" fill="url(#gA)" stroke="#fff" stroke-width="2"/>
          <rect x="20" y="40" width="100" height="60" rx="6" fill="#fff" opacity="0.6"/>
        </g>`;
  }
}
