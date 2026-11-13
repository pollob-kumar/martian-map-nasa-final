import { astar, Graph } from "javascript-astar";

export type GroundPoint = { x: number; z: number };
export type CrewObstacle = GroundPoint & { radius: number };
export const CREW_CLEARANCE = 0.65;

export function isCrewPositionClear(point: GroundPoint, obstacles: readonly CrewObstacle[]): boolean {
  return obstacles.every((obstacle) => Math.hypot(point.x - obstacle.x, point.z - obstacle.z) >= obstacle.radius + CREW_CLEARANCE);
}

export function isCrewSegmentClear(from: GroundPoint, to: GroundPoint, obstacles: readonly CrewObstacle[]): boolean {
  const dx = to.x - from.x, dz = to.z - from.z;
  const length2 = dx * dx + dz * dz;
  return obstacles.every((obstacle) => {
    const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((obstacle.x - from.x) * dx + (obstacle.z - from.z) * dz) / length2));
    return Math.hypot(from.x + t * dx - obstacle.x, from.z + t * dz - obstacle.z) >= obstacle.radius + CREW_CLEARANCE;
  });
}

/** Local A* detour; cardinal cells prevent diagonal corner cutting. */
export function planCrewPath(from: GroundPoint, to: GroundPoint, obstacles: readonly CrewObstacle[]): GroundPoint[] {
  if (!isCrewPositionClear(from, obstacles)) return [];
  if (isCrewSegmentClear(from, to, obstacles)) return [to];
  const minX = Math.floor(Math.min(from.x, to.x) - 12);
  const minZ = Math.floor(Math.min(from.z, to.z) - 12);
  const width = Math.min(100, Math.ceil(Math.abs(to.x - from.x)) + 25);
  const height = Math.min(100, Math.ceil(Math.abs(to.z - from.z)) + 25);
  const local = obstacles.filter((o) => o.x + o.radius + 2 >= minX && o.x - o.radius - 2 <= minX + width && o.z + o.radius + 2 >= minZ && o.z - o.radius - 2 <= minZ + height);
  const graph = new Graph(Array.from({ length: width }, (_, x) => Array.from({ length: height }, (_, z) => isCrewPositionClear({ x: minX + x, z: minZ + z }, local.map((o) => ({ ...o, radius: o.radius + 0.75 }))) ? 1 : 0)));
  const candidates = graph.grid.flat().filter((node) => node.weight > 0);
  const nearest = (point: GroundPoint) => candidates.reduce<typeof candidates[number] | undefined>((best, node) => !best || Math.hypot(node.x + minX - point.x, node.y + minZ - point.z) < Math.hypot(best.x + minX - point.x, best.y + minZ - point.z) ? node : best, undefined);
  const start = nearest(from), end = nearest(to);
  if (!start || !end) return [];
  const points = [{ x: start.x + minX, z: start.y + minZ }, ...astar.search(graph, start, end).map((node) => ({ x: node.x + minX, z: node.y + minZ }))];
  const path: GroundPoint[] = [];
  let previous = from;
  for (const point of points) {
    if (!isCrewSegmentClear(previous, point, obstacles)) return [];
    if (Math.hypot(point.x - previous.x, point.z - previous.z) > 0.01) path.push(point);
    previous = point;
  }
  if (isCrewSegmentClear(previous, to, obstacles)) path.push(to);
  return path;
}

export function advanceCrewPosition(from: GroundPoint, target: GroundPoint, distance: number, obstacles: readonly CrewObstacle[]): GroundPoint {
  const length = Math.hypot(target.x - from.x, target.z - from.z);
  const amount = length === 0 ? 0 : Math.min(1, Math.max(0, distance) / length);
  const next = { x: from.x + (target.x - from.x) * amount, z: from.z + (target.z - from.z) * amount };
  return isCrewSegmentClear(from, next, obstacles) ? next : from;
}