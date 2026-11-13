// Pure walk-mode rules (no React / three.js). Positions are metres east (e) / north (n) of the walk origin.
import { normalizeDeg, turnDeg } from "./mars";

export const WALK = {
  /** Brisk astronaut walk; kept quick so the short exploration finishes in a few minutes. */
  SPEED_MS: 2.2,
  RUN_MS: 4.5,
  TURN_DEG_S: 80,
  PITCH_MAX_DEG: 40,
  /** Explorable circle radius around the zone centre. */
  ZONE_RADIUS_M: 48,
  /** A site counts as explored once you stand this close to it. */
  VISIT_M: 4,
  /** Sites appear (beacon + label) once you are this close. */
  DETECT_M: 30,
  EYE_M: 1.7,
} as const;

export const BASE_FOV = 70;
export const ZOOMS = [1, 1.5, 2.5, 4] as const;

export type Pose = { e: number; n: number; heading: number; pitch: number };
export type WalkInput = { forward: number; strafe: number; turn: number; run: boolean };
export type Zone = { e: number; n: number; r: number };
export type Spot = { id: string; e: number; n: number; reachable: boolean };

const rad = (d: number) => (d * Math.PI) / 180;
const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

/** Vertical field of view (deg) for a zoom factor. */
export function fovForZoom(zoom: number): number {
  return (2 * Math.atan(Math.tan(rad(BASE_FOV / 2)) / zoom) * 180) / Math.PI;
}

export function clampToZone(e: number, n: number, zone: Zone): [number, number] {
  const de = e - zone.e;
  const dn = n - zone.n;
  const d = Math.hypot(de, dn);
  if (d <= zone.r) return [e, n];
  return [zone.e + (de / d) * zone.r, zone.n + (dn / d) * zone.r];
}

/** Advance the walker one step. Forward follows the heading (0 = north, 90 = east). */
export function stepPose(p: Pose, input: WalkInput, dt: number, zone: Zone): Pose {
  const heading = normalizeDeg(p.heading + clamp1(input.turn) * WALK.TURN_DEG_S * dt);
  const h = rad(heading);
  let f = clamp1(input.forward);
  let s = clamp1(input.strafe);
  const len = Math.hypot(f, s);
  if (len > 1) {
    f /= len;
    s /= len;
  }
  const v = (input.run ? WALK.RUN_MS : WALK.SPEED_MS) * dt;
  const e = p.e + (Math.sin(h) * f + Math.cos(h) * s) * v;
  const n = p.n + (Math.cos(h) * f - Math.sin(h) * s) * v;
  const [ce, cn] = clampToZone(e, n, zone);
  return { e: ce, n: cn, heading, pitch: p.pitch };
}

export function distanceM(p: { e: number; n: number }, q: { e: number; n: number }): number {
  return Math.hypot(q.e - p.e, q.n - p.n);
}

/** Compass bearing (deg) from p to q. */
export function bearingTo(p: { e: number; n: number }, q: { e: number; n: number }): number {
  return normalizeDeg((Math.atan2(q.e - p.e, q.n - p.n) * 180) / Math.PI);
}

/** Returns the same set when nothing new was reached (so React can skip a re-render). */
export function markVisited(visited: ReadonlySet<string>, pose: Pose, spots: Spot[]): ReadonlySet<string> {
  let next: Set<string> | null = null;
  for (const s of spots) {
    if (!s.reachable || visited.has(s.id)) continue;
    if (distanceM(pose, s) <= WALK.VISIT_M) {
      next ??= new Set(visited);
      next.add(s.id);
    }
  }
  return next ?? visited;
}

/** Closest reachable site not explored yet, with distance and the turn needed (+ = right). */
export function nextTarget<T extends Spot>(pose: Pose, spots: T[], visited: ReadonlySet<string>) {
  let best: { spot: T; dist: number; turn: number } | null = null;
  for (const s of spots) {
    if (!s.reachable || visited.has(s.id)) continue;
    const dist = distanceM(pose, s);
    if (!best || dist < best.dist) best = { spot: s, dist, turn: turnDeg(pose.heading, bearingTo(pose, s)) };
  }
  return best;
}

/** Offset of q in a heading-up frame (x right, y forward), metres — same frame as the HUD radar. */
export function headingUp(pose: Pose, q: { e: number; n: number }) {
  const de = q.e - pose.e;
  const dn = q.n - pose.n;
  const h = rad(pose.heading);
  return { x: de * Math.cos(h) - dn * Math.sin(h), y: de * Math.sin(h) + dn * Math.cos(h) };
}
