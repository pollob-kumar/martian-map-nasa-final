import { expect, it } from "vitest";
import { isMarswalkEntry, visorReturnMarker } from "./visorReturn";

it("returns robot Visor visitors directly to Marswalk", () => {
  expect(isMarswalkEntry(visorReturnMarker("marswalk") === "marswalk")).toBe(true);
  expect(isMarswalkEntry("true")).toBe(true);
  expect(isMarswalkEntry(undefined)).toBe(false);
});

it("does not accept arbitrary return destinations", () => {
  expect(visorReturnMarker("https://other.example")).toBeUndefined();
  expect(visorReturnMarker(undefined)).toBeUndefined();
});