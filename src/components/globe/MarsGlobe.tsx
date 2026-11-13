import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import marsTex from "@/assets/mars_viking_mdim21_4k.jpg";
import { SITES } from "@/data/sites";
import { WAYPOINTS } from "@/data/route";
import { latLonToVec3 } from "@/lib/mars";

type Props = { selected: string; onSelect: (id: string) => void; onReady: () => void };

function Planet({ onReady }: { onReady: () => void }) {
  const map = useTexture(marsTex);
  const { gl } = useThree();
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = gl.capabilities.getMaxAnisotropy();
  }, [map, gl]);
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return (
    <mesh>
      <sphereGeometry args={[1, 128, 96]} />
      <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
    </mesh>
  );
}

function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: { c: { value: new THREE.Color("#d98a5a") } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(c, clamp(i,0.0,1.0) * 0.9); }`,
      }),
    [],
  );
  return (
    <mesh material={mat} scale={1.06}>
      <sphereGeometry args={[1, 64, 48]} />
    </mesh>
  );
}

/** Projects each site to screen space every frame and moves its HTML button (cheaper and safer than one React root per marker). */
function MarkerProjector({
  refs,
}: {
  refs: React.RefObject<Record<string, HTMLButtonElement | null>>;
}) {
  const items = useMemo(
    () =>
      SITES.map((s) => {
        const pos = new THREE.Vector3(...latLonToVec3(s.lat, s.lon, 1.003));
        return { id: s.id, pos, normal: pos.clone().normalize() };
      }),
    [],
  );
  const v = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    camDir.copy(camera.position).normalize();
    for (const it of items) {
      const el = refs.current?.[it.id];
      if (!el) continue;
      const visible = it.normal.dot(camDir) > 0.12;
      v.copy(it.pos).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      const left = Math.max(4, Math.min(x - 5, size.width - el.offsetWidth - 4));
      el.style.transform = `translate(${left}px, ${y}px) translateY(-50%)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
    }
  });
  return null;
}

/** Keeps the sun roughly behind the viewer so the side you look at is always lit. */
function CameraLight() {
  const ref = useRef<THREE.DirectionalLight>(null);
  const offset = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    offset.set(1.5, 1.2, 0).applyQuaternion(camera.quaternion);
    ref.current.position.copy(camera.position).add(offset);
  });
  return <directionalLight ref={ref} intensity={2.6} />;
}

function Traverse() {
  const pts = useMemo(
    () => WAYPOINTS.map((w) => new THREE.Vector3(...latLonToVec3(w.lat, w.lon, 1.0015))),
    [],
  );
  return <Line points={pts} color="#7ff3ff" lineWidth={2.5} />;
}

function CameraRig({
  selected,
  controls,
}: {
  selected: string;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const target = useRef<THREE.Vector3 | null>(null);
  const { camera, size } = useThree();
  useEffect(() => {
    const s = SITES.find((x) => x.id === selected);
    if (!s) return;
    const aspect = size.width / size.height;
    const halfFov = Math.atan(Math.tan(20 * Math.PI / 180) * Math.min(aspect, 1));
    const dist = 1.18 / Math.sin(halfFov);
    target.current = new THREE.Vector3(...latLonToVec3(s.lat, s.lon, dist));
  }, [selected, size.width, size.height]);
  useFrame((_, dt) => {
    if (!target.current) return;
    const k = 1 - Math.exp(-3 * Math.min(dt, 0.05));
    const len = THREE.MathUtils.lerp(camera.position.length(), target.current.length(), k);
    const dir = camera.position
      .clone()
      .normalize()
      .lerp(target.current.clone().normalize(), k)
      .normalize();
    camera.position.copy(dir.multiplyScalar(len));
    camera.lookAt(0, 0, 0);
    controls.current?.update();
    if (camera.position.distanceTo(target.current) < 0.002) target.current = null;
  });
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => {
      target.current = null;
    };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, [controls]);
  return null;
}

export function MarsGlobe({ selected, onSelect, onReady }: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        camera={{ position: latLonToVec3(18, 60, 3), fov: 40, near: 0.005, far: 100 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#07080b"]} />
        <ambientLight intensity={0.35} />
        <CameraLight />
        <hemisphereLight args={["#ffe1c4", "#1a1410", 0.35]} />
        <Suspense fallback={null}>
          <Planet onReady={onReady} />
        </Suspense>
        <Atmosphere />
        <Traverse />
        <MarkerProjector refs={markerRefs} />
        <OrbitControls
          ref={controls}
          enablePan={false}
          minDistance={1.04}
          maxDistance={12}
          rotateSpeed={0.5}
          zoomSpeed={0.7}
        />
        <CameraRig selected={selected} controls={controls} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0">
        {SITES.map((site) => {
          const active = site.id === selected;
          return (
            <button
              key={site.id}
              ref={(el) => {
                markerRefs.current[site.id] = el;
              }}
              onClick={() => onSelect(site.id)}
              style={{ opacity: 0 }}
              className="group absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap transition-opacity duration-300"
            >
              <span
                className={`block h-2.5 w-2.5 shrink-0 rounded-full border ${active ? "border-hud-text bg-hud shadow-[0_0_10px_var(--hud)]" : site.kind === "landing" ? "border-hud-text bg-hud/60" : "border-warn bg-warn/50"}`}
              />
              <span
                className={`max-w-40 truncate rounded-sm bg-background/70 px-1.5 py-0.5 font-display text-[11px] font-semibold ${active ? "text-hud-text" : "text-muted-foreground group-hover:text-hud-text"}`}
              >
                {site.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
