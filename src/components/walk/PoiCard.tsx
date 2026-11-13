import { X } from "lucide-react";
import type { Poi } from "@/data/walkSite";
import { bearingTo, distanceM, type Pose } from "@/lib/walk";

export function PoiCard({ poi, pose, visited, onClose }: { poi: Poi; pose: Pose; visited: boolean; onClose: () => void }) {
  const d = distanceM(pose, poi);
  return (
    <div
      role="dialog"
      aria-label={poi.name}
      className="absolute left-1/2 top-[29%] z-20 max-h-[52%] w-[36%] min-w-[220px] -translate-x-1/2 overflow-y-auto rounded-md border border-hud-soft bg-background/85 p-[1cqw] text-[clamp(10px,0.95cqw,14px)] leading-snug text-hud-text shadow-[0_0_2cqw_var(--hud-faint)] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[0.85em] uppercase tracking-widest text-hud">
            {poi.kind}
            {poi.reachable ? (visited ? " · explored ✓" : " · not explored yet") : " · on the horizon"}
          </p>
          <h3 className="font-display text-[1.45em] font-bold leading-tight text-glow">{poi.name}</h3>
        </div>
        <button onClick={onClose} aria-label="Close card" className="rounded-sm border border-hud-soft p-1 hover:bg-hud-faint">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <figure className="mt-[0.6cqw]">
        <img src={poi.photo.url} alt={poi.photo.caption} className="aspect-[21/9] w-full rounded-sm object-cover" loading="lazy" />
        <figcaption className="mt-1 text-[0.85em] text-muted-foreground">
          {poi.photo.caption} · {poi.photo.credit} ·{" "}
          <a href={poi.photo.pageUrl} target="_blank" rel="noreferrer" className="text-hud hover:underline">
            NASA ↗
          </a>
        </figcaption>
      </figure>

      <p className="mt-[0.6cqw]">{poi.summary}</p>

      <dl className="mt-[0.6cqw] grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[0.9em]">
        <dt className="text-hud">From you</dt>
        <dd>
          {poi.reachable ? `${d.toFixed(1)} m` : "≈2.3 km+"} · bearing {Math.round(bearingTo(pose, poi))}°
        </dd>
        {poi.facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-hud">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-[0.6cqw] flex flex-wrap gap-x-3 gap-y-1 border-t border-hud-soft pt-[0.5cqw] text-[0.85em]">
        <span className="text-muted-foreground">Sources:</span>
        {poi.sources.map((s) => (
          <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="text-hud hover:underline">
            {s.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
