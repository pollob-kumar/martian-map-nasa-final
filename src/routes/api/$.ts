import { createFileRoute } from "@tanstack/react-router";
import { snapshotPath } from "@/lib/backendSnapshot";

// Same-origin bridge to the untouched Python backend (nasa-martian-map/backend). The HUD calls
// /api/*; this forwards the request as-is, so the backend's CORS setting never needs editing.
// Set REDNAV_BACKEND_URL when the backend is not on localhost:8000.
async function forward({ request }: { request: Request }) {
  const base = process.env["REDNAV_BACKEND_URL"] ?? "http://127.0.0.1:8000";
  const url = new URL(request.url);
  const target = base.replace(/\/$/, "") + url.pathname + url.search;
  const headers = new Headers(request.headers);
  headers.delete("host");
  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? null : await request.arrayBuffer(),
    });
    const out = new Headers(res.headers);
    out.delete("content-encoding");
    out.delete("content-length");
    return new Response(res.body, { status: res.status, headers: out });
  } catch {
    // Backend not running: serve the saved copy of its answer (real NASA data captured from it) when we have one.
    const snap = request.method === "GET" ? snapshotPath(url.pathname, url.search) : null;
    if (snap) {
      try {
        const saved = await fetch(new URL(snap.path, url.origin));
        if (saved.ok) {
          return new Response(saved.body, {
            headers: { "content-type": snap.type, "x-rednav-source": "snapshot", "cache-control": "public, max-age=3600" },
          });
        }
      } catch {
        /* fall through */
      }
    }
    // Nothing saved for this request: answer quietly (no error status) and let the HUD retry on its own.
    return new Response(null, { status: 204, headers: { "x-rednav-backend": "offline" } });
  }
}

export const Route = createFileRoute("/api/$")({
  server: { handlers: { GET: forward, POST: forward } },
});
