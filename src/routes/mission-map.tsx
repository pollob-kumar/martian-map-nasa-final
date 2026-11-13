// @ts-nocheck -- ported as-is from nasa-martian-map/frontend
import { createFileRoute, Link } from "@tanstack/react-router";

import { useEffect, useMemo, useState } from "react";
import { Rocket, Layers, Volume2, VolumeX, ArrowLeft, Check } from "lucide-react";
import MarsHudLoader from "@/nasa/components/MarsHudLoader";
import { api } from "@/nasa/lib/api";
import type { RasterLayer, RegionSummary } from "@/nasa/lib/missionTypes";
import { OriginBadge } from "@/nasa/components/LayerToggleList";
import type { LayerState } from "@/nasa/components/RasterMap";
import { hudSound } from "@/nasa/utils/soundEffects";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { VISOR_PHOTOS } from "@/data/visorPhotos";
import { ORIGIN } from "@/nasa/components/LayerToggleList";
import { isMarswalkEntry } from "@/lib/visorReturn";

const LAYER_STORE = "rednav.layers";

function MissionMap() {
  const { marswalk } = Route.useSearch();
  const [regions, setRegions] = useState<RegionSummary[] | null>(null);
  const [picked, setPicked] = useState<string | null>(marswalk ? "jezero_hirise" : null);
  const [started, setStarted] = useState(marswalk);
  const [layers, setLayers] = useState<RasterLayer[] | null>(null);
  const [lay, setLay] = useState<LayerState>({});
  const [soundActive, setSoundActive] = useState(true);

  useEffect(() => {
    // Preload sounds
    void hudSound.loadAll();
    
    api.regions().then((r0) => {
      // Pick primary / Jezero raster region directly
      const primary = r0.find((x) => x.is_raster || x.id.includes("hirise") || x.role === "primary") ?? r0[0];
      setRegions(r0);
      setPicked(primary?.id ?? "jezero_hirise");
    }).catch(() => setPicked("jezero_hirise"));

    const loadLayers = () => api.layers().then((l) => {
      setLayers(l.layers);
      let saved: LayerState | null = null;
      try { saved = JSON.parse(localStorage.getItem(LAYER_STORE) ?? "null"); } catch { /* ignore */ }
      // Default with orthomosaic + hazard + elevation active for great visual look
      const defaults: LayerState = Object.fromEntries(
        l.layers.map((x) => [x.key, { on: x.key === "orthomosaic" || x.key === "hazard" || x.key === "elevation", opacity: x.default_opacity }])
      );
      setLay(saved ?? defaults);
    }).catch(() => { retryTimer = setTimeout(loadLayers, 4000); });
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    loadLayers();
    return () => { if (retryTimer) clearTimeout(retryTimer); };
  }, []);

  useEffect(() => {
    if (Object.keys(lay).length) {
      try { localStorage.setItem(LAYER_STORE, JSON.stringify(lay)); } catch { /* ignore */ }
    }
  }, [lay]);

  const toggleLayer = (key: string) => {
    hudSound.playClick();
    setLay((prev) => ({
      ...prev,
      [key]: { ...prev[key], on: !prev[key]?.on }
    }));
  };

  const handleLaunch = () => {
    hudSound.playTargetLock();
    if (soundActive) {
      hudSound.enabled = true;
      hudSound.startMartianWind();
    }
    setStarted(true);
  };

  const activeLayers = useMemo(() => (layers ?? []).filter((l) => lay[l.key]?.on).sort((a, b) => a.z - b.z), [layers, lay]);
  const realCount = layers?.filter((l) => l.origin === "nasa").length ?? 0;

  if (started && picked) return <MarsHudLoader regionId={picked} />;

  const background = VISOR_PHOTOS[0];
  const sector = regions?.find((region) => region.id === picked);
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {background && <img src={background.url} alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" />}
      <div className="pointer-events-none fixed inset-0 bg-background/80" />
      <div className="relative z-10">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:pt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <h1 className="font-display text-4xl font-bold">Mission Map</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground">{activeLayers.length} layers selected · {realCount} NASA sources</span>
              <Button variant="outline" size="icon" aria-label={soundActive ? "Mute sound" : "Enable sound"} title={soundActive ? "Mute sound" : "Enable sound"} aria-pressed={soundActive} onClick={() => { setSoundActive(!soundActive); hudSound.enabled = !soundActive; }}>
                {soundActive ? <Volume2 /> : <VolumeX />}
              </Button>
            </div>
          </div>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
            <section aria-label="Jezero Tactical Map" className="overflow-hidden rounded-md border border-border bg-background/90">
              <div className="flex flex-wrap justify-between gap-2 border-b border-border px-4 py-3 font-mono text-xs">
                <span className="text-hud">Jezero Crater</span>
                <span className="text-muted-foreground">18.4447° N · 77.4508° E</span>
              </div>
              <div className="relative aspect-square w-full overflow-hidden">
                <img src="/images/jezero_user_map.jpg" alt="Team-supplied Jezero terrain reference; source details in Data Sources" className="absolute inset-0 h-full w-full object-contain" />
                {activeLayers.map((layer) => <img key={layer.key} src={api.previewUrl(layer.key, 1024)} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: lay[layer.key]?.opacity ?? layer.default_opacity, mixBlendMode: layer.blend === "multiply" ? "multiply" : "screen" }} />)}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border p-3">
                {activeLayers.map((layer) => <span key={layer.key} className="flex items-center gap-2 font-mono text-xs"><span>{layer.label}</span><OriginBadge o={layer.origin} /></span>)}
                {!activeLayers.length && <span className="font-mono text-xs text-muted-foreground">Reference map</span>}
              </div>
            </section>
            <aside className="flex flex-col gap-6">
              <section>
                <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-display text-xl font-semibold"><Layers className="h-5 w-5 text-hud" />Map layers</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(layers ?? []).map((layer) => {
                    const on = !!lay[layer.key]?.on;
                    return <label key={layer.key} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${on ? "border-hud-soft bg-hud-faint" : "border-border bg-background/60"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleLayer(layer.key)} className="h-4 w-4 shrink-0 accent-primary" />
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{layer.label}</span><span className="font-mono text-[10px] text-muted-foreground">{ORIGIN[layer.origin]?.text ?? "SOURCE UNVERIFIED"}</span></span>
                      {on && <Check className="h-4 w-4 shrink-0 text-hud" />}
                    </label>;
                  })}
                </div>
              </section>
              <section className="border-y border-border py-4">
                <h2 className="font-display text-xl font-semibold">Mission sector</h2>
                <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="font-mono text-xs text-muted-foreground">REGION</dt><dd className="mt-1">{sector?.name.replace(/\s*\(DEMO DATA\)/gi, "") ?? "Jezero Crater"}</dd></div>
                  <div><dt className="font-mono text-xs text-muted-foreground">AUDIO</dt><dd className="mt-1">{soundActive ? "Recorded Mars wind" : "Muted"}</dd></div>
                </dl>
              </section>
              <Button size="lg" className="h-14 w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-bold" onClick={handleLaunch}><Rocket />INITIATE MARSWALK</Button>
              <div className="flex items-center justify-between text-sm">
                <Button asChild variant="ghost" size="sm"><Link to="/globe"><ArrowLeft />Mars globe</Link></Button>
                <Link to="/sources" className="text-hud underline-offset-4 hover:underline">Data sources ↗</Link>
              </div>
            </aside>
          </div>
          {background && <p className="mt-6 font-mono text-[11px] text-muted-foreground">Background: {background.pia} · {background.credit}</p>}
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/mission-map")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { marswalk?: boolean } => ({
    marswalk: isMarswalkEntry(search.marswalk),
  }),
  head: () => ({
    meta: [
      { title: "Martian Map — Jezero Mission Map & Marswalk" },
      { name: "description", content: "Layered NASA-data Mars map and Marswalk route planner with a helmet HUD." },
      { property: "og:title", content: "Martian Map — Jezero Mission Map" },
      { property: "og:description", content: "Layered NASA-data Mars map and Marswalk route planner with a helmet HUD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionMap,
});
