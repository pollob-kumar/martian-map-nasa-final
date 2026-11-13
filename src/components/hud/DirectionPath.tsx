// Perspective route lane drawn in the visor's own 1760x1000 space.
type Props = { curve: number; phase: number };

const W = 1760;
const H = 1000;

type P = [number, number];

function quad(p0: P, p1: P, p2: P, t: number): P {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
}

export function DirectionPath({ curve, phase }: Props) {
  const c = Math.max(-300, Math.min(300, curve));
  const farY = 560;
  const L0: P = [690, H + 40], L1: P = [770, 760], L2: P = [848 + c, farY];
  const R0: P = [1070, H + 40], R1: P = [990, 760], R2: P = [912 + c, farY];
  const C0: P = [880, H + 40], C1: P = [880, 760], C2: P = [880 + c, farY];
  const lane = `M${L0} Q${L1} ${L2} L${R2} Q${R1} ${R0} Z`;

  const chevrons = [0, 1, 2, 3, 4].map((k) => {
    const t = ((k / 5 + phase) % 1) * 0.92;
    const [x, y] = quad(C0, C1, C2, t);
    const [x2, y2] = quad(C0, C1, C2, Math.min(1, t + 0.02));
    const ang = (Math.atan2(x2 - x, y - y2) * 180) / Math.PI;
    const w = (1 - t) * 190 + 22;
    const h = w * 0.2;
    const op = Math.min(1, (1 - t) * 1.6) * Math.min(1, t * 6 + 0.2);
    return { x, y, w, h, ang, op, k };
  });

  const markers = [0.25, 0.55, 0.8].flatMap((t) => [quad(L0, L1, L2, t), quad(R0, R1, R2, t)].map((p) => ({ p, t })));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="laneFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--hud)" stopOpacity="0.38" />
          <stop offset="0.55" stopColor="var(--hud)" stopOpacity="0.14" />
          <stop offset="1" stopColor="var(--hud)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="edgeFade" x1="0" y1="1" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--hud-text)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--hud-text)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d={lane} fill="url(#laneFill)" />
      <path d={`M${L0} Q${L1} ${L2}`} fill="none" stroke="var(--hud-text)" strokeOpacity="0.85" strokeWidth="3" className="hud-glow" />
      <path d={`M${R0} Q${R1} ${R2}`} fill="none" stroke="var(--hud-text)" strokeOpacity="0.85" strokeWidth="3" className="hud-glow" />
      {markers.map(({ p, t }, i) => (
        <ellipse key={i} cx={p[0]} cy={p[1]} rx={(1 - t) * 14 + 4} ry={(1 - t) * 5 + 1.5} fill="var(--hud-text)" opacity="0.9" />
      ))}
      {chevrons.map((ch) => (
        <polyline
          key={ch.k}
          points={`${-ch.w / 2},${ch.h} 0,0 ${ch.w / 2},${ch.h}`}
          transform={`translate(${ch.x} ${ch.y}) rotate(${ch.ang})`}
          fill="none"
          stroke="var(--hud-text)"
          strokeWidth={ch.w * 0.035 + 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={ch.op * 0.75}
        />
      ))}
    </svg>
  );
}
