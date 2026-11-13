export function advanceEvaWalk(distance: number, speed: number, seconds: number, routeTotal?: number): number {
  const next = distance + Math.max(0, speed) * Math.max(0, seconds);
  return routeTotal !== undefined && routeTotal > 0 ? Math.min(routeTotal, next) : next;
}