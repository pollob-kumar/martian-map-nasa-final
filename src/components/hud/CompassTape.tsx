import { bracketCardinals, cardinalLabel, normalizeDeg } from "@/lib/mars";

const SPAN = 70; // degrees visible either side

export function CompassTape({ heading }: { heading: number }) {
  const h = normalizeDeg(heading);
  const [lo, hi] = bracketCardinals(h);
  const ticks: { x: number; major: boolean; label: string | null }[] = [];
  const start = Math.ceil((h - SPAN) / 5) * 5;
  for (let d = start; d <= h + SPAN; d += 5) {
    const x = ((d - h + SPAN) / (2 * SPAN)) * 1000;
    const major = normalizeDeg(d) % 15 === 0;
    ticks.push({ x, major, label: major ? (cardinalLabel(d) ?? String(normalizeDeg(d)).padStart(3, "0")) : null });
  }
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0 border-y border-hud-soft bg-gradient-to-b from-hud-faint via-transparent to-hud-faint"
        style={{ maskImage: "linear-gradient(90deg, transparent, black 18%, black 82%, transparent)" }}
      />
      <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="tapeFade" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.25" stopColor="white" stopOpacity="1" />
            <stop offset="0.75" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="tapeMask">
            <rect width="1000" height="200" fill="url(#tapeFade)" />
          </mask>
        </defs>
        <g mask="url(#tapeMask)">
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x}
              x2={t.x}
              y1={t.major ? 128 : 140}
              y2={162}
              stroke="var(--hud)"
              strokeWidth={t.major ? 3 : 2}
              opacity={t.major ? 0.9 : 0.55}
            />
          ))}
          {ticks
            .filter((t) => t.label && Math.abs(t.x - 500) > 190)
            .map((t, i) => (
              <text
                key={`l${i}`}
                x={t.x}
                y={92}
                textAnchor="middle"
                fill="var(--hud-text)"
                opacity={0.35}
                fontSize="54"
                fontFamily="Rajdhani, sans-serif"
                fontWeight={600}
              >
                {t.label}
              </text>
            ))}
        </g>
        <path d="M488 0 L512 0 L500 16 Z" fill="var(--hud)" />
        <path d="M488 200 L512 200 L500 184 Z" fill="var(--hud)" />
      </svg>
      <div className="absolute inset-x-0 top-[14%] text-center font-display text-[2.1cqw] font-semibold leading-none tracking-[0.12em] text-hud-text text-glow">
        <span className="text-hud">{lo}</span>
        <span className="mx-[1.2cqw] opacity-70">-</span>
        <span>{String(Math.round(h) % 360).padStart(3, "0")}</span>
        <span className="mx-[1.2cqw] opacity-70">-</span>
        <span className="text-hud">{hi}</span>
      </div>
    </div>
  );
}
