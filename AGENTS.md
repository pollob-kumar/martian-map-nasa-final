<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Homepage timed and scroll entry runs only after globe readiness and opens `/mission-map?marswalk=true` directly; `/globe` remains a non-redirecting exploration destination so Back and Mars navigation stay usable.
- Shared phone page navigation lives in the root shell, separate from in-scene mission controls, with safe-area space reserved for both.
- Mars math (distance, bearing, Mars24 time, globe lat/lon mapping) lives in `src/lib/mars.ts` as pure TS with tests in `src/lib/mars.test.ts`; UI only draws its results so the formulas stay testable.
- NASA datasets are bundled as static files (`src/data/*.json`, CDN assets) rather than fetched at runtime, so the demo works offline from NASA endpoints and stays reproducible.
- The 3D globe route uses `ssr: false`, and site labels are HTML buttons projected per frame from one `useFrame` (not drei `<Html>`), which avoided React root-unmount errors. Globe gestures never navigate; explicit Mission Map links preserve rotation and normal scrolling.
- `vite.config.ts` strips dev-only `data-tsd-source` tags from files importing `@react-three/*`, because R3F treats dashed props as nested paths on three.js objects and crashes.
- Walk mode rules (pose stepping, zone clamp, visits, next target) live in `src/lib/walk.ts` with tests in `src/lib/walk.test.ts`; site data in `src/data/walkSite.ts`. `WalkView` is `React.lazy`-loaded from the SSR visor route so three.js never runs on the server.
- The nasa-martian-map Next.js frontend is ported into `src/nasa/` (files carry `@ts-nocheck`) and served at `/mission-map`; `/` and `/globe` share `GlobePage`, keeping globe entry consistent. Red-nav's visor lives at `/visor`. `nasa-martian-map/` is the untouched original source incl. the Python backend. The HUD calls same-origin `/api/*`, which `src/routes/api/$.ts` forwards to the backend (`REDNAV_BACKEND_URL`, default 127.0.0.1:8000), so the backend's CORS never needs editing; when offline the HUD retries quietly instead of showing an error.
- Red-nav's real NASA imagery reaches the nasa helmet scene only through `src/data/redNavScene.ts` (360° panorama tiles + photo cards), so both apps share one curated, credited photo list.
- The Visor guided tour is a static NASA photo sequence keyed by PIA in `src/data/guidedTour.ts`, separate from rover playback and walk mode, so it never implies a measured landing-to-delta walking route.
- Robot Visor links carry a validated `returnTo=marswalk` marker; Exit opens `/?marswalk=true`, which redirects to `/mission-map?marswalk=true` to bypass the intro without relying on browser history.
- EVA free exploration advances through the pure `advanceEvaWalk` helper without requiring backend routes; planned walks retain destination clamping. The mobile dock replaces the desktop dock below 768px.
- `src/routes/api/sounds.ts` lists the shipped `public/sounds/*` files statically (Workers cannot read the folder), and takes priority over the `/api/$` backend bridge.
- When the Python backend is offline, `src/routes/api/$.ts` serves saved GET answers from `public/backend-snapshot/` (mapped by `src/lib/backendSnapshot.ts`, regenerated with `scripts/snapshot_backend.py`), so the published app shows the backend's data without running Python; POST/probe calls stay live-only.
- Autonomous crew use local A* paths and swept collision checks from `src/lib/crewNavigation.ts`; physical scene objects register conservative ground footprints so crew cannot tunnel through them, while photo pixels and holographic markers are not physical obstacles.
