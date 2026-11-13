import { describe, expect, it } from "vitest";
import { MARSWALK_ENTRY, MISSION_ENTRY_DELAY_MS, shouldEnterMission } from "./globeEntry";
describe("homepage mission entry", () => {
  it("waits three seconds", () => expect(MISSION_ENTRY_DELAY_MS).toBe(3000));
  it("opens Marswalk rather than the map setup", () => {
    expect(MARSWALK_ENTRY.to).toBe("/mission-map");
    expect(MARSWALK_ENTRY.search.marswalk).toBe(true);
  });
  it("enters after three scroll gestures", () => {
    expect(shouldEnterMission(2)).toBe(false);
    expect(shouldEnterMission(3)).toBe(true);
  });
});