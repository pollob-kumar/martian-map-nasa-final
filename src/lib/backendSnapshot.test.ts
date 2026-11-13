import { describe, expect, it } from "vitest";
import { snapshotPath } from "./backendSnapshot";

describe("snapshotPath", () => {
  it("maps region data to saved JSON", () => {
    expect(snapshotPath("/api/regions/jezero_delta/sites", "")).toEqual({
      path: "/backend-snapshot/api/regions/jezero_delta/sites.json",
      type: "application/json",
    });
  });
  it("maps map tiles to saved WebP pictures", () => {
    expect(snapshotPath("/api/layers/hillshade/tile/2/1/3.png", "")?.path).toBe(
      "/backend-snapshot/api/layers/hillshade/tile/2/1/3.webp",
    );
  });
  it("uses the saved 1400px preview and nothing else", () => {
    expect(snapshotPath("/api/layers/hazard/preview.png", "?size=1400")?.path).toBe(
      "/backend-snapshot/api/layers/hazard/preview-1400.webp",
    );
    expect(snapshotPath("/api/layers/hazard/preview.png", "?size=500")).toBeNull();
  });
  it("leaves live-only answers to the backend", () => {
    expect(snapshotPath("/api/route", "")).toBeNull();
    expect(snapshotPath("/api/terrain/probe", "?lat=1&lon=2")).toBeNull();
  });
});
