// Perseverance (Mars 2020) rover waypoints from NASA/JPL-Caltech MMGIS:
// https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json
// Row format: [sol, lat, lonEast, elevGeoid_m, yaw_deg, tilt_deg, distTotal_m, siteDrive]
import raw from "./m20_route.json";
import { bearingDeg, marsDistanceKm } from "@/lib/mars";

export type Waypoint = {
  sol: number;
  lat: number;
  lon: number;
  elev: number;
  yaw: number;
  tilt: number;
  distTotal: number;
  rmc: string;
};

export type Segment = {
  from: Waypoint;
  to: Waypoint;
  lengthM: number;
  heading: number;
};

export const WAYPOINTS: Waypoint[] = (raw as [number, number, number, number, number, number, number, string][]).map(
  ([sol, lat, lon, elev, yaw, tilt, distTotal, rmc]) => ({ sol, lat, lon, elev, yaw, tilt, distTotal, rmc }),
);

/** Landing site = first localized waypoint (Octavia E. Butler Landing). */
export const BASE = WAYPOINTS[0]!;
export const LAST_WAYPOINT = WAYPOINTS[WAYPOINTS.length - 1]!;

/** Drive segments, skipping stationary waypoints (< 1 m apart). */
export function buildSegments(points: Waypoint[]): Segment[] {
  const segs: Segment[] = [];
  let prev = points[0]!;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    const lengthM = marsDistanceKm(prev.lat, prev.lon, p.lat, p.lon) * 1000;
    if (lengthM < 1) continue;
    segs.push({ from: prev, to: p, lengthM, heading: bearingDeg(prev.lat, prev.lon, p.lat, p.lon) });
    prev = p;
  }
  return segs;
}

export const SEGMENTS = buildSegments(WAYPOINTS);
