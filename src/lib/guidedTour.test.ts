import { describe, expect, it } from "vitest";
import { clampTourStop, TOUR_STOPS } from "@/data/guidedTour";
import { VISOR_PHOTOS } from "@/data/visorPhotos";

describe("landing-to-delta guided tour", () => {
  it("starts at the landing site and finishes at the river delta", () => {
    expect(TOUR_STOPS[0].id).toBe("landing");
    expect(TOUR_STOPS[TOUR_STOPS.length - 1]?.id).toBe("delta");
    for (const stop of TOUR_STOPS) {
      expect(VISOR_PHOTOS.some((photo) => photo.pia === stop.pia)).toBe(true);
    }
  });
  it("keeps previous and next within the tour", () => {
    expect(clampTourStop(-1)).toBe(0);
    expect(clampTourStop(1)).toBe(1);
    expect(clampTourStop(3)).toBe(2);
  });
});