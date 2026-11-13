import { LoaderCircle } from "lucide-react";
import { VISOR_PHOTOS } from "@/data/visorPhotos";
import logo from "@/assets/nakkhattra-399-logo.png.asset.json";

export function HelmetLoading() {
  const photo = VISOR_PHOTOS[0];
  return <section aria-label="Helmet loading" className="relative flex min-h-dvh w-full flex-col justify-between overflow-hidden bg-background text-foreground">
    {photo && <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
    <div className="absolute inset-0 bg-background/60" />
    <header className="relative flex items-center gap-3 px-6 py-6"><img src={logo.url} alt="Nakkhattra 399 team logo" className="h-16 w-16 rounded-sm object-contain" /><span className="font-display text-xl font-bold">MARTIAN MAP</span></header>
    <div className="relative mx-auto w-full max-w-3xl px-6 py-16">
      <p className="font-mono text-xs text-hud">JEZERO CRATER · SURFACE OPERATIONS</p>
      <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Preparing your helmet view</h1>
      <p role="status" className="mt-6 flex items-center gap-3 font-mono text-sm"><LoaderCircle className="h-5 w-5 animate-spin text-hud" />INITIALIZING HELMET SYSTEMS…</p>
      <div className="mt-5 h-px w-full bg-border"><div className="h-px w-1/3 animate-pulse bg-hud" /></div>
      <p className="mt-8 text-base text-foreground">Six Minds . One Mission . Earth to Cosmos</p>
    </div>
    <footer className="relative px-6 pb-6 font-mono text-xs text-foreground/80">{photo?.pia} · {photo?.credit}</footer>
  </section>;
}