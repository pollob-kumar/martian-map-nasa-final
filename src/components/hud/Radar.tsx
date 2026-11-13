type Blip = { x: number; y: number }; // metres, heading-up frame (x right, y forward)

type Dot = Blip & { id: string; active?: boolean; done?: boolean; reachable?: boolean };

export function Radar({ path, rangeM, dots }: { path: Blip[]; rangeM: number; dots?: Dot[] }) {
  const s = (m: number) => (m / rangeM) * 44;
  const pts = path.filter((p) => Math.hypot(p.x, p.y) <= rangeM * 1.2);
  const next = path[0];
  return (
    <div className="relative h-full w-full border border-hud-soft bg-helmet/40 backdrop-blur-[1px]">
      <svg viewBox="-50 -50 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <clipPath id="radarClip">
            <circle r="46" />
          </clipPath>
        </defs>
        {[11, 22, 33, 44].map((r) => (
          <circle key={r} r={r} fill="none" stroke="var(--hud)" strokeOpacity="0.35" strokeWidth="0.6" />
        ))}
        <line x1="-46" x2="46" y1="0" y2="0" stroke="var(--hud)" strokeOpacity="0.25" strokeWidth="0.5" />
        <line y1="-46" y2="46" x1="0" x2="0" stroke="var(--hud)" strokeOpacity="0.25" strokeWidth="0.5" />
        <g clipPath="url(#radarClip)">
          <g style={{ transformOrigin: "0 0", animation: "radar-sweep 3.2s linear infinite" }}>
            <path d="M0 0 L0 -46 A46 46 0 0 1 32 -33 Z" fill="var(--hud)" fillOpacity="0.22" />
            <line x1="0" y1="0" x2="0" y2="-46" stroke="var(--hud)" strokeWidth="0.8" />
          </g>
          {dots?.map((d) => {
            const r = Math.hypot(d.x, d.y);
            const k = r > rangeM ? rangeM / r : 1; // out-of-range sites pinned to the rim so you still see the direction
            return (
              <circle
                key={d.id}
                cx={s(d.x * k)}
                cy={-s(d.y * k)}
                r={d.active ? 3 : 2}
                fill={d.done ? "none" : d.reachable === false ? "var(--warn)" : "var(--hud-text)"}
                stroke={d.done ? "var(--hud-text)" : "none"}
                strokeWidth="0.8"
                opacity={k < 1 ? 0.6 : 1}
              />
            );
          })}
          {!dots && pts.length > 0 && (
            <polyline
              points={["0,0", ...pts.map((p) => `${s(p.x)},${-s(p.y)}`)].join(" ")}
              fill="none"
              stroke="var(--hud-text)"
              strokeWidth="1"
              strokeDasharray="2 1.5"
            />
          )}
          {!dots && next && <circle cx={s(next.x)} cy={-s(next.y)} r="2.2" fill="var(--hud-text)" />}
        </g>
        <circle r="3" fill="var(--hud)" className="hud-glow" />
      </svg>
      <span className="absolute bottom-[3%] right-[5%] font-mono text-[0.75cqw] text-hud-text/70">{rangeM} m</span>
    </div>
  );
}
