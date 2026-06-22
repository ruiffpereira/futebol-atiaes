// Conjunto de ícones SVG line-style (traço fino e consistente) — substituem os emojis.
// Herdam a cor via `currentColor` e aceitam `size`.
import type { CSSProperties } from "react";

type P = { size?: number; color?: string; style?: CSSProperties; strokeWidth?: number };

const base = (
  size: number,
  color?: string,
  style?: CSSProperties,
  sw = 1.7,
): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color || "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  style,
});

export function Trophy({ size = 24, color, style, strokeWidth }: P) {
  return (
    <svg {...base(size, color, style, strokeWidth)}>
      <path d="M7 4.5h10v4.5a5 5 0 0 1-10 0V4.5Z" />
      <path d="M17 5.5h2.3A1.5 1.5 0 0 1 20.8 7c0 2.3-1.7 3.7-3.8 3.9" />
      <path d="M7 5.5H4.7A1.5 1.5 0 0 0 3.2 7c0 2.3 1.7 3.7 3.8 3.9" />
      <path d="M12 14v3.4M8.6 20.5h6.8M9.6 20.5c0-1.8 1-3.1 2.4-3.1s2.4 1.3 2.4 3.1" />
    </svg>
  );
}

export function Broadcast({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="12" r="2.1" fill={color || "currentColor"} stroke="none" />
      <path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8" />
      <path d="M5.3 5.3a9.4 9.4 0 0 0 0 13.4M18.7 5.3a9.4 9.4 0 0 1 0 13.4" />
    </svg>
  );
}

export function Calendar({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.4" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function Chart({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M4 20.5h16.5" />
      <path d="M6.5 20V13M11.5 20V8M16.5 20v-5" />
    </svg>
  );
}

export function User({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

export function Bell({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M6.2 9.5a5.8 5.8 0 0 1 11.6 0c0 3.8 1.5 5.3 2.1 5.8H4.1c.6-.5 2.1-2 2.1-5.8Z" />
      <path d="M9.9 19a2.2 2.2 0 0 0 4.2 0" />
    </svg>
  );
}

export function BellOff({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      {/* sino completo (igual ao ativo) + barra diagonal = desligado */}
      <path d="M6.2 9.5a5.8 5.8 0 0 1 11.6 0c0 3.8 1.5 5.3 2.1 5.8H4.1c.6-.5 2.1-2 2.1-5.8Z" />
      <path d="M9.9 19a2.2 2.2 0 0 0 4.2 0" />
      <path d="M3.4 3.4 20.6 20.6" stroke={color || "currentColor"} strokeWidth="2.2" />
    </svg>
  );
}

export function Ball({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.6l3.2 2.3-1.2 3.7H10l-1.2-3.7L12 7.6Z" />
      <path d="M12 3.3v4.3M5.4 8.7l3.4 1.2M18.6 8.7l-3.4 1.2M8.7 19.2l1.3-2.6h4l1.3 2.6" />
    </svg>
  );
}

export function Gloves({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M9 13V5.4a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M11.8 11V4.6a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M14.6 11V6.6a1.4 1.4 0 0 1 2.8 0V14a6.3 6.3 0 0 1-6.3 6.3h-1A5.8 5.8 0 0 1 7 18.3l-2-2.4a1.5 1.5 0 0 1 2.2-2.1L9 15.3V9a1.4 1.4 0 0 1 2.8 0" />
    </svg>
  );
}

export function Shield({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M12 3.2 19 5.6v5.2c0 4.6-3 7.9-7 9.4-4-1.5-7-4.8-7-9.4V5.6L12 3.2Z" />
      <path d="m9 12 2 2 4-4.2" />
    </svg>
  );
}

export function Document({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M6.5 3h7l5 5v12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13 3v5h5M9 13h6M9 16.5h6M9 9.5h2.5" />
    </svg>
  );
}

export function Clock({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2v5l3.3 1.9" />
    </svg>
  );
}

export function MapPin({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M12 21c4.4-4.2 6.6-7.6 6.6-10.7A6.6 6.6 0 0 0 5.4 10.3c0 3.1 2.2 6.5 6.6 10.7Z" />
      <circle cx="12" cy="10.2" r="2.5" />
    </svg>
  );
}

export function Chevron({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function Check({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  );
}

export function Grid({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <rect x="3.5" y="4" width="17" height="7" rx="2" />
      <rect x="3.5" y="14" width="17" height="6" rx="2" />
    </svg>
  );
}

export function List({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
    </svg>
  );
}

export function Download({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M12 3.5v11" />
      <path d="M8 10.5l4 4 4-4" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function Share({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M12 3.5v10.5" />
      <path d="M8.5 7 12 3.5 15.5 7" />
      <path d="M7.5 11H6a1.6 1.6 0 0 0-1.6 1.6v7.3A1.6 1.6 0 0 0 6 21.5h12a1.6 1.6 0 0 0 1.6-1.6v-7.3A1.6 1.6 0 0 0 18 11h-1.5" />
    </svg>
  );
}

export function PlusSquare({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export function Info({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.2" />
      <path d="M12 7.6h.01" />
    </svg>
  );
}

export function Chat({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
      <path d="M7.5 9.5h9M7.5 13h6" />
    </svg>
  );
}

export function Send({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M20.5 3.5 10 14M20.5 3.5l-6.5 17-3.5-7.5L3 9.5l17.5-6Z" />
    </svg>
  );
}

export function Star({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
    </svg>
  );
}

export function Sun({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </svg>
  );
}

export function Moon({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M20 14.2A8 8 0 1 1 9.8 4 6.3 6.3 0 0 0 20 14.2Z" />
    </svg>
  );
}

export function Monitor({ size = 24, color, style }: P) {
  return (
    <svg {...base(size, color, style)}>
      <rect x="3" y="4.5" width="18" height="12" rx="2.2" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </svg>
  );
}

// Cartão (amarelo/vermelho) — retângulo cheio inclinado.
export function Card({ size = 14, color = "#eab308", style }: P) {
  return (
    <svg width={size * (10 / 14)} height={size} viewBox="0 0 10 14" aria-hidden style={style}>
      <rect x="1" y="0.5" width="8" height="13" rx="1.6" fill={color} transform="rotate(8 5 7)" />
    </svg>
  );
}

// ---- Badge de equipa (círculo colorido + iniciais), como no design de referência ----
const BADGE_COLORS = [
  "#d4a017", "#dc2626", "#2563eb", "#16a34a", "#7c3aed",
  "#0891b2", "#ea580c", "#db2777", "#4f46e5", "#0d9488",
];
const STOP = new Set([
  "de", "da", "do", "dos", "das", "e", "os", "as", "o", "a",
  "fc", "sc", "cd", "cf", "ac", "sl", "cp", "club", "clube",
]);
export function teamColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return BADGE_COLORS[h % BADGE_COLORS.length];
}
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => !STOP.has(w.toLowerCase()));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const w = words[0] || name.trim();
  return (w.slice(0, 2) || "?").toUpperCase();
}
export function TeamBadge({
  name,
  seed,
  logo,
  size = 30,
  style,
}: {
  name: string;
  seed?: string;
  logo?: string;
  size?: number;
  style?: CSSProperties;
}) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: "50%",
          objectFit: "cover",
          background: "var(--surface-2, #eef2ec)",
          ...style,
        }}
      />
    );
  }
  const bg = teamColor(seed || name);
  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        letterSpacing: 0.2,
        ...style,
      }}
    >
      {initials(name)}
    </span>
  );
}
