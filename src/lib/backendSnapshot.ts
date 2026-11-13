// Maps a backend GET request to its saved copy in public/backend-snapshot/ (written by
// scripts/snapshot_backend.py). Returns null for requests that only the live backend can answer.
export function snapshotPath(pathname: string, search: string): { path: string; type: string } | null {
  if (!pathname.startsWith("/api/")) return null;
  const base = "/backend-snapshot" + pathname;
  const preview = pathname.match(/^\/api\/layers\/[a-z_]+\/preview\.png$/);
  if (preview) {
    const size = new URLSearchParams(search).get("size") ?? "900";
    if (size !== "1400") return null;
    return { path: base.replace(/preview\.png$/, `preview-${size}.webp`), type: "image/webp" };
  }
  if (pathname.endsWith(".png")) return { path: base.replace(/\.png$/, ".webp"), type: "image/webp" };
  if (/^\/api\/(terrain|navigation|chat|route)/.test(pathname)) return null;
  if (/\.[a-z0-9]+$/i.test(pathname)) return null; // other media files are not saved
  return { path: base + ".json", type: "application/json" };
}
