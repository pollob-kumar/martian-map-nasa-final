const BEAT =
  "M0 30 L30 30 L36 26 L42 30 L52 30 L56 36 L62 4 L68 50 L73 30 L86 30 L92 24 L100 30";

export function Ecg({ bpm }: { bpm: number }) {
  const beatSeconds = 60 / Math.max(30, bpm);
  return (
    <svg viewBox="0 0 200 56" className="h-full w-full overflow-hidden">
      <defs>
        <linearGradient id="ecgFade" x1="0" x2="1">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.2" stopColor="white" stopOpacity="1" />
          <stop offset="0.8" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="ecgMask">
          <rect width="200" height="56" fill="url(#ecgFade)" />
        </mask>
      </defs>
      <g mask="url(#ecgMask)">
        <g style={{ animation: `ecg-move ${beatSeconds}s linear infinite` }}>
          {[0, 100, 200].map((x) => (
            <path
              key={x}
              d={BEAT}
              transform={`translate(${x} 0)`}
              fill="none"
              stroke="var(--hud)"
              strokeWidth="2.4"
              strokeLinejoin="round"
              className="hud-glow"
            />
          ))}
        </g>
      </g>
      <style>{`@keyframes ecg-move { from { transform: translateX(0) } to { transform: translateX(-100px) } }`}</style>
    </svg>
  );
}
