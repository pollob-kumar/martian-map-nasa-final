import { useMemo } from "react";
import { WAYPOINTS } from "@/data/route";

/** Plan view of the real Perseverance traverse (lon/lat), coloured by elevation. */
export function TraverseChart() {
  const { segs, minE, maxE, box } = useMemo(() => {
    const lats = WAYPOINTS.map((w) => w.lat);
    const lons = WAYPOINTS.map((w) => w.lon);
    const els = WAYPOINTS.map((w) => w.elev);
    const box = { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLon: Math.min(...lons), maxLon: Math.max(...lons) };
    const minE = Math.min(...els);
    const maxE = Math.max(...els);
    const cos = Math.cos((18.44 * Math.PI) / 180);
    const spanX = (box.maxLon - box.minLon) * cos;
    const spanY = box.maxLat - box.minLat;
    const scale = 300 / Math.max(spanX, spanY);
    const px = (lon: number) => 10 + (lon - box.minLon) * cos * scale;
    const py = (lat: number) => 10 + (box.maxLat - lat) * scale;
    const segs = WAYPOINTS.slice(1).map((w, i) => {
      const a = WAYPOINTS[i]!;
      return { x1: px(a.lon), y1: py(a.lat), x2: px(w.lon), y2: py(w.lat), t: (w.elev - minE) / (maxE - minE) };
    });
    return { segs, minE, maxE, box };
  }, []);
  const first = segs[0]!;
  const last = segs[segs.length - 1]!;
  return (
    <div>
      <svg viewBox="0 0 320 320" className="w-full rounded-sm border border-border bg-background/60">
        {segs.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            strokeWidth={2}
            strokeLinecap="round"
            stroke={`color-mix(in oklab, var(--hud) ${Math.round((1 - s.t) * 100)}%, var(--warn))`}
          />
        ))}
        <circle cx={first.x1} cy={first.y1} r={5} fill="var(--hud)" />
        <text x={first.x1 + 8} y={first.y1 + 4} fill="var(--hud-text)" fontSize="11" fontFamily="Rajdhani">
          Landing
        </text>
        <circle cx={last.x2} cy={last.y2} r={5} fill="var(--warn)" />
        <text x={last.x2 + 8} y={last.y2 - 6} fill="var(--hud-text)" fontSize="11" fontFamily="Rajdhani">
          Latest
        </text>
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>
          {box.minLon.toFixed(2)}–{box.maxLon.toFixed(2)}°E
        </span>
        <span>
          elev {Math.round(minE)} → {Math.round(maxE)} m
        </span>
      </div>
    </div>
  );
}
