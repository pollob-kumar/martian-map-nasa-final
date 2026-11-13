import { expect, it } from "vitest";
import { advanceCrewPosition, isCrewSegmentClear, planCrewPath } from "./crewNavigation";

it("routes a walking robot around an object instead of through it", () => {
  const obstacles = [{ x: 0, z: 0, radius: 3 }];
  let position = { x: 0, z: 8 };
  const target = { x: 0, z: -8 };
  const path = planCrewPath(position, target, obstacles);
  expect(path.length).toBeGreaterThan(1);
  for (const point of path) {
    expect(isCrewSegmentClear(position, point, obstacles)).toBe(true);
    position = advanceCrewPosition(position, point, 100, obstacles);
  }
  expect(position).toEqual(target);
});

it("stops a large step from tunnelling through a photo post", () => {
  const position = { x: 0, z: 2 };
  expect(advanceCrewPosition(position, { x: 0, z: -2 }, 8, [{ x: 0, z: 0, radius: 0.1 }])).toEqual(position);
});

it("stays still when enclosed instead of teleporting through objects", () => {
  expect(planCrewPath({ x: 0, z: 0 }, { x: 0, z: -10 }, [{ x: 0, z: 0, radius: 2 }])).toEqual([]);
});