import { Link } from "@tanstack/react-router";
import logo from "@/assets/nakkhattra-399-logo.png.asset.json";
import { BackButton } from "@/components/AppNavigation";

const links = [
  { to: "/globe", label: "Mars" },
  { to: "/mission-map", label: "Mission Map" },
  { to: "/visor", label: "Visor HUD" },
  { to: "/sources", label: "Data Sources" },
] as const;

export function SiteNav() {
  return (
    <header className="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:flex md:justify-between sm:px-6">
      <Link to="/globe" className="group flex min-w-0 items-center gap-3">
        <img src={logo.url} alt="Nakkhattra 399 team logo" className="h-14 w-14 shrink-0 rounded-sm object-contain" />
        <div className="min-w-0">
        <span className="font-display text-xl font-bold text-hud-text text-glow sm:text-2xl">
          MARTIAN <span className="text-hud">MAP</span>
        </span>
        <p className="max-w-64 text-xs text-muted-foreground sm:max-w-none">Six Minds . One Mission . Earth to Cosmos</p>
        </div>
      </Link>
      <div className="shrink-0"><BackButton /></div>
      <nav className="hidden items-center gap-1 font-display text-sm font-semibold uppercase md:flex">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={{ exact: true }}
            className={`rounded-sm border px-3 py-2 transition-colors ${l.to === "/mission-map" ? "border-border bg-accent text-accent-foreground hover:bg-accent/90" : "border-transparent text-muted-foreground hover:text-hud-text"}`}
            activeProps={{ className: "border-hud-soft bg-hud-faint text-hud-text" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
