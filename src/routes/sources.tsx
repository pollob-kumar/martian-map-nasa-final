import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SITES } from "@/data/sites";
import { VISOR_PHOTOS } from "@/data/visorPhotos";
import { WALK_SOURCES } from "@/data/walkSite";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Data Sources — Martian Map" },
      {
        name: "description",
        content: "Every NASA dataset, image and algorithm used by Martian Map, with links, and which HUD values are simulated.",
      },
      { property: "og:title", content: "Data Sources — Martian Map" },
      { property: "og:description", content: "NASA data, imagery and algorithms behind the Martian Map visor HUD and Mars globe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SourcesPage,
});

const SOURCES = [
  {
    title: "Mission Map · Jezero MOLA elevation",
    by: "NASA Mars Global Surveyor · MOLA · USGS global mosaic · nominal 463 m/pixel",
    used: "The Western Delta region uses a saved crop of this elevation file. It cannot resolve small rocks or walking hazards. The default jezero_hirise region still uses simulated terrain; a verified HiRISE orthoimage is missing.",
    links: [
      { label: "Original MOLA GeoTIFF used by the download script", href: "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif" },
      { label: "NASA PDS Geosciences archive", href: "https://pds-geosciences.wustl.edu/" },
    ],
  },
  {
    title: "Mission Map · HiRISE terrain catalogue",
    by: "NASA Mars Reconnaissance Orbiter · University of Arizona HiRISE",
    used: "The original server lists this catalogue for real orthomosaics, terrain models and confidence layers. Listing the catalogue does not mean those files are installed; synthetic or derived layers remain labelled accordingly.",
    links: [{ label: "HiRISE digital terrain models", href: "https://www.uahirise.org/dtm/" }],
  },
  {
    title: "Mission Map · solar-event context",
    by: "NASA DONKI · optional live solar-flare feed",
    used: "The original server can request solar events from this service. The saved fallback shows illustrative values, not live readings. DONKI solar events are not Mars surface radiation-dose measurements.",
    links: [{ label: "NASA DONKI service", href: "https://api.nasa.gov/" }, { label: "DONKI event catalogue", href: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/" }],
  },
  {
    title: "Mission Map · official feature names and candidate maps",
    by: "IAU/USGS Gazetteer · USGS Astrogeology · NASA Mars Trek",
    used: "The original source manifest lists these portals for crater coordinates and candidate map downloads. Several Bangladesh-named crater coordinates remain approximate and need verification; portal links are not evidence of installed maps.",
    links: [{ label: "Official planetary names", href: "https://planetarynames.wr.usgs.gov/" }, { label: "USGS Astrogeology", href: "https://astrogeology.usgs.gov/" }, { label: "NASA Mars Trek", href: "https://trek.nasa.gov/mars/" }],
  },
  {
    title: "Perseverance (Mars 2020) rover waypoints",
    by: "NASA/JPL-Caltech · MMGIS Mars 2020 map",
    used: "Route, position (lat/lon), heading, elevation, rover tilt, sol, odometer, landing site (BASE) in the visor HUD; traverse line on the globe.",
    links: [
      { label: "M20_waypoints.json", href: "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json" },
      { label: "Where is the rover?", href: "https://science.nasa.gov/mission/mars-2020-perseverance/location-map/" },
    ],
  },
  {
    title: "Mars Viking MDIM 2.1 Colorized Global Mosaic (232 m)",
    by: "NASA/JPL/USGS · served by NASA Mars Trek (WMTS tiles, zoom 3, stitched to 4096×2048)",
    used: "Surface texture of the 3D Mars globe.",
    links: [
      { label: "NASA Mars Trek", href: "https://trek.nasa.gov/mars/" },
      {
        label: "Tile service layer",
        href: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml",
      },
    ],
  },
  {
    title: "Mars24 Sunclock algorithm",
    by: "NASA Goddard Institute for Space Studies (Allison & McEwen, 2000)",
    used: "Live Local Mean Solar Time shown next to the sol in the HUD.",
    links: [{ label: "Algorithm", href: "https://www.giss.nasa.gov/tools/mars24/help/algorithm.html" }],
  },
  {
    title: "Mars Fact Sheet",
    by: "NASA Space Science Data Coordinated Archive",
    used: "Mean Mars radius (3389.5 km) for distances and headings.",
    links: [{ label: "Fact sheet", href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html" }],
  },
  {
    title: "Surface photos inside the visor (team-supplied)",
    by: "Supplied by the Martian Map team — Perseverance raw-image frames (exact NASA image IDs to be confirmed)",
    used: "Two of the six ground views seen through the visor. Black frame borders were trimmed; no other edits.",
    links: [{ label: "NASA Mars 2020 raw images", href: "https://mars.nasa.gov/mars2020/multimedia/raw-images/" }],
  },
  ...VISOR_PHOTOS.filter((v) => v.pia).map((v) => ({
    title: `${v.pia} — ${v.title}`,
    by: `${v.credit} · ${v.date}`,
    used: `Jezero Crater view inside the visor. ${v.edit} No other edits, no AI.`,
    links: [
      { label: "NASA page", href: v.pageUrl },
      ...(v.fileUrl ? [{ label: "Original file", href: v.fileUrl }] : []),
    ],
  })),
  ...WALK_SOURCES.map((w) => ({ ...w, title: `Walk mode · ${w.title}` })),
];

function SourcesPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-4 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-hud-text">DATA SOURCES</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          NASA and USGS imagery and measurements appear alongside clearly labelled synthetic terrain and illustrative suit readings.
        </p>

        {[
          { title: "Maps & mission context", items: SOURCES.slice(0, 4) },
          { title: "Waypoints & calculations", items: [SOURCES[4], SOURCES[6], SOURCES[7]].filter((item): item is NonNullable<typeof item> => item !== undefined) },
          { title: "NASA imagery & surface exploration", items: [SOURCES[5], ...SOURCES.slice(8)].filter((item): item is NonNullable<typeof item> => item !== undefined) },
        ].map((group) => <section key={group.title} className="mt-8">
          <h2 className="font-display text-2xl font-semibold text-hud-text">{group.title}</h2>
        <ol className="mt-4 divide-y divide-border">
          {group.items.map((s, i) => (
            <li key={s.title} className="py-5">
              <p className="font-mono text-xs text-hud">[{i + 1}]</p>
              <h2 className="font-display text-xl font-bold text-hud-text">{s.title}</h2>
              <p className="text-sm text-muted-foreground">{s.by}</p>
              <p className="mt-2 text-sm">
                <span className="text-hud">Used for: </span>
                {s.used}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {s.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-hud underline-offset-2 hover:underline">
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ol>

        </section>)}

        <h2 className="mt-10 font-display text-2xl font-bold tracking-wider text-hud-text">Landing sites & landmarks on the globe</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Place</th>
                <th className="px-3 py-2 text-left">Lat</th>
                <th className="px-3 py-2 text-left">Lon (°E)</th>
                <th className="px-3 py-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {SITES.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2 text-hud-text">{s.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.lat.toFixed(4)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{(((s.lon % 360) + 360) % 360).toFixed(4)}</td>
                  <td className="px-3 py-2">
                    <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-hud hover:underline">
                      {s.kind === "landing" ? "NASA mission page" : "IAU/USGS Gazetteer"} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold tracking-wider text-hud-text">Simulated values</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Oxygen, power, heart rate, internal temperature and comms strength are simulated — they are not NASA data.
          Suit pressure uses 29.6 kPa (4.3 psi), the nominal operating pressure of NASA's xEMU exploration suit. The photo hazard
          box is an illustrative marker on a visible rock, not a verified collision detection. In walk mode, the glowing beacons and rings are HUD markers placed at real NASA
          coordinates — they are not real objects on Mars.
        </p>
      </div>
    </main>
  );
}
