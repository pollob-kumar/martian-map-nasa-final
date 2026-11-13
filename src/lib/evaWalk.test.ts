import { expect, it } from "vitest";
import { advanceEvaWalk } from "./evaWalk";
it("WALK moves without a planned route", () => {
  expect(advanceEvaWalk(0, 0.8, 1)).toBe(0.8);
  expect(advanceEvaWalk(2, 0.8, 1, 0)).toBe(2.8);
});
it("planned walks stop at their destination", () => {
  expect(advanceEvaWalk(9, 2, 1, 10)).toBe(10);
});