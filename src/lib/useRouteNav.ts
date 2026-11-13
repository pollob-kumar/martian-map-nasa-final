import { useCallback, useEffect, useRef, useState } from "react";
import { BASE, SEGMENTS } from "@/data/route";
import { localMeanSolarTime, marsDistanceKm, turnDeg, MARS_RADIUS_KM } from "@/lib/mars";

export const SPEEDS = [1, 4, 16] as const;
const RADAR_POINTS = 8;

function segDuration(lengthM: number) {
  return Math.max(4, Math.min(10, lengthM / 6));
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type NavFrame = ReturnType<typeof computeFrame>;

function computeFrame(index: number, p: number, now: number, phase: number) {
  const seg = SEGMENTS[index]!;
  const prev = SEGMENTS[Math.max(0, index - 1)]!;
  const next = SEGMENTS[Math.min(SEGMENTS.length - 1, index + 1)]!;
  const lat = seg.from.lat + (seg.to.lat - seg.from.lat) * p;
  const lon = seg.from.lon + (seg.to.lon - seg.from.lon) * p;
  const elev = seg.from.elev + (seg.to.elev - seg.from.elev) * p;
  const odoM = seg.from.distTotal + (seg.to.distTotal - seg.from.distTotal) * p;
  const blend = smooth(0, 0.25, p);
  const heading = prev.heading + turnDeg(prev.heading, seg.heading) * blend;
  const nextTurn = index < SEGMENTS.length - 1 ? turnDeg(seg.heading, next.heading) : 0;
  const curve = nextTurn * 3.2 * smooth(0.35, 1, p);
  const baseKm = marsDistanceKm(lat, lon, BASE.lat, BASE.lon);
  const toWpM = (1 - p) * seg.lengthM;

  // Upcoming route in metres, heading-up frame for the radar.
  const kmPerDegLat = (Math.PI / 180) * MARS_RADIUS_KM;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const hr = (heading * Math.PI) / 180;
  const radar = SEGMENTS.slice(index, index + RADAR_POINTS).map((s) => {
    const east = (s.to.lon - lon) * kmPerDegLat * cosLat * 1000;
    const north = (s.to.lat - lat) * kmPerDegLat * 1000;
    return { x: east * Math.cos(hr) - north * Math.sin(hr), y: east * Math.sin(hr) + north * Math.cos(hr) };
  });

  // Simulated suit telemetry (not NASA data) — drains with distance along the real traverse.
  const progress = odoM / SEGMENTS[SEGMENTS.length - 1]!.to.distTotal;
  const oxygen = Math.round(96 - progress * 58 - p * 0.4);
  const power = Math.round(98 - progress * 46);
  const hrBpm = Math.round(78 + Math.sin(now / 4000) * 3 + Math.min(12, seg.to.tilt * 1.2));
  const coms = Math.max(8, Math.round(99 - baseKm * 1.4));

  return {
    seg,
    next,
    lat,
    lon,
    elev,
    odoM,
    heading,
    nextTurn,
    curve,
    baseKm,
    toWpM,
    radar,
    oxygen,
    power,
    hrBpm,
    coms,
    lmst: localMeanSolarTime(now, lon),
    phase,
    p,
  };
}

export function useRouteNav() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [frame, setFrame] = useState<NavFrame | null>(null);
  const prog = useRef(0);
  const phase = useRef(0);
  const idxRef = useRef(0);
  const playRef = useRef(true);
  const speedRef = useRef(1);
  idxRef.current = index;
  playRef.current = playing;
  speedRef.current = speed;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      phase.current = (phase.current + dt * 0.45) % 1;
      if (playRef.current) {
        const seg = SEGMENTS[idxRef.current]!;
        prog.current += (dt * speedRef.current) / segDuration(seg.lengthM);
        if (prog.current >= 1) {
          prog.current = 0;
          const n = (idxRef.current + 1) % SEGMENTS.length;
          idxRef.current = n;
          setIndex(n);
        }
      }
      acc += dt;
      if (acc > 1 / 30) {
        acc = 0;
        setFrame(computeFrame(idxRef.current, prog.current, Date.now(), phase.current));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const jump = useCallback((i: number) => {
    const n = (i + SEGMENTS.length) % SEGMENTS.length;
    prog.current = 0;
    idxRef.current = n;
    setIndex(n);
  }, []);

  return { frame, index, playing, setPlaying, speed, setSpeed, jump, total: SEGMENTS.length };
}
