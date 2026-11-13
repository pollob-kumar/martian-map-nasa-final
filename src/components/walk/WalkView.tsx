import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GROUND, GROUND_DETAIL, PANO, POIS, ZONE } from "@/data/walkSite";
import { WALK, distanceM, stepPose, type Pose, type WalkInput } from "@/lib/walk";

export type WalkViewProps = {
  poseRef: React.MutableRefObject<Pose>;
  inputRef: React.MutableRefObject<WalkInput>;
  fov: number;
  visited: ReadonlySet<string>;
  selected: string | null;
  onSelect: (id: string) => void;
  onTelemetry: (p: Pose, speed: number) => void;
  onZoom: (dir: 1 | -1) => void;
};

const BEACON = "#7ff3ff";
const DONE = "#9dffb0";
const RING_R = 600;
const rad = THREE.MathUtils.degToRad;
const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

/** One quarter of the 360° panorama as a cylinder strip; bearing and elevation follow PIA24663's pixel grid. */
function ringSegment(i: number) {
  const cols = 48;
  const rows = 8;
  const degPerPx = 360 / PANO.srcWidth;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let r = 0; r <= rows; r++) {
    const row = (r / rows) * PANO.bandRows;
    const y = RING_R * Math.tan(rad((PANO.horizonRow - row) * degPerPx));
    for (let c = 0; c <= cols; c++) {
      const f = (i + c / cols) / 4;
      const b = (f - PANO.northFrac) * Math.PI * 2;
      pos.push(RING_R * Math.sin(b), y, -RING_R * Math.cos(b));
      uv.push(c / cols, 1 - r / rows);
    }
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      idx.push(a, a + cols + 1, a + 1, a + 1, a + cols + 1, a + cols + 2);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function Panorama({ ringRef }: { ringRef: React.MutableRefObject<THREE.Group | null> }) {
  const maps = useTexture(PANO.tiles);
  useMemo(() => {
    for (const m of maps) {
      m.colorSpace = THREE.SRGBColorSpace;
      m.anisotropy = 4;
    }
  }, [maps]);
  const geos = useMemo(() => PANO.tiles.map((_, i) => ringSegment(i)), []);
  return (
    <group ref={ringRef}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} renderOrder={-1}>
          <meshBasicMaterial map={maps[i] ?? null} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** HiRISE ground, fading out with distance from the walker so the panorama's far ground takes over.
 *  Near the walker, fine grain from a real Mastcam-Z ground patch (GROUND_DETAIL) is multiplied in. */
function Ground({ matRef }: { matRef: React.MutableRefObject<THREE.ShaderMaterial | null> }) {
  const [tex, det] = useTexture([GROUND.url, GROUND_DETAIL.url]) as [THREE.Texture, THREE.Texture];
  const { gl } = useThree();
  const mat = useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = aniso;
    det.colorSpace = THREE.NoColorSpace;
    det.wrapS = det.wrapT = THREE.RepeatWrapping;
    det.anisotropy = aniso;
    det.needsUpdate = true;
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        map: { value: tex },
        det: { value: det },
        tile: { value: GROUND_DETAIL.tileM },
        cam: { value: new THREE.Vector2() },
        r0: { value: 24 },
        r1: { value: 40 },
      },
      vertexShader:
        "varying vec2 vUv; varying vec2 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: `uniform sampler2D map; uniform sampler2D det; uniform float tile; uniform vec2 cam; uniform float r0; uniform float r1;
varying vec2 vUv; varying vec2 vW;
void main(){
  vec3 c = texture2D(map, vUv).rgb;
  float dist = distance(vW, cam);
  // two rotated scales of the same real patch so the repeat is hard to spot
  vec2 p = vW / tile;
  vec2 q = mat2(0.8, -0.6, 0.6, 0.8) * vW / (tile * 1.37) + vec2(0.31, 0.57);
  vec3 d = (texture2D(det, p).rgb + texture2D(det, q).rgb) - 1.0;
  float k = 1.0 - smoothstep(8.0, 20.0, dist);
  c *= 1.0 + d * 1.35 * k;
  float a = 1.0 - smoothstep(r0, r1, dist);
  gl_FragColor = vec4(c, a);
}`,
    });
  }, [tex, det, gl]);
  matRef.current = mat;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[GROUND.sizeM, GROUND.sizeM]} />
    </mesh>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

type Refs = {
  markers: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  dists: React.MutableRefObject<Record<string, HTMLSpanElement | null>>;
  beacons: React.MutableRefObject<Record<string, THREE.Group | null>>;
};

/** The single per-frame stepper: input → pose → camera → panorama/ground → beacons/labels → HUD telemetry. */
function Rig({
  poseRef,
  inputRef,
  keys,
  fov,
  visitedRef,
  refs,
  onTelemetry,
}: {
  poseRef: WalkViewProps["poseRef"];
  inputRef: WalkViewProps["inputRef"];
  keys: React.MutableRefObject<Set<string>>;
  fov: number;
  visitedRef: React.MutableRefObject<ReadonlySet<string>>;
  refs: Refs & { ring: React.MutableRefObject<THREE.Group | null>; ground: React.MutableRefObject<THREE.ShaderMaterial | null> };
  onTelemetry: WalkViewProps["onTelemetry"];
}) {
  const { camera } = useThree();
  const state = useRef({ bob: 0, acc: 0, speed: 0 });
  const v = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }, [fov, camera]);

  useFrame(({ size }, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const b = inputRef.current;
    const has = (...c: string[]) => (c.some((x) => k.has(x)) ? 1 : 0);
    const input: WalkInput = {
      forward: clamp1(has("KeyW", "ArrowUp") - has("KeyS", "ArrowDown") + b.forward),
      strafe: clamp1(has("KeyD") - has("KeyA") + b.strafe),
      turn: clamp1(has("ArrowRight", "KeyE") - has("ArrowLeft", "KeyQ") + b.turn),
      run: !!has("ShiftLeft", "ShiftRight") || b.run,
    };
    const prev = poseRef.current;
    const next = stepPose(prev, input, dt, ZONE);
    poseRef.current = next;
    const s = state.current;
    const speed = dt > 0 ? distanceM(prev, next) / dt : 0;
    s.speed += (speed - s.speed) * Math.min(1, dt * 8);
    s.bob += speed * dt * 2.6;

    camera.position.set(next.e, WALK.EYE_M + Math.sin(s.bob) * 0.03 * Math.min(1, speed / 2), -next.n);
    camera.rotation.set(rad(next.pitch), -rad(next.heading), 0, "YXZ");
    camera.updateMatrixWorld();
    refs.ring.current?.position.copy(camera.position);
    refs.ground.current?.uniforms["cam"]!.value.set(next.e, -next.n);

    camera.getWorldDirection(fwd);
    s.acc += dt;
    const writeDist = s.acc > 0.12;
    const visited = visitedRef.current;
    for (const p of POIS) {
      const d = distanceM(next, p);
      const shown = !p.reachable || d <= WALK.DETECT_M || visited.has(p.id);
      const beacon = refs.beacons.current[p.id];
      if (beacon) beacon.visible = shown && d > WALK.VISIT_M + 2; // hide the ring while you stand inside it
      const el = refs.markers.current[p.id];
      if (!el) continue;
      if (p.reachable) v.set(p.e, 2.7, -p.n);
      else v.set(camera.position.x + p.e, camera.position.y + Math.hypot(p.e, p.n) * 0.012, camera.position.z - p.n);
      const inFront = v.clone().sub(camera.position).dot(fwd) > 0;
      v.project(camera);
      const on = shown && inFront && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -100%)`;
      el.style.opacity = on ? "1" : "0";
      el.style.pointerEvents = on ? "auto" : "none";
      if (writeDist) {
        const span = refs.dists.current[p.id];
        if (span) span.textContent = p.reachable ? `${Math.round(d)} m` : "";
      }
    }
    if (writeDist) {
      s.acc = 0;
      onTelemetry(next, s.speed);
    }
  });
  return null;
}

function Beacons({ beacons, visited }: { beacons: Refs["beacons"]; visited: ReadonlySet<string> }) {
  return (
    <>
      {POIS.filter((p) => p.reachable).map((p) => {
        const c = visited.has(p.id) ? DONE : BEACON;
        return (
          <group
            key={p.id}
            position={[p.e, 0, -p.n]}
            visible={false}
            ref={(g) => {
              beacons.current[p.id] = g;
            }}
          >
            <mesh position={[0, 1.2, 0]} renderOrder={2}>
              <cylinderGeometry args={[0.035, 0.035, 2.4, 8, 1, true]} />
              <meshBasicMaterial color={c} transparent opacity={0.75} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
              <ringGeometry args={[WALK.VISIT_M - 0.25, WALK.VISIT_M, 64]} />
              <meshBasicMaterial color={c} transparent opacity={0.55} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

export function WalkView({ poseRef, inputRef, fov, visited, selected, onSelect, onTelemetry, onZoom }: WalkViewProps) {
  const [ready, setReady] = useState(false);
  const keys = useRef(new Set<string>());
  const visitedRef = useRef(visited);
  visitedRef.current = visited;
  const markers = useRef<Record<string, HTMLButtonElement | null>>({});
  const dists = useRef<Record<string, HTMLSpanElement | null>>({});
  const beacons = useRef<Record<string, THREE.Group | null>>({});
  const ring = useRef<THREE.Group | null>(null);
  const ground = useRef<THREE.ShaderMaterial | null>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const zoomRef = useRef(onZoom);
  zoomRef.current = onZoom;

  useEffect(() => {
    const handled = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      if (handled.has(e.code)) {
        keys.current.add(e.code);
        e.preventDefault();
      } else if (e.code === "Equal" || e.code === "NumpadAdd") zoomRef.current(1);
      else if (e.code === "Minus" || e.code === "NumpadSubtract") zoomRef.current(-1);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const lookScale = fov / 70;
  return (
    <div
      className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
      data-scene-ready={ready ? "true" : undefined}
      onPointerDown={(e) => {
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const p = poseRef.current;
        const heading = (((p.heading - (e.clientX - d.x) * 0.22 * lookScale) % 360) + 360) % 360;
        const pitch = Math.max(-WALK.PITCH_MAX_DEG, Math.min(WALK.PITCH_MAX_DEG, p.pitch + (e.clientY - d.y) * 0.18 * lookScale));
        poseRef.current = { ...p, heading, pitch };
        d.x = e.clientX;
        d.y = e.clientY;
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <Canvas flat dpr={[1, 1.5]} camera={{ fov, near: 0.1, far: 3000 }}>
        <color attach="background" args={[PANO.sky]} />
        <Suspense fallback={null}>
          <Panorama ringRef={ring} />
          <Ground matRef={ground} />
          <Ready onReady={() => setReady(true)} />
        </Suspense>
        <Beacons beacons={beacons} visited={visited} />
        <Rig
          poseRef={poseRef}
          inputRef={inputRef}
          keys={keys}
          fov={fov}
          visitedRef={visitedRef}
          refs={{ markers, dists, beacons, ring, ground }}
          onTelemetry={onTelemetry}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0">
        {POIS.map((p) => {
          const done = visited.has(p.id);
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              ref={(el) => {
                markers.current[p.id] = el;
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(p.id)}
              aria-label={`Show NASA data for ${p.name}`}
              style={{ opacity: 0 }}
              className="group absolute left-0 top-0 flex flex-col items-center gap-[0.3cqw] whitespace-nowrap transition-opacity duration-300"
            >
              <span
                className={`rounded-sm border px-[0.6cqw] py-[0.2cqw] font-display text-[clamp(9px,1cqw,14px)] font-semibold tracking-wide backdrop-blur-[2px] ${active ? "border-hud-text bg-hud-soft text-hud-text" : done ? "border-hud-soft bg-background/60 text-hud-text" : "border-hud-soft bg-background/50 text-hud-text group-hover:bg-hud-faint"}`}
              >
                {done ? "✓ " : ""}
                {p.short}{" "}
                <span
                  className="font-mono text-hud"
                  ref={(el) => {
                    dists.current[p.id] = el;
                  }}
                />
              </span>
              <span className={`block h-[0.8cqw] w-[0.8cqw] rotate-45 border ${p.reachable ? "border-hud-text bg-hud/60" : "border-warn bg-warn/50"}`} />
            </button>
          );
        })}
      </div>
      {!ready && (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-[clamp(10px,1.1cqw,14px)] text-hud-text text-glow">
          LOADING NASA PANORAMA + HiRISE GROUND…
        </p>
      )}
    </div>
  );
}
