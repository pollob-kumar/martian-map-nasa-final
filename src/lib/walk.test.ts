import { describe, expect, it } from "vitest";
import { WALK, distanceM, fovForZoom, markVisited, nextTarget, stepPose, type Pose } from "./walk";
import { POIS, REACHABLE, START_POSE, ZONE } from "@/data/walkSite";

const still = { forward: 0, strafe: 0, turn: 0, run: false };
const at = (e: number, n: number, heading = 0): Pose => ({ e, n, heading, pitch: 0 });
const bigZone = { e: 0, n: 0, r: 1e6 };

describe("walk mode", () => {
  it("walking forward at heading 0 moves north at walk speed", () => {
    const p = stepPose(at(0, 0, 0), { ...still, forward: 1 }, 1, bigZone);
    expect(p.n).toBeCloseTo(WALK.SPEED_MS, 5);
    expect(p.e).toBeCloseTo(0, 5);
  });
  it("walking forward at heading 90 moves east; strafing right at heading 0 moves east", () => {
    expect(stepPose(at(0, 0, 90), { ...still, forward: 1 }, 1, bigZone).e).toBeCloseTo(WALK.SPEED_MS, 5);
    expect(stepPose(at(0, 0, 0), { ...still, strafe: 1 }, 1, bigZone).e).toBeCloseTo(WALK.SPEED_MS, 5);
  });
  it("you can never leave the 48 m exploration circle", () => {
    let p = { ...START_POSE };
    for (let i = 0; i < 400; i++) p = stepPose(p, { ...still, forward: 1, run: true }, 0.05, ZONE);
    expect(distanceM(p, ZONE)).toBeLessThanOrEqual(48 + 1e-6);
  });
  it("a site counts as explored within 4 m, not at 5 m", () => {
    const s = [{ id: "x", e: 10, n: 0, reachable: true }];
    expect(markVisited(new Set(), at(6, 0), s).has("x")).toBe(true);
    expect(markVisited(new Set(), at(5, 0), s).has("x")).toBe(false);
  });
  it("has 5 walkable NASA sites, all inside the exploration circle", () => {
    expect(REACHABLE).toHaveLength(5);
    for (const p of REACHABLE) expect(distanceM(p, ZONE)).toBeLessThan(ZONE.r);
  });
  it("Wright Brothers Field is ~64.3 m from Van Zyl Overlook, as NASA states", () => {
    const wbf = POIS.find((p) => p.id === "wbf")!;
    expect(Math.abs(distanceM(START_POSE, wbf) - 64.3)).toBeLessThan(2);
  });
  it("next target skips explored sites", () => {
    const t = nextTarget(START_POSE, REACHABLE, new Set(["van-zyl"]));
    expect(t?.spot.id).not.toBe("van-zyl");
  });
  it("zoom 1× keeps the 70° field of view", () => {
    expect(fovForZoom(1)).toBeCloseTo(70, 5);
    expect(fovForZoom(2)).toBeLessThan(40);
  });
});
