import { describe, expect, it } from "vitest";
import { bearingDeg, bracketCardinals, latLonToVec3, marsDistanceKm, marsSolDate, turnDeg } from "./mars";
import { BASE, SEGMENTS, WAYPOINTS } from "@/data/route";

describe("mars math", () => {
  it("one degree of latitude on Mars is ~59.16 km", () => {
    expect(marsDistanceKm(0, 0, 1, 0)).toBeCloseTo(59.157, 2);
  });
  it("bearing due east is 90 and due north is 0", () => {
    expect(bearingDeg(0, 0, 0, 1)).toBeCloseTo(90, 5);
    expect(bearingDeg(0, 0, 1, 0)).toBeCloseTo(0, 5);
  });
  it("turn from 350 to 10 is +20 (right)", () => {
    expect(turnDeg(350, 10)).toBe(20);
    expect(turnDeg(10, 350)).toBe(-20);
  });
  it("heading 30 sits between N and NE", () => {
    expect(bracketCardinals(30)).toEqual(["N", "NE"]);
  });
  it("Mars24 example: 2000-01-06 00:00 UTC is MSD ~44795.9998", () => {
    expect(marsSolDate(Date.UTC(2000, 0, 6))).toBeCloseTo(44795.9998, 3);
  });
  it("lon 0 maps to +x and lon 90E to -z on the globe", () => {
    const [x0] = latLonToVec3(0, 0);
    const [, , z90] = latLonToVec3(0, 90);
    expect(x0).toBeCloseTo(1);
    expect(z90).toBeCloseTo(-1);
  });
});

describe("Perseverance route data", () => {
  it("starts at Octavia E. Butler Landing in Jezero", () => {
    expect(BASE.lat).toBeCloseTo(18.4446, 3);
    expect(BASE.lon).toBeCloseTo(77.4509, 3);
  });
  it("has 708 NASA waypoints and drive segments", () => {
    expect(WAYPOINTS.length).toBe(708);
    expect(SEGMENTS.length).toBeGreaterThan(300);
  });
});
