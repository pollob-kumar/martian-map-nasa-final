type Props = { value: number; side: "left" | "right" };

/** Tall bracket-shaped gauge that fills from the bottom, like the visor reference. */
export function ArcGauge({ value, side }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const d = side === "left" ? "M78 590 Q -18 300 78 10" : "M22 590 Q 118 300 22 10";
  return (
    <svg viewBox="0 0 100 600" className="h-full w-full overflow-visible">
      <path d={d} fill="none" stroke="var(--hud-soft)" strokeWidth="34" strokeLinecap="round" />
      <path d={d} fill="none" stroke="var(--helmet)" strokeOpacity="0.55" strokeWidth="27" strokeLinecap="round" />
      <path
        d={d}
        pathLength={100}
        fill="none"
        stroke="var(--hud)"
        strokeWidth="17"
        strokeLinecap="round"
        strokeDasharray={`${v} 100`}
        className="hud-glow transition-[stroke-dasharray] duration-700"
      />
    </svg>
  );
}
