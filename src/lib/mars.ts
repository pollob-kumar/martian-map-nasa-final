// Pure Mars math helpers (no React / three.js). Values follow NASA GISS Mars24 and IAU Mars radius.

/** Mean volumetric radius of Mars in km (NASA Mars Fact Sheet). */
export const MARS_RADIUS_KM = 3389.5;

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function normalizeDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

/** Great-circle distance on Mars between two planetocentric lat/lon points (degrees, east-positive), in km. */
export function marsDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * MARS_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Initial bearing from point 1 to point 2, degrees clockwise from north (0..360). */
export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dl = toRad(lon2 - lon1);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return normalizeDeg(toDeg(Math.atan2(y, x)));
}

/** East/north offset in metres of (lat, lon) from (lat0, lon0); local equirectangular, cm-accurate over a few km. */
export function localEnuM(lat: number, lon: number, lat0: number, lon0: number): [number, number] {
  const k = (Math.PI / 180) * MARS_RADIUS_KM * 1000;
  return [(lon - lon0) * k * Math.cos(toRad(lat0)), (lat - lat0) * k];
}

/** Signed smallest turn from heading a to heading b, in degrees (-180..180, + = right). */
export function turnDeg(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** The two 45° compass points that bracket a heading, e.g. 45 -> ["NE","NE"], 30 -> ["N","NE"]. */
export function bracketCardinals(heading: number): [string, string] {
  const h = normalizeDeg(heading);
  const lo = Math.floor(h / 45) % 8;
  const hi = Math.ceil(h / 45) % 8;
  return [CARDINALS[lo]!, CARDINALS[hi]!];
}

export function cardinalLabel(deg: number): string | null {
  const d = normalizeDeg(Math.round(deg));
  return d % 45 === 0 ? (CARDINALS[d / 45] ?? null) : null;
}

// ---- Mars24 time (Allison & McEwen 2000, NASA GISS) ----

/** Mars Sol Date for a given UTC epoch in ms. */
export function marsSolDate(utcMs: number): number {
  const jdUT = 2440587.5 + utcMs / 8.64e7;
  const jdTT = jdUT + (37 + 32.184) / 86400; // TAI-UTC = 37 s since 2017
  const dtJ2000 = jdTT - 2451545.0;
  return (dtJ2000 - 4.5) / 1.0274912517 + 44796.0 - 0.0009626;
}

/** Local Mean Solar Time (hours, 0..24) at an east longitude. */
export function localMeanSolarTime(utcMs: number, lonEast: number): number {
  const mtc = (((24 * marsSolDate(utcMs)) % 24) + 24) % 24;
  return (((mtc + lonEast / 15) % 24) + 24) % 24;
}

/** Perseverance landing (Octavia E. Butler Landing, Jezero) — 2021-02-18 20:55 UTC = start of Sol 0. */
export const PERSEVERANCE_LANDING_UTC = Date.UTC(2021, 1, 18, 20, 55, 0);
export const JEZERO_LON_E = 77.4509;

/** Perseverance mission sol for a UTC time (sol 0 = landing sol, local midnight boundaries at Jezero). */
export function perseveranceSol(utcMs: number): number {
  const local = (t: number) => marsSolDate(t) + JEZERO_LON_E / 360;
  return Math.floor(local(utcMs)) - Math.floor(local(PERSEVERANCE_LANDING_UTC));
}

export function formatHours(h: number): string {
  const total = Math.floor(h * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** lat/lon (deg, east-positive) to a point on a three.js SphereGeometry of the given radius. */
export function latLonToVec3(lat: number, lon: number, r = 1): [number, number, number] {
  const la = toRad(lat);
  const lo = toRad(lon);
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)];
}
