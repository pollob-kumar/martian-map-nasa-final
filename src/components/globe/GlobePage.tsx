import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { MarsGlobe } from "@/components/globe/MarsGlobe";
import { TraverseChart } from "@/components/globe/TraverseChart";
import { SITES } from "@/data/sites";
import { BASE, LAST_WAYPOINT, WAYPOINTS } from "@/data/route";
import { MARSWALK_ENTRY, MISSION_ENTRY_DELAY_MS, shouldEnterMission } from "@/lib/globeEntry";

export function GlobePage() {
  const [selected, setSelected] = useState("perseverance");
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const navigate = useNavigate();
  const isHome = useRouterState({ select: s => s.location.pathname === "/" });
  useEffect(() => {
    if (!isHome || !ready) return;
    const enter = () => void navigate(MARSWALK_ENTRY);
    const timer = window.setTimeout(enter, MISSION_ENTRY_DELAY_MS);
    let count = 0;
    let last = 0;
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 10 || Date.now() - last < 400) return;
      last = Date.now();
      if (shouldEnterMission(++count)) enter();
    };
    let touchY = 0;
    const touchStart = (e: TouchEvent) => { touchY = e.changedTouches[0]?.clientY ?? 0; };
    const touchEnd = (e: TouchEvent) => {
      if (touchY - (e.changedTouches[0]?.clientY ?? touchY) > 60 && shouldEnterMission(++count)) enter();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchend", touchEnd, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchend", touchEnd);
    };
  }, [isHome, ready, navigate]);
  const site = SITES.find((s) => s.id === selected) ?? SITES[0];
  if (!site) return null;
  const last = LAST_WAYPOINT;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <SiteNav />
      <div className="grid flex-1 gap-6 pb-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:pr-6">
        <section
          className="relative min-h-[62svh] overflow-hidden lg:min-h-[78svh]"
          aria-label="Mars globe"
          data-scene-ready={ready ? "true" : undefined}
        >
          <h1 className="sr-only">Mars globe</h1>
          {!ready && (
            <p className="absolute inset-0 z-10 flex items-center justify-center font-mono text-sm text-muted-foreground">
              Loading NASA Viking mosaic…
            </p>
          )}
          <Button asChild className="absolute right-4 bottom-10 z-10 bg-accent text-accent-foreground hover:bg-accent/90 font-display font-bold">
            <Link to="/mission-map"><Map /> Mission Map <ArrowRight /></Link>
          </Button>
          <div className="absolute inset-0">
            <MarsGlobe selected={selected} onSelect={setSelected} onReady={onReady} />
          </div>
          <p className="pointer-events-none absolute bottom-2 left-3 z-10 font-mono text-[10px] text-muted-foreground">
            Imagery: NASA/JPL/USGS Viking MDIM 2.1 via NASA Mars Trek
          </p>
        </section>

        <aside className="flex flex-col gap-5 px-4 lg:px-0">
          <div className="border-b border-border pb-5">
            <h2 className="mt-1 font-display text-2xl font-bold text-hud-text">{site.name}</h2>
            <p className="mt-1 font-mono text-xs text-hud">
              {Math.abs(site.lat).toFixed(4)}°{site.lat >= 0 ? "N" : "S"} ·{" "}
              {(((site.lon % 360) + 360) % 360).toFixed(4)}°E
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{site.note}</p>
            <a href={site.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-hud underline-offset-2 hover:underline">
              Source ↗
            </a>
          </div>

          <div className="border-b border-border pb-5">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Fly to</p>
            <div className="flex flex-wrap gap-1.5">
              {SITES.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(s.id)}
                  className={`rounded-sm border px-2 py-1 font-display text-xs font-semibold tracking-wide ${s.id === selected ? "border-hud-soft bg-hud-faint text-hud-text" : "border-border text-muted-foreground hover:text-hud-text"}`}
                >
                  {s.name.split(" · ")[0]}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-b border-border pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Perseverance traverse · Jezero</p>
            <p className="mb-3 mt-1 font-display text-sm text-hud-text">
              {WAYPOINTS.length} NASA waypoints · Sol {BASE.sol}–{last.sol} · {(last.distTotal / 1000).toFixed(2)} km driven
            </p>
            <TraverseChart />
          </div>
        </aside>
      </div>
    </main>
  );
}
