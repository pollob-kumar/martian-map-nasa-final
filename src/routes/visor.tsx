import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Footprints,
  LogOut,
  LocateFixed,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Wifi,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { VISOR_PHOTOS } from "@/data/visorPhotos";
import { TOUR_STOPS, clampTourStop } from "@/data/guidedTour";
import { GuidedTour } from "@/components/hud/GuidedTour";
import { Button } from "@/components/ui/button";
import { visorReturnMarker } from "@/lib/visorReturn";
import { SiteNav } from "@/components/SiteNav";
import { ArcGauge } from "@/components/hud/ArcGauge";
import { CompassTape } from "@/components/hud/CompassTape";
import { DirectionPath } from "@/components/hud/DirectionPath";
import { Ecg } from "@/components/hud/Ecg";
import { Radar } from "@/components/hud/Radar";
import { SPEEDS, useRouteNav } from "@/lib/useRouteNav";
import { formatHours, perseveranceSol } from "@/lib/mars";
import { PoiCard } from "@/components/walk/PoiCard";
import { LANDING, POIS, REACHABLE, START_POSE, ZONE } from "@/data/walkSite";
import {
  WALK,
  ZOOMS,
  distanceM,
  fovForZoom,
  headingUp,
  markVisited,
  nextTarget,
  type Pose,
  type WalkInput,
} from "@/lib/walk";

// three.js only loads once walk mode is switched on (keeps it out of the server render).
const WalkView = lazy(() =>
  import("@/components/walk/WalkView").then((m) => ({ default: m.WalkView })),
);

export const Route = createFileRoute("/visor")({
  validateSearch: (s: Record<string, unknown>): { photo?: number | undefined; returnTo?: "marswalk" | undefined } => ({
    photo: s["photo"] === undefined || Number.isNaN(Number(s["photo"])) ? undefined : Number(s["photo"]),
    returnTo: visorReturnMarker(s["returnTo"]),
  }),
  head: () => ({
    meta: [
      { title: "Martian Map — Astronaut Visor HUD Navigation on Mars" },
      {
        name: "description",
        content:
          "Route guidance inside an astronaut visor HUD, replaying NASA Perseverance waypoints across Jezero Crater. NASA Space Apps.",
      },
      { property: "og:title", content: "Martian Map — Visor HUD Navigation" },
      {
        property: "og:description",
        content:
          "Astronaut visor HUD with NASA waypoint playback built on NASA Perseverance waypoint data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisorPage,
});

const VISOR_ASPECT = 1.76;
// Slow pan direction per photo so consecutive views don't drift the same way.
const DRIFT = ["50% 70%", "35% 65%", "65% 70%", "50% 60%", "40% 72%", "60% 66%"];

const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function HoldButton({
  label,
  onHold,
  children,
}: {
  label: string;
  onHold: (on: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="outline"
      aria-label={label}
      title={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
      className="touch-none rounded-sm border border-border p-1.5 text-hud-text hover:bg-hud-faint active:bg-hud-soft"
    >
      {children}
    </Button>
  );
}

function VisorPage() {
  const { frame, index, playing, setPlaying, speed, setSpeed, jump, total } = useRouteNav();
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [tourComplete, setTourComplete] = useState(false);
  const tourStop = tourIndex === null ? undefined : TOUR_STOPS[tourIndex];
  const tourPhotoIndex = tourStop ? VISOR_PHOTOS.findIndex((item) => item.pia === tourStop.pia) : -1;
  const active = tourPhotoIndex >= 0 ? tourPhotoIndex : index % VISOR_PHOTOS.length;
  const photo = VISOR_PHOTOS[active] ?? VISOR_PHOTOS[0];
  const p = frame?.p ?? 0;
  const { photo: photoParam, returnTo } = Route.useSearch();

  // ---- Walk mode ----
  const [walk, setWalk] = useState(false);
  const selectTourStop = (next: number) => {
    setTourIndex(clampTourStop(next));
    setTourComplete(false);
  };
  const startTour = () => {
    setWalk(false);
    setOpenPoi(null);
    setPlaying(false);
    selectTourStop(0);
    setTourPlaying(true);
  };
  useEffect(() => {
    if (tourIndex === null || !tourPlaying) return;
    const timer = setTimeout(() => {
      if (tourIndex === TOUR_STOPS.length - 1) {
        setTourPlaying(false);
        setTourComplete(true);
      } else setTourIndex(tourIndex + 1);
    }, 12000);
    return () => clearTimeout(timer);
  }, [tourIndex, tourPlaying]);
  useEffect(() => {
    if (photoParam === undefined) return;
    if (photoParam < VISOR_PHOTOS.length) { jump(photoParam); setPlaying(false); }
    else setWalk(true);
  }, [photoParam, jump, setPlaying]);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [pose, setPose] = useState<Pose>(START_POSE);
  const [walkSpeed, setWalkSpeed] = useState(0);
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [openPoi, setOpenPoi] = useState<string | null>(null);
  const [run, setRun] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [doneAt, setDoneAt] = useState<number | null>(null);
  const poseRef = useRef<Pose>({ ...START_POSE });
  const inputRef = useRef<WalkInput>({ forward: 0, strafe: 0, turn: 0, run: false });
  const resumeRoute = useRef(true);
  inputRef.current.run = run;

  const toggleWalk = () => {
    if (!walk) {
      resumeRoute.current = playing;
      setPlaying(false);
      setStartedAt((t) => t ?? Date.now());
    } else {
      setPlaying(resumeRoute.current);
      setOpenPoi(null);
      inputRef.current = { forward: 0, strafe: 0, turn: 0, run };
    }
    setWalk(!walk);
  };
  const zoom = useCallback(
    (dir: 1 | -1) => setZoomIdx((z) => Math.max(0, Math.min(ZOOMS.length - 1, z + dir))),
    [],
  );
  const onTelemetry = useCallback((next: Pose, spd: number) => {
    setPose(next);
    setWalkSpeed(spd);
    setVisited((v) => markVisited(v, next, POIS));
  }, []);
  const resetWalk = () => {
    poseRef.current = { ...START_POSE };
    setPose(START_POSE);
    setVisited(new Set());
    setStartedAt(Date.now());
    setDoneAt(null);
    setOpenPoi(null);
  };
  const hold = (key: "forward" | "turn", value: number) => (on: boolean) => {
    inputRef.current = { ...inputRef.current, [key]: on ? value : 0 };
  };
  useEffect(() => {
    if (visited.size === REACHABLE.length && doneAt === null) setDoneAt(Date.now());
  }, [visited, doneAt]);
  useEffect(() => {
    if (!openPoi) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpenPoi(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [openPoi]);

  const target = walk ? nextTarget(pose, REACHABLE, visited) : null;
  const fromCentre = distanceM(pose, ZONE);
  const nearEdge = walk && fromCentre > ZONE.r - 3;
  const cardPoi = openPoi ? POIS.find((x) => x.id === openPoi) : undefined;
  const heading = walk ? pose.heading : (frame?.heading ?? 0);
  const showHazard = !walk && tourIndex === null && p > 0.12 && p < 0.88;

  if (!photo) return null;

  return (
    <main className="visor-page flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(ellipse_at_center,var(--helmet)_0%,var(--background)_75%)]">
      <SiteNav />
      <h1 className="sr-only">Martian Map astronaut visor route guidance</h1>

      <section className="flex flex-1 flex-col items-center justify-center px-2 pb-2">
        <div
          className="relative aspect-[1.76] w-[min(97vw,calc((100vh-150px)*1.76))] min-w-[300px]"
          style={{ containerType: "size" }}
        >
          {/* Helmet rim */}
          <div className="pointer-events-none absolute -inset-[1.6%] rounded-[39%/52%] bg-[linear-gradient(160deg,var(--helmet-edge),var(--helmet)_40%,var(--background)_70%,var(--helmet-edge))] shadow-[0_30px_80px_-20px_oklch(0_0_0/0.9)]" />

          {/* Visor glass */}
          <div className="absolute inset-0 overflow-hidden rounded-[38%/50%] bg-mars">
            {walk && (
              <Suspense fallback={null}>
                <WalkView
                  poseRef={poseRef}
                  inputRef={inputRef}
                  fov={fovForZoom(ZOOMS[zoomIdx] ?? 1)}
                  visited={visited}
                  selected={openPoi}
                  onSelect={setOpenPoi}
                  onTelemetry={onTelemetry}
                  onZoom={zoom}
                />
              </Suspense>
            )}
            {!walk &&
              VISOR_PHOTOS.map((s, i) => (
                <div
                  key={s.url}
                  className="absolute left-1/2 top-1/2 transition-[opacity,transform] duration-[1400ms] ease-out"
                  style={{
                    aspectRatio: String(s.aspect),
                    width: `${Math.max(1, s.aspect / VISOR_ASPECT) * 100}%`,
                    opacity: i === active ? 1 : 0,
                    transform: `translate(-50%, -50%) scale(${i === active ? 1.04 + p * 0.14 : 1.12})`,
                    transformOrigin: DRIFT[i % DRIFT.length],
                  }}
                >
                  <img
                    src={s.url}
                    alt={s.alt}
                    className="h-full w-full object-cover"
                    loading={i < 2 ? "eager" : "lazy"}
                    draggable={false}
                  />
                  {i === active && showHazard && (
                    <div
                      className="absolute"
                      style={{
                        left: `${s.hazard.x - s.hazard.w / 2}%`,
                        top: `${s.hazard.y - s.hazard.h / 2}%`,
                        width: `${s.hazard.w}%`,
                        height: `${s.hazard.h}%`,
                      }}
                    >
                      <div className="absolute inset-0 rounded-[4px] border border-hud-text/60 bg-hud-faint shadow-[inset_0_0_20px_var(--hud-faint)]" />
                      {[
                        "left-0 top-0 border-l-2 border-t-2",
                        "right-0 top-0 border-r-2 border-t-2",
                        "left-0 bottom-0 border-l-2 border-b-2",
                        "right-0 bottom-0 border-r-2 border-b-2",
                      ].map((c) => (
                        <span key={c} className={`absolute h-[22%] w-[22%] border-warn ${c}`} />
                      ))}
                      <p
                        className="absolute left-1/2 top-[108%] -translate-x-1/2 whitespace-nowrap font-display text-[1.05cqw] font-semibold tracking-wider text-hud-text text-glow"
                        style={{ animation: "hazard-pulse 1.2s ease-in-out infinite" }}
                      >
                        ILLUSTRATIVE ROCK MARKER
                      </p>
                    </div>
                  )}
                </div>
              ))}

            {/* Visor tint, vignette and glass reflections */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--visor-tint),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_6cqw_2cqw_oklch(0_0_0/0.75)] rounded-[38%/50%]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_30%_8%,oklch(1_0_0/0.10),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 visor-scanlines" />
            <div className="pointer-events-none absolute inset-0 rounded-[38%/50%] shadow-[inset_0_0_0_1px_var(--hud-soft),inset_0_0_2.5cqw_var(--hud-faint)]" />
            <div className="pointer-events-none absolute -left-[10%] top-0 h-full w-[30%] -skew-x-12 bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.05),transparent)] visor-sheen" />

            {frame && (
              <>
                {!walk && tourIndex === null && <DirectionPath curve={frame.curve} phase={frame.phase} />}

                {/* Camera / image credit tag */}
                <p
                  key={walk ? "walk" : photo.url}
                  className="pointer-events-none absolute left-[21%] top-[29%] max-w-[22%] font-mono text-[0.78cqw] leading-tight text-hud-text/70 text-glow animate-in fade-in duration-700"
                >
                  {walk ? (
                    <>
                      ENV · PIA24663 VAN ZYL 360°
                      <br />
                      GROUND · HiRISE 25 cm + MASTCAM-Z GRAIN
                    </>
                  ) : (
                    <>
                      CAM · {photo.pia ?? "PERSEVERANCE RAW"}
                      <br />
                      {photo.credit.split(" (")[0]}
                    </>
                  )}
                </p>

                {/* Compass */}
                <div className="absolute left-1/2 top-[7.5%] h-[8%] w-[30%] -translate-x-1/2">
                  <CompassTape heading={heading} />
                </div>
                <p className="absolute left-1/2 top-[18.5%] -translate-x-1/2 font-display text-[1.7cqw] font-semibold tracking-wider text-hud-text text-glow">
                  SOL {walk ? perseveranceSol(Date.now()) : frame.seg.to.sol} |{" "}
                  {formatHours(frame.lmst)}
                </p>

                <p className="absolute left-[16.5%] top-[22%] font-display text-[1.2cqw] font-semibold tracking-wide text-hud-text text-glow">
                  SUIT PRES: 29.6 kPa | INT TEMP: 21°C
                </p>
                <p className="absolute right-[14%] top-[22%] flex items-center gap-[0.5cqw] font-display text-[1.2cqw] font-semibold tracking-wide text-hud-text text-glow">
                  <Wifi className="h-[1.5cqw] w-[1.5cqw] text-hud" />
                  {walk
                    ? `BASE: ${Math.round(distanceM(pose, LANDING))} m`
                    : `BASE: ${frame.baseKm.toFixed(1)} km`}{" "}
                  | COMS: {walk ? 98 : frame.coms}%
                </p>

                {/* Oxygen */}
                <div className="absolute left-[9.5%] top-[25%] h-[52%] w-[5.5%]">
                  <ArcGauge value={frame.oxygen} side="left" />
                </div>
                <div className="absolute left-[14.5%] top-[45%] font-display leading-none text-hud-text text-glow">
                  <p className="text-[1.45cqw] font-semibold tracking-wider">OXYGEN</p>
                  <p className="mt-[0.3cqw] text-[3.1cqw] font-bold">{frame.oxygen}%</p>
                </div>

                {/* Power */}
                <div className="absolute right-[9.5%] top-[25%] h-[52%] w-[5.5%]">
                  <ArcGauge value={frame.power} side="right" />
                </div>
                <div className="absolute right-[14.5%] top-[45%] text-right font-display leading-none text-hud-text text-glow">
                  <p className="text-[1.45cqw] font-semibold tracking-wider">POWER</p>
                  <p className="mt-[0.3cqw] text-[3.1cqw] font-bold">{frame.power}%</p>
                </div>

                {/* Heart rate */}
                <div className="absolute bottom-[19%] left-[22.5%] w-[9%] text-center">
                  <div className="h-[3.2cqw] w-full">
                    <Ecg bpm={frame.hrBpm} />
                  </div>
                  <p className="font-display text-[1.35cqw] font-semibold tracking-wide text-hud-text text-glow">
                    HR: {frame.hrBpm} BPM
                  </p>
                </div>

                {/* Radar */}
                <div className="absolute bottom-[13%] right-[20%] aspect-square w-[9%]">
                  {walk ? (
                    <Radar
                      path={[]}
                      rangeM={60}
                      dots={REACHABLE.map((s) => ({
                        id: s.id,
                        ...headingUp(pose, s),
                        active: s.id === target?.spot.id,
                        done: visited.has(s.id),
                      }))}
                    />
                  ) : (
                    <Radar path={frame.radar} rangeM={60} />
                  )}
                </div>

                {/* Next waypoint + label */}
                <div className="pointer-events-none absolute left-1/2 top-[25.5%] -translate-x-1/2 whitespace-nowrap text-center font-mono text-[0.95cqw] text-hud-text/80 text-glow">
                  {tourStop ? (
                    `GUIDED TOUR · STOP ${(tourIndex ?? 0) + 1}/${TOUR_STOPS.length}`
                  ) : walk ? (
                    target ? (
                      <>
                        TARGET {target.spot.short.toUpperCase()} · {Math.round(target.dist)} m ·{" "}
                        {Math.abs(target.turn) < 8
                          ? "AHEAD"
                          : `${target.turn > 0 ? "RIGHT" : "LEFT"} ${Math.abs(Math.round(target.turn))}°`}{" "}
                        · SPD {walkSpeed.toFixed(1)} m/s
                      </>
                    ) : (
                      "ALL SITES EXPLORED · TAP ANY MARKER FOR NASA DATA"
                    )
                  ) : (
                    <>
                      NEXT WP {frame.seg.to.rmc} · {Math.round(frame.toWpM)} m ·{" "}
                      {Math.abs(frame.nextTurn) < 8
                        ? "STRAIGHT"
                        : `${frame.nextTurn > 0 ? "RIGHT" : "LEFT"} ${Math.abs(Math.round(frame.nextTurn))}°`}
                    </>
                  )}
                </div>
                {nearEdge && (
                  <p
                    className="pointer-events-none absolute left-1/2 top-[64%] -translate-x-1/2 whitespace-nowrap font-display text-[1.2cqw] font-semibold tracking-wider text-warn text-glow"
                    style={{ animation: "hazard-pulse 1.2s ease-in-out infinite" }}
                  >
                    WARN: EXPLORATION BOUNDARY · {ZONE.r} m RADIUS
                  </p>
                )}
                {walk && doneAt !== null && !cardPoi && (
                  <p className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 whitespace-nowrap text-center font-display text-[2.2cqw] font-bold tracking-wider text-hud-text text-glow animate-in fade-in zoom-in-95">
                    EXPLORATION COMPLETE
                    <span className="block font-mono text-[1cqw] font-normal">
                      {REACHABLE.length}/{REACHABLE.length} NASA SITES ·{" "}
                      {fmtTime(doneAt - (startedAt ?? doneAt))}
                    </span>
                  </p>
                )}
                <p className="pointer-events-none absolute bottom-[7%] left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[2.4cqw] font-bold tracking-[0.06em] text-hud-text text-glow">
                  {walk
                    ? `WALK MODE · ${visited.size}/${REACHABLE.length} EXPLORED`
                    : tourStop ? tourStop.title.toUpperCase() : "DIRECTION PATH"}
                </p>
                {cardPoi && (
                  <PoiCard
                    poi={cardPoi}
                    pose={pose}
                    visited={visited.has(cardPoi.id)}
                    onClose={() => setOpenPoi(null)}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Mission controls (outside the visor) */}
        <div className="visor-controls mt-4 flex w-[min(97vw,calc((100vh-150px)*1.76))] flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-card/60 px-3 py-2 font-mono text-xs text-muted-foreground">
          <Button asChild variant="outline" size="sm">
            <Link to="/" search={{ marswalk: returnTo === "marswalk" }}><LogOut /> Exit</Link>
          </Button>
          {tourIndex === null && <Button variant="outline" size="sm" onClick={startTour}><Play /> Guided tour</Button>}
          {tourIndex === null && <>
          <Button
            variant="outline"
            role="switch"
            aria-checked={walk}
            onClick={toggleWalk}
            className={`flex items-center gap-2 rounded-sm border px-2.5 py-1.5 font-display text-sm font-semibold tracking-wider ${walk ? "border-hud bg-hud-soft text-hud-text" : "border-hud-soft text-hud-text hover:bg-hud-faint"}`}
          >
            <Footprints className="h-4 w-4" />
            WALK
            <span
              className={`relative inline-block h-4 w-7 rounded-full border border-hud-soft ${walk ? "bg-hud/60" : "bg-background"}`}
            >
              <span
                className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-hud-text transition-all ${walk ? "left-3.5" : "left-0.5"}`}
              />
            </span>
          </Button>
          {walk ? (
            <>
              <div className="flex items-center gap-1">
                <HoldButton label="Turn left (hold)" onHold={hold("turn", -1)}>
                  <RotateCcw className="h-4 w-4" />
                </HoldButton>
                <HoldButton label="Walk forward (hold)" onHold={hold("forward", 1)}>
                  <ArrowUp className="h-4 w-4" />
                </HoldButton>
                <HoldButton label="Walk back (hold)" onHold={hold("forward", -1)}>
                  <ArrowDown className="h-4 w-4" />
                </HoldButton>
                <HoldButton label="Turn right (hold)" onHold={hold("turn", 1)}>
                  <RotateCw className="h-4 w-4" />
                </HoldButton>
                <Button
                  onClick={() => setRun(!run)}
                  aria-pressed={run}
                  className={`rounded-sm border px-2 py-1 ${run ? "border-hud-soft bg-hud-faint text-hud-text" : "border-border hover:text-hud-text"}`}
                >
                  {run ? `RUN ${WALK.RUN_MS} m/s` : `WALK ${WALK.SPEED_MS} m/s`}
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  aria-label="Zoom out"
                  onClick={() => zoom(-1)}
                  disabled={zoomIdx === 0}
                  className="rounded-sm border border-border p-1.5 text-hud-text hover:bg-hud-faint disabled:opacity-40"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-9 text-center text-hud-text">{ZOOMS[zoomIdx]}×</span>
                <Button
                  variant="outline"
                  aria-label="Zoom in"
                  onClick={() => zoom(1)}
                  disabled={zoomIdx === ZOOMS.length - 1}
                  className="rounded-sm border border-border p-1.5 text-hud-text hover:bg-hud-faint disabled:opacity-40"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={resetWalk}
                className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 hover:text-hud-text"
              >
                <LocateFixed className="h-3.5 w-3.5" /> Restart
              </Button>
              <p className="w-full text-[11px] leading-relaxed sm:w-auto">
                <span className="text-hud-text">
                  EXPLORED {visited.size}/{REACHABLE.length}
                </span>{" "}
                · {pose.e.toFixed(1)} m E {pose.n.toFixed(1)} m N of Van Zyl · HDG{" "}
                {Math.round(pose.heading)}° 
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  aria-label="Previous waypoint"
                  onClick={() => jump(index - 1)}
                  className="rounded-sm border border-border p-1.5 text-hud-text hover:bg-hud-faint"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  aria-label={playing ? "Pause route" : "Play route"}
                  onClick={() => setPlaying(!playing)}
                  className="rounded-sm border border-hud-soft bg-hud-faint p-1.5 text-hud-text hover:bg-hud-soft"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  aria-label="Next waypoint"
                  onClick={() => jump(index + 1)}
                  className="rounded-sm border border-border p-1.5 text-hud-text hover:bg-hud-faint"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                {SPEEDS.map((s) => (
                  <Button
                    variant={s === speed ? "secondary" : "ghost"}
                    aria-pressed={s === speed}
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`rounded-sm border px-2 py-1 ${s === speed ? "border-hud-soft bg-hud-faint text-hud-text" : "border-border hover:text-hud-text"}`}
                  >
                    {s}×
                  </Button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={total - 1}
                value={index}
                onChange={(e) => jump(Number(e.target.value))}
                aria-label="Jump along the Perseverance route"
                className="min-w-[140px] flex-1 accent-[var(--hud)]"
              />
              {frame && (
                <p className="w-full text-[11px] leading-relaxed sm:w-auto">
                  <span className="text-hud-text">
                    SEG {index + 1}/{total}
                  </span>{" "}
                  · {frame.lat.toFixed(5)}°N {frame.lon.toFixed(5)}°E · ELEV {frame.elev.toFixed(1)}{" "}
                  m · HDG {Math.round(frame.heading)}° · TILT {frame.seg.to.tilt.toFixed(1)}° · ODO{" "}
                  {(frame.odoM / 1000).toFixed(2)} km
                </p>
              )}
            </>
          )}
          </>}
        </div>
        {tourIndex !== null && <GuidedTour index={tourIndex} playing={tourPlaying} complete={tourComplete} onStep={selectTourStop} onPlaying={setTourPlaying} onClose={() => { setTourIndex(null); setTourPlaying(false); }} />}
        {walk ? (
          <p className="mt-2 w-[min(97vw,calc((100vh-150px)*1.76))] text-[11px] text-muted-foreground">
            <span className="text-hud-text">
              Walk mode · Van Zyl Overlook ↔ Octavia E. Butler Landing, Jezero Crater:
            </span>{" "}
            horizon from NASA's PIA24663 360° panorama (992 Mastcam-Z images, credit
            NASA/JPL-Caltech/ASU/MSSS); ground from the NASA HiRISE 25 cm colour map
            (NASA/JPL-Caltech/UArizona), with fine sand-and-pebble grain near your feet from the same
            PIA24663 panorama's close-up ground. Walk within a {ZONE.r} m circle; sites appear within{" "}
            {WALK.DETECT_M} m and count as explored within {WALK.VISIT_M} m. Site positions and
            facts: NASA MMGIS rover and Ingenuity data. Glowing beacons are HUD markers, not real
            objects. Tap a marker for its NASA data card.{" "}
            <a href="/sources" className="text-hud underline-offset-2 hover:underline">
              All sources
            </a>
          </p>
        ) : (
          <p className="mt-2 w-[min(97vw,calc((100vh-150px)*1.76))] text-[11px] text-muted-foreground">
            <span className="text-hud-text">
              Visor view {active + 1}/{VISOR_PHOTOS.length}:
            </span>{" "}
            {photo.title}
            {photo.pia ? ` · ${photo.pia}` : ""} · {photo.date} · Credit: {photo.credit} ·{" "}
            <a
              href={photo.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-hud underline-offset-2 hover:underline"
            >
              NASA source
            </a>
            <br />
            Route, position, heading, elevation, tilt and sol: NASA/JPL-Caltech Perseverance
            waypoints. Clock: live Local Mean Solar Time (NASA GISS Mars24). Oxygen, power, heart
            rate, suit and comms values are simulated.
          </p>
        )}
      </section>
    </main>
  );
}
