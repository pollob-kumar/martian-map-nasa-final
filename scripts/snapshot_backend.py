"""Save the Python backend's GET answers as static files under public/backend-snapshot/.

The published app cannot run the Python backend, so src/routes/api/$.ts serves these files
when the backend is offline. Re-run after changing backend data:
    python3 scripts/snapshot_backend.py   (backend must be running on :8000)
Only read-only GET answers are saved; route planning, probes and chat stay live-only."""
import io, json, pathlib, shutil, urllib.request
from PIL import Image

BASE = "http://127.0.0.1:8000"
OUT = pathlib.Path(__file__).resolve().parents[1] / "public" / "backend-snapshot"
PREVIEW_SIZES = [1400]


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=60) as r:
        return r.read()


def save(path, data):
    p = OUT / path.lstrip("/")
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.suffix == ".png":  # stored as WebP to keep the app small; the bridge maps .png -> .webp
        Image.open(io.BytesIO(data)).save(p.with_suffix(".webp"), "WEBP", quality=78, method=6)
    else:
        p.write_bytes(data)


def save_json(path):
    data = get(path)
    save(path + ".json", data)
    return json.loads(data)


shutil.rmtree(OUT, ignore_errors=True)
save_json("/api/health")
save_json("/api/space-weather")
for r in save_json("/api/regions"):
    rid = r["id"]
    meta = save_json(f"/api/regions/{rid}")
    for kind in ("sites", "hazards", "geology"):
        try:
            items = save_json(f"/api/regions/{rid}/{kind}")
        except Exception:
            continue
        if kind == "sites":
            for s in items:
                for img in s.get("pov_images", []):
                    u = img.get("url", "")
                    if u.startswith("/api/"):
                        save(u, get(u))
    for url in meta.get("layer_urls", {}).values():
        save(url, get(url))
layers = save_json("/api/layers")
mz = layers["frame"]["max_zoom"]
for l in layers["layers"]:
    if l["origin"] == "missing":
        continue
    k = l["key"]
    for size in PREVIEW_SIZES:
        save(f"/api/layers/{k}/preview-{size}.png", get(f"/api/layers/{k}/preview.png?size={size}"))
    for z in range(mz + 1):
        for x in range(2 ** z):
            for y in range(2 ** z):
                save(f"/api/layers/{k}/tile/{z}/{x}/{y}.png", get(f"/api/layers/{k}/tile/{z}/{x}/{y}.png"))
print("snapshot written to", OUT)
